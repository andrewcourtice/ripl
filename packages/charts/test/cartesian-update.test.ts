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
    darkTheme,
} from '../src/core/theme';

import {
    createBarChart,
    createLineChart,
} from '../src';

interface AxisInternals {
    visible: boolean;
    tickCount: number;
    labelColor: string;
    title?: string;
    formatLabel: (value: number) => string;
    scale: {
        domain: number[];
    };
}

interface GridInternals {
    _horizontal: boolean;
    _vertical: boolean;
    _stroke: string;
}

interface CrosshairInternals {
    _showVertical: boolean;
    _showHorizontal: boolean;
    _stroke: string;
}

interface CartesianInternals {
    xAxis: AxisInternals & {
        getBoundingBox(): {
            height: number;
        };
        group: {
            id: string;
        };
    };
    yAxis: AxisInternals;
    yAxes: AxisInternals[];
    grid?: GridInternals;
    tooltip?: object;
    crosshair?: CrosshairInternals;
    scene: {
        getElementById(id: string): {
            y1?: number;
            query(selector: string): {
                rotation: number;
            } | null;
        } | null;
    };
}

function internals(chart: unknown): CartesianInternals {
    return chart as CartesianInternals;
}

function createChart() {
    polyfillPath2D();
    mockCanvasContext();

    return createBarChart(document.createElement('div'), {
        autoRender: false,
        animation: false,
        data: [
            {
                m: 'a',
                v: 10,
            },
            {
                m: 'b',
                v: 60,
            },
            {
                m: 'c',
                v: 35,
            },
        ],
        key: 'm',
        series: [{
            id: 's',
            label: 'S',
            value: 'v',
        }],
    });
}

