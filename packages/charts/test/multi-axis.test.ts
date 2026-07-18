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
    createAreaChart,
    createLineChart,
    createScatterChart,
} from '../src';

interface AxisInternals {
    alignment: string;
    scale: {
        (value: number): number;
        domain: number[];
    };
}

interface SceneElementInternals {
    cy: number;
    emit(event: string, payload?: unknown): void;
}

function yAxes(chart: unknown): AxisInternals[] {
    return (chart as { yAxes: AxisInternals[] }).yAxes;
}

function seriesGroups(chart: unknown): unknown[] {
    return (chart as { _series: { groups: unknown[] } })._series.groups;
}

function secondarySeriesGroups(chart: unknown): unknown[] {
    return (chart as { _series2: { groups: unknown[] } })._series2.groups;
}

function bubbleGroups(chart: unknown): unknown[] {
    return (chart as { _bubbleGroups: unknown[] })._bubbleGroups;
}

function sceneElement(chart: unknown, id: string): SceneElementInternals | null {
    return (chart as { scene: { getElementById(id: string): SceneElementInternals | null } }).scene.getElementById(id);
}

function clickLegendItem(chart: unknown, id: string) {
    const swatch = sceneElement(chart, `legend-swatch-${id}`);

    expect(swatch).toBeTruthy();
    swatch?.emit('click');
}

function createDualAxisAreaChart(stacked = false) {
    polyfillPath2D();
    mockCanvasContext();

    return createAreaChart(document.createElement('div'), {
        autoRender: false,
        animation: false,
        stacked,
        data: [
            {
                m: 'a',
                small: 10,
                large: 1000,
            },
            {
                m: 'b',
                small: 20,
                large: 3000,
            },
        ],
        key: 'm',
        series: [
            {
                id: 'left',
                label: 'Left',
                value: 'small',
            },
            {
                id: 'right',
                label: 'Right',
                value: 'large',
                axis: 1,
            },
        ],
        axis: {
            y: [
                { title: 'Left' },
                {
                    position: 'right',
                    title: 'Right',
                },
            ],
        },
    });
}

function createDualAxisScatterChart() {
    polyfillPath2D();
    mockCanvasContext();

    return createScatterChart(document.createElement('div'), {
        autoRender: false,
        animation: false,
        data: [
            {
                id: 'p1',
                x: 1,
                small: 10,
                large: 1000,
            },
            {
                id: 'p2',
                x: 2,
                small: 20,
                large: 3000,
            },
        ],
        key: 'id',
        series: [
            {
                id: 'left',
                label: 'Left',
                xBy: 'x',
                yBy: 'small',
            },
            {
                id: 'right',
                label: 'Right',
                xBy: 'x',
                yBy: 'large',
                axis: 1,
            },
        ],
        axis: {
            y: [
                { title: 'Left' },
                {
                    position: 'right',
                    title: 'Right',
                },
            ],
        },
    });
}

describe('secondary y-axis (line)', () => {

    it('builds two independent y-axes and binds series by axis, secondary on the right', async () => {
        polyfillPath2D();
        mockCanvasContext();

        const chart = createLineChart(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: [
                {
                    m: 'a',
                    small: 10,
                    large: 1000,
                },
                {
                    m: 'b',
                    small: 20,
                    large: 3000,
                },
            ],
            key: 'm',
            series: [
                {
                    id: 'left',
                    label: 'Left',
                    value: 'small',
                },
                {
                    id: 'right',
                    label: 'Right',
                    value: 'large',
                    axis: 1,
                },
            ],
            axis: {
                y: [
                    { title: 'Left' },
                    {
                        position: 'right',
                        title: 'Right',
                    },
                ],
            },
        });

        await chart.render();

        const axes = yAxes(chart);

        expect(axes.length).toBe(2);

        // Each axis scales to its own series' extent — the secondary domain is an order larger
        // (visual positioning of the right-hand axis is covered by the visual gallery).
        expect(axes[1].scale.domain[1]).toBeGreaterThan(axes[0].scale.domain[1] * 10);
    });

    it('keeps a single y-axis when no secondary axis is configured', async () => {
        polyfillPath2D();
        mockCanvasContext();

        const chart = createLineChart(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: [{
                m: 'a',
                v: 10,
            }],
            key: 'm',
            series: [{
                id: 'v',
                label: 'V',
                value: 'v',
            }],
        });

        await chart.render();

        expect(yAxes(chart).length).toBe(1);
    });

});

