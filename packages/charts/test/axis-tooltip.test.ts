import {
    describe,
    expect,
    it,
} from 'vitest';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

import {
    createBarChart,
    createLineChart,
    createScatterChart,
} from '../src';

import type {
    ChartTooltipInput,
} from '../src';

interface AxisTooltipInternals {
    _xScale: (key: string) => number;
    yAxis: {
        scale: (value: number) => number;
    };
    scene: {
        context: {
            emit(event: string, data: unknown): void;
        };
        getElementById(id: string): {
            emit(event: string, payload?: unknown): void;
            getElementsByType(type: string): {
                content?: string;
            }[];
        } | null;
    };
}

function internals(chart: unknown): AxisTooltipInternals {
    return chart as AxisTooltipInternals;
}

function createChart(tooltip?: ChartTooltipInput) {
    polyfillPath2D();
    mockCanvasContext();

    const chart = createLineChart(document.createElement('div'), {
        autoRender: false,
        animation: false,
        tooltip,
        data: [
            {
                m: 'a',
                one: 10,
                two: 40,
            },
            {
                m: 'b',
                one: 20,
                two: 60,
            },
            {
                m: 'c',
                one: 30,
                two: 80,
            },
        ],
        key: 'm',
        series: [
            {
                id: 'one',
                label: 'One',
                value: 'one',
            },
            {
                id: 'two',
                label: 'Two',
                value: 'two',
            },
        ],
    });

    // jsdom provides no layout, so the scene starts 0×0 and the plot rectangle is degenerate —
    // size the context directly so pointer containment has a real plot to test against.
    (internals(chart).scene.context as unknown as { rescale(width: number, height: number): void }).rescale(600, 400);

    return chart;
}

function hoverCategory(chart: unknown, key: string, value: number) {
    internals(chart).scene.context.emit('mousemove', {
        x: internals(chart)._xScale(key),
        y: internals(chart).yAxis.scale(value),
    });
}

function tooltipLines(chart: unknown): string[] {
    const group = internals(chart).scene.getElementById('tooltip');

    if (!group) {
        return [];
    }

    return group.getElementsByType('text').map(text => text.content ?? '');
}

describe('Shared axis tooltip', () => {

    it('shows the category title and one row per active series with trigger: axis', async () => {
        const chart = createChart({ trigger: 'axis' });

        await chart.render();

        hoverCategory(chart, 'b', 40);

        expect(tooltipLines(chart)).toEqual([
            'b',
            'One: 20',
            'Two: 60',
        ]);
    });

    it('resolves the nearest category from the pointer position', async () => {
        const chart = createChart({ trigger: 'axis' });

        await chart.render();

        internals(chart).scene.context.emit('mousemove', {
            x: internals(chart)._xScale('c') - 2,
            y: internals(chart).yAxis.scale(40),
        });

        expect(tooltipLines(chart)[0]).toBe('c');
    });

    it('does not react to plot hover with the default item trigger', async () => {
        const chart = createChart();

        await chart.render();

        hoverCategory(chart, 'b', 40);

        expect(internals(chart).scene.getElementById('tooltip')).toBeFalsy();
    });

    it('excludes legend-hidden series from the rows', async () => {
        const chart = createChart({ trigger: 'axis' });

        await chart.render();

        internals(chart).scene.getElementById('legend-swatch-two')?.emit('click');
        await chart.render();

        hoverCategory(chart, 'b', 15);

        expect(tooltipLines(chart)).toEqual([
            'b',
            'One: 20',
        ]);
    });

    it('activates the axis trigger at runtime through update()', async () => {
        const chart = createChart();

        await chart.render();

        chart.update({
            tooltip: {
                trigger: 'axis',
            },
        });

        await chart.render();

        hoverCategory(chart, 'a', 30);

        expect(tooltipLines(chart)[0]).toBe('a');
    });

});

interface BarAxisTooltipInternals {
    xAxis: {
        scale: (key: string) => number;
    };
    yAxis: {
        scale: (value: number) => number;
    };
    scene: {
        context: {
            emit(event: string, data: unknown): void;
            rescale(width: number, height: number): void;
        };
        getElementById(id: string): {
            emit(event: string, payload?: unknown): void;
        } | null;
    };
}

function barInternals(chart: unknown): BarAxisTooltipInternals {
    return chart as BarAxisTooltipInternals;
}

function createBar(tooltip?: ChartTooltipInput) {
    polyfillPath2D();
    mockCanvasContext();

    const chart = createBarChart(document.createElement('div'), {
        autoRender: false,
        animation: false,
        tooltip,
        data: [
            {
                m: 'a',
                one: 10,
                two: 40,
            },
            {
                m: 'b',
                one: 20,
                two: 60,
            },
            {
                m: 'c',
                one: 30,
                two: 80,
            },
        ],
        key: 'm',
        series: [
            {
                id: 'one',
                label: 'One',
                value: 'one',
            },
            {
                id: 'two',
                label: 'Two',
                value: 'two',
            },
        ],
    });

    barInternals(chart).scene.context.rescale(600, 400);

    return chart;
}