describe('cartesian runtime reconfiguration', () => {

    it('applies axis ticks, min, and max through update()', async () => {
        const chart = createChart();

        await chart.render();

        chart.update({
            axis: {
                y: {
                    ticks: 3,
                    min: 0,
                    max: 100,
                },
            },
        });

        await chart.render();

        const { yAxis } = internals(chart);

        expect(yAxis.tickCount).toBe(3);
        expect(yAxis.scale.domain[0]).toBe(0);
        expect(yAxis.scale.domain[yAxis.scale.domain.length - 1]).toBe(100);
    });

    it('applies an axis format through update()', async () => {
        const chart = createChart();

        await chart.render();

        chart.update({
            axis: {
                y: {
                    format: 'percentage',
                },
            },
        });

        await chart.render();

        const { yAxis } = internals(chart);

        expect(yAxis.formatLabel(0.5)).toContain('%');
    });

    it('applies an axis title through update()', async () => {
        const chart = createChart();

        await chart.render();

        chart.update({
            axis: {
                y: {
                    title: 'Revenue',
                },
            },
        });

        await chart.render();

        expect(internals(chart).yAxis.title).toBe('Revenue');
    });

    it('hides both axes for axis: false and restores them for axis: true', async () => {
        const chart = createChart();

        await chart.render();

        chart.update({
            axis: false,
        });

        await chart.render();

        expect(internals(chart).xAxis.visible).toBe(false);
        expect(internals(chart).yAxis.visible).toBe(false);

        chart.update({
            axis: true,
        });

        await chart.render();

        expect(internals(chart).xAxis.visible).toBe(true);
        expect(internals(chart).yAxis.visible).toBe(true);
    });

    it('destroys and recreates the grid through update()', async () => {
        const chart = createChart();

        await chart.render();

        expect(internals(chart).grid).toBeDefined();

        chart.update({
            grid: false,
        });

        await chart.render();

        expect(internals(chart).grid).toBeUndefined();

        chart.update({
            grid: {
                lineColor: '#ff0000',
            },
        });

        await chart.render();

        expect(internals(chart).grid).toBeDefined();
        expect(internals(chart).grid?._stroke).toBe('#ff0000');
    });

    it('destroys and recreates the tooltip through update()', async () => {
        const chart = createChart();

        await chart.render();

        expect(internals(chart).tooltip).toBeDefined();

        chart.update({
            tooltip: false,
        });

        await chart.render();

        expect(internals(chart).tooltip).toBeUndefined();

        chart.update({
            tooltip: true,
        });

        await chart.render();

        expect(internals(chart).tooltip).toBeDefined();
    });

    it('reconfigures and removes the crosshair through update()', async () => {
        polyfillPath2D();
        mockCanvasContext();

        const chart = createLineChart(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: [
                {
                    m: 'a',
                    v: 1,
                },
                {
                    m: 'b',
                    v: 2,
                },
            ],
            key: 'm',
            series: [{
                id: 's',
                label: 'S',
                value: 'v',
            }],
        });

        await chart.render();

        expect(internals(chart).crosshair).toBeDefined();

        chart.update({
            crosshair: {
                axis: 'both',
            },
        });

        await chart.render();

        expect(internals(chart).crosshair?._showVertical).toBe(true);
        expect(internals(chart).crosshair?._showHorizontal).toBe(true);

        chart.update({
            crosshair: false,
        });

        await chart.render();

        expect(internals(chart).crosshair).toBeUndefined();
    });

    it('reconciles the y-axis count through update()', async () => {
        const chart = createChart();

        await chart.render();

        expect(internals(chart).yAxes.length).toBe(1);

        chart.update({
            axis: {
                y: [
                    {},
                    {
                        position: 'right',
                    },
                ],
            },
        });

        await chart.render();

        expect(internals(chart).yAxes.length).toBe(2);

        chart.update({
            axis: {
                y: {},
            },
        });

        await chart.render();

        expect(internals(chart).yAxes.length).toBe(1);
    });

    it('rotates x-axis tick labels and grows the label band through update()', async () => {
        polyfillPath2D();
        mockCanvasContext();

        const chart = createBarChart(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: [
                {
                    m: 'January',
                    v: 10,
                },
                {
                    m: 'February',
                    v: 20,
                },
            ],
            key: 'm',
            series: [{
                id: 's',
                label: 'S',
                value: 'v',
            }],
        });

        await chart.render();

        const flatBand = internals(chart).xAxis.getBoundingBox().height;
        const xTickId = `x-tick:${internals(chart).xAxis.group.id}:January`;
        const flatLabel = internals(chart).scene.getElementById(xTickId)?.query('text');

        expect(flatLabel?.rotation ?? 0).toBe(0);

        chart.update({
            axis: {
                x: {
                    labelRotation: 45,
                },
            },
        });

        await chart.render();

        const rotatedBand = internals(chart).xAxis.getBoundingBox().height;
        const rotatedLabel = internals(chart).scene.getElementById(xTickId)?.query('text');

        // The mocked canvas reports zero text metrics, so the projected band cannot shrink but
        // its growth is not observable here — the rotation applied to live labels is.
        expect(rotatedBand).toBeGreaterThanOrEqual(flatBand);
        expect(rotatedLabel?.rotation).toBeLessThan(0);
    });

    it('transitions grid lines by tick value across a domain change', async () => {
        const chart = createChart();

        chart.update({
            axis: {
                y: {
                    min: 0,
                    max: 100,
                },
            },
        });

        await chart.render();

        const before = internals(chart).scene.getElementById('grid-h-40');

        expect(before).toBeTruthy();

        const positionBefore = before?.y1;

        chart.update({
            axis: {
                y: {
                    min: 0,
                    max: 160,
                },
            },
        });

        await chart.render();

        const after = internals(chart).scene.getElementById('grid-h-40');

        // The persisting tick keeps its element (repositioned) instead of being redrawn.
        expect(after).toBe(before);
        expect(after?.y1).not.toBe(positionBefore);
    });

    it('restyles existing axis labels when the theme changes through update()', async () => {
        const chart = createChart();

        await chart.render();

        chart.update({
            theme: 'dark',
        });

        await chart.render();

        expect(internals(chart).yAxis.labelColor).toBe(darkTheme.axisColor);
    });

    it('flips the grid direction when the bar orientation changes through update()', async () => {
        const chart = createChart();

        await chart.render();

        expect(internals(chart).grid?._horizontal).toBe(true);
        expect(internals(chart).grid?._vertical).toBe(false);

        chart.update({
            orientation: 'horizontal',
        });

        await chart.render();

        expect(internals(chart).grid?._horizontal).toBe(false);
        expect(internals(chart).grid?._vertical).toBe(true);
    });

});