describe('secondary y-axis (area)', () => {

    it('builds two independent y-axes and binds series by axis, secondary on the right', async () => {
        const chart = createDualAxisAreaChart();

        await chart.render();

        const axes = yAxes(chart);

        expect(axes.length).toBe(2);
        expect(axes[1].alignment).toBe('right');

        // Each axis scales to its own series' extent — the secondary domain is an order larger
        // (visual positioning of the right-hand axis is covered by the visual gallery).
        expect(axes[1].scale.domain[1]).toBeGreaterThan(axes[0].scale.domain[1] * 10);
    });

    it('stacks series per axis group', async () => {
        polyfillPath2D();
        mockCanvasContext();

        const chart = createAreaChart(document.createElement('div'), {
            autoRender: false,
            animation: false,
            stacked: true,
            data: [
                {
                    m: 'a',
                    s1: 10,
                    s2: 20,
                    other: 1000,
                },
                {
                    m: 'b',
                    s1: 20,
                    s2: 30,
                    other: 3000,
                },
            ],
            key: 'm',
            series: [
                {
                    id: 's1',
                    label: 'S1',
                    value: 's1',
                },
                {
                    id: 's2',
                    label: 'S2',
                    value: 's2',
                },
                {
                    id: 'other',
                    label: 'Other',
                    value: 'other',
                    axis: 1,
                },
            ],
            axis: {
                y: [
                    {},
                    {},
                ],
            },
        });

        await chart.render();

        const axes = yAxes(chart);

        // The primary axis covers only its own group's cumulative total (s1 + s2), untouched by
        // the secondary series; the secondary covers its lone series without the primary stack.
        expect(axes[0].scale.domain.at(-1)).toBeGreaterThanOrEqual(50);
        expect(axes[0].scale.domain.at(-1)).toBeLessThan(1000);
        expect(axes[1].scale.domain.at(-1)).toBeGreaterThanOrEqual(3000);

        // Geometry: s2 stacks on s1 within the primary group (cumulative 50 at item b), while the
        // secondary series sits at its raw value against its own axis scale.
        expect(sceneElement(chart, 's2-marker-b')?.cy).toBeCloseTo(axes[0].scale(50));
        expect(sceneElement(chart, 'other-marker-b')?.cy).toBeCloseTo(axes[1].scale(3000));
    });

    it('rescales only the bound axis when a series is toggled via the legend', async () => {
        const chart = createDualAxisAreaChart();

        await chart.render();

        expect(seriesGroups(chart).length).toBe(1);
        expect(secondarySeriesGroups(chart).length).toBe(1);
        expect(yAxes(chart)[1].scale.domain.at(-1)).toBeGreaterThanOrEqual(3000);

        const primaryMax = yAxes(chart)[0].scale.domain.at(-1);

        clickLegendItem(chart, 'right');
        await chart.render();

        expect(secondarySeriesGroups(chart).length).toBe(0);
        expect(yAxes(chart)[1].scale.domain.at(-1)).toBeLessThan(3000);
        expect(yAxes(chart)[0].scale.domain.at(-1)).toBe(primaryMax);

        const domains = yAxes(chart).flatMap(axis => axis.scale.domain);

        expect(domains.every(Number.isFinite)).toBe(true);

        clickLegendItem(chart, 'right');
        await chart.render();

        expect(secondarySeriesGroups(chart).length).toBe(1);
        expect(yAxes(chart)[1].scale.domain.at(-1)).toBeGreaterThanOrEqual(3000);
    });

    it('keeps a single y-axis when no secondary axis is configured', async () => {
        polyfillPath2D();
        mockCanvasContext();

        const chart = createAreaChart(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: [{
                m: 'a',
                v: 10,
            }],
            key: 'm',
            series: [{
                id: 'v',
                label: 'V',
                value: 'v',
            }],
        });

        await chart.render();

        expect(yAxes(chart).length).toBe(1);
    });

});

describe('secondary y-axis (scatter)', () => {

    it('builds two independent y-axes and binds series by axis, secondary on the right', async () => {
        const chart = createDualAxisScatterChart();

        await chart.render();

        const axes = yAxes(chart);

        expect(axes.length).toBe(2);
        expect(axes[1].alignment).toBe('right');

        // Each axis scales to its own series' y extent — the secondary domain is an order larger
        // (visual positioning of the right-hand axis is covered by the visual gallery).
        expect(axes[1].scale.domain.at(-1)!).toBeGreaterThan(axes[0].scale.domain.at(-1)! * 10);
    });

    it('positions bubbles against their series\' bound axis scale', async () => {
        const chart = createDualAxisScatterChart();

        await chart.render();

        const axes = yAxes(chart);
        const bubble = sceneElement(chart, 'right-p2');

        expect(bubble).toBeTruthy();
        expect(bubble?.cy).toBeCloseTo(axes[1].scale(3000));

        // The primary scale would place the same value far outside its own range.
        expect(Math.abs((bubble?.cy ?? 0) - axes[0].scale(3000))).toBeGreaterThan(1);
    });

    it('rescales only the bound axis when a series is toggled via the legend', async () => {
        const chart = createDualAxisScatterChart();

        await chart.render();

        expect(bubbleGroups(chart).length).toBe(2);
        expect(yAxes(chart)[1].scale.domain.at(-1)).toBeGreaterThanOrEqual(3000);

        const primaryMax = yAxes(chart)[0].scale.domain.at(-1);

        clickLegendItem(chart, 'right');
        await chart.render();

        expect(bubbleGroups(chart).length).toBe(1);
        expect(yAxes(chart)[1].scale.domain.at(-1)).toBeLessThan(3000);
        expect(yAxes(chart)[0].scale.domain.at(-1)).toBe(primaryMax);

        const domains = yAxes(chart).flatMap(axis => axis.scale.domain);

        expect(domains.every(Number.isFinite)).toBe(true);

        clickLegendItem(chart, 'right');
        await chart.render();

        expect(bubbleGroups(chart).length).toBe(2);
        expect(yAxes(chart)[1].scale.domain.at(-1)).toBeGreaterThanOrEqual(3000);
    });

    it('keeps a single y-axis when no secondary axis is configured', async () => {
        polyfillPath2D();
        mockCanvasContext();

        const chart = createScatterChart(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: [{
                id: 'p1',
                x: 1,
                y: 10,
            }],
            key: 'id',
            series: [{
                id: 'points',
                label: 'Points',
                xBy: 'x',
                yBy: 'y',
            }],
        });

        await chart.render();

        expect(yAxes(chart).length).toBe(1);
    });

});