describe('Shared axis tooltip (bar)', () => {

    it('shows the category title and one row per active series with trigger: axis', async () => {
        const chart = createBar({ trigger: 'axis' });

        await chart.render();

        barInternals(chart).scene.context.emit('mousemove', {
            x: barInternals(chart).xAxis.scale('b'),
            y: barInternals(chart).yAxis.scale(30),
        });

        expect(tooltipLines(chart)).toEqual([
            'b',
            'One: 20',
            'Two: 60',
        ]);
    });

    it('does not react to plot hover with the default item trigger', async () => {
        const chart = createBar();

        await chart.render();

        barInternals(chart).scene.context.emit('mousemove', {
            x: barInternals(chart).xAxis.scale('b'),
            y: barInternals(chart).yAxis.scale(30),
        });

        expect(barInternals(chart).scene.getElementById('tooltip')).toBeFalsy();
    });

    it('excludes legend-hidden series from the rows', async () => {
        const chart = createBar({ trigger: 'axis' });

        await chart.render();

        barInternals(chart).scene.getElementById('legend-swatch-two')?.emit('click');
        await chart.render();

        barInternals(chart).scene.context.emit('mousemove', {
            x: barInternals(chart).xAxis.scale('b'),
            y: barInternals(chart).yAxis.scale(15),
        });

        expect(tooltipLines(chart)).toEqual([
            'b',
            'One: 20',
        ]);
    });

    it('activates the axis trigger at runtime through update()', async () => {
        const chart = createBar();

        await chart.render();

        chart.update({
            tooltip: {
                trigger: 'axis',
            },
        });

        await chart.render();

        barInternals(chart).scene.context.emit('mousemove', {
            x: barInternals(chart).xAxis.scale('a'),
            y: barInternals(chart).yAxis.scale(20),
        });

        expect(tooltipLines(chart)[0]).toBe('a');
    });

});

interface ScatterAxisTooltipInternals {
    _xScale: (value: number) => number;
    _yScale: (value: number) => number;
    scene: {
        context: {
            emit(event: string, data: unknown): void;
            rescale(width: number, height: number): void;
        };
        getElementById(id: string): {
            emit(event: string, payload?: unknown): void;
        } | null;
    };
}

function scatterInternals(chart: unknown): ScatterAxisTooltipInternals {
    return chart as ScatterAxisTooltipInternals;
}

function createScatter(tooltip?: ChartTooltipInput) {
    polyfillPath2D();
    mockCanvasContext();

    const chart = createScatterChart(document.createElement('div'), {
        autoRender: false,
        animation: false,
        tooltip,
        data: [
            {
                id: 'p1',
                x: 1,
                y: 10,
            },
            {
                id: 'p2',
                x: 2,
                y: 60,
            },
        ],
        key: 'id',
        series: [
            {
                id: 's',
                label: 'S',
                xBy: 'x',
                yBy: 'y',
            },
        ],
    });

    scatterInternals(chart).scene.context.rescale(600, 400);

    return chart;
}

describe('Shared axis tooltip (scatter)', () => {

    it('shows the nearest point\'s series and coordinates with trigger: axis', async () => {
        const chart = createScatter({ trigger: 'axis' });

        await chart.render();

        // Hover a couple pixels off the p2 bubble — the nearest data point still resolves to it.
        scatterInternals(chart).scene.context.emit('mousemove', {
            x: scatterInternals(chart)._xScale(2) + 2,
            y: scatterInternals(chart)._yScale(60) - 2,
        });

        expect(tooltipLines(chart)).toEqual([
            'S',
            '2: 60',
        ]);
    });

    it('does not react to plot hover with the default item trigger', async () => {
        const chart = createScatter();

        await chart.render();

        scatterInternals(chart).scene.context.emit('mousemove', {
            x: scatterInternals(chart)._xScale(2),
            y: scatterInternals(chart)._yScale(60),
        });

        expect(scatterInternals(chart).scene.getElementById('tooltip')).toBeFalsy();
    });

    it('activates the axis trigger at runtime through update()', async () => {
        const chart = createScatter();

        await chart.render();

        chart.update({
            tooltip: {
                trigger: 'axis',
            },
        });

        await chart.render();

        scatterInternals(chart).scene.context.emit('mousemove', {
            x: scatterInternals(chart)._xScale(1),
            y: scatterInternals(chart)._yScale(10),
        });

        expect(tooltipLines(chart)).toEqual([
            'S',
            '1: 10',
        ]);
    });

});
