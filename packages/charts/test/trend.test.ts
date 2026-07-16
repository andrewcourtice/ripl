import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

import {
    createAreaChart,
    createTrendChart,
} from '../src';

import type {
    Element,
    Group,
} from '@ripl/core';

polyfillPath2D();

interface Row {
    period: string;
    revenue: number;
    cost: number;
    units: number;
    target: number;
}

const DATA: Row[] = [
    {
        period: 'Q1',
        revenue: 400,
        cost: 40,
        units: 20,
        target: 100,
    },
    {
        period: 'Q2',
        revenue: 300,
        cost: 30,
        units: 25,
        target: 110,
    },
    {
        period: 'Q3',
        revenue: 200,
        cost: 50,
        units: 15,
        target: 90,
    },
];

/** Reaches into a chart's scene to inspect the rendered element graph. */
function sceneOf(chart: unknown): Group {
    return (chart as unknown as { scene: Group }).scene;
}

/** The paint-order z-index of a series group by id. */
function zIndexOf(chart: unknown, id: string): number {
    const element = sceneOf(chart).getElementById(id);

    expect(element).toBeDefined();

    return element!.zIndex;
}

/** Fires a synthetic click on a scene element (as the hover wiring would). */
function clickElement(element: Element, x: number, y: number): void {
    (element as unknown as { emit: (type: string, data: unknown) => void }).emit('click', {
        x,
        y,
    });
}

describe('TrendChart', () => {

    function createMixedTrend(overrides: Record<string, unknown> = {}) {
        return createTrendChart<Row>(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: DATA,
            key: 'period',
            series: [
                {
                    id: 'revenue',
                    type: 'area',
                    label: 'Revenue',
                    value: 'revenue',
                },
                {
                    id: 'cost',
                    type: 'area',
                    label: 'Cost',
                    value: 'cost',
                },
                {
                    id: 'units',
                    type: 'bar',
                    label: 'Units',
                    value: 'units',
                },
                {
                    id: 'target',
                    type: 'line',
                    label: 'Target',
                    value: 'target',
                },
            ],
            ...overrides,
        });
    }

    test('Should render a mixed line/bar/area chart into a canvas', async () => {
        mockCanvasContext();

        const target = document.createElement('div');
        const chart = createTrendChart<Row>(target, {
            animation: false,
            data: DATA,
            key: 'period',
            series: [
                {
                    id: 'revenue',
                    type: 'area',
                    label: 'Revenue',
                    value: 'revenue',
                },
                {
                    id: 'units',
                    type: 'bar',
                    label: 'Units',
                    value: 'units',
                },
                {
                    id: 'target',
                    type: 'line',
                    label: 'Target',
                    value: 'target',
                },
            ],
        });

        await chart.render();

        expect(target.querySelector('canvas')).not.toBeNull();
        expect(sceneOf(chart).getElementById('__plot-content')).toBeDefined();

        chart.destroy();
    });

    test('Should paint back-to-front area -> bar -> line, largest area at the back', async () => {
        mockCanvasContext();

        const chart = createMixedTrend();

        await chart.render();

        const revenue = zIndexOf(chart, 'revenue'); // area, Σ = 900 (largest)
        const cost = zIndexOf(chart, 'cost'); // area, Σ = 120 (smaller)
        const units = zIndexOf(chart, 'units'); // bar
        const target = zIndexOf(chart, 'target'); // line

        // Largest area furthest back, smaller area in front of it, both behind bars, bars behind lines.
        expect(revenue).toBeLessThan(cost);
        expect(cost).toBeLessThan(units);
        expect(units).toBeLessThan(target);

        chart.destroy();
    });

    test('Should stack same-type series without throwing', async () => {
        mockCanvasContext();

        const chart = createMixedTrend({ stacked: true });

        await expect(chart.render()).resolves.not.toThrow();
        expect(sceneOf(chart).getElementById('revenue')).toBeDefined();

        chart.destroy();
    });

    test('Should emit enriched bar events with seriesId, xValue and yValue', async () => {
        mockCanvasContext();

        const chart = createMixedTrend();

        await chart.render();

        const events: unknown[] = [];
        chart.on('barclick', event => events.push(event.data));

        const bar = sceneOf(chart).getElementById('units-Q1');
        expect(bar).toBeDefined();

        clickElement(bar!, 12, 34);

        expect(events).toHaveLength(1);
        expect(events[0]).toMatchObject({
            seriesId: 'units',
            xValue: 'Q1',
            yValue: 20,
        });

        chart.destroy();
    });

    test('Should create a navigator the overview strip can drive when overview is enabled', async () => {
        mockCanvasContext();

        const chart = createMixedTrend({ overview: true });

        await chart.render();

        expect(chart.navigator).toBeDefined();
        // The strip drives the shared transform; windowing to the first half zooms x by 2.
        expect(() => chart.navigator?.setTransform({
            k: 2,
            x: 0,
            y: 0,
        })).not.toThrow();
        expect(chart.navigator?.transform.k).toBe(2);

        chart.destroy();
    });

    test('Should not create a navigator without the overview strip or a navigator option', async () => {
        mockCanvasContext();

        const chart = createMixedTrend();

        await chart.render();

        expect(chart.navigator).toBeUndefined();

        chart.destroy();
    });

});

describe('AreaChart paint ordering', () => {

    test('Should paint the largest area at the back', async () => {
        mockCanvasContext();

        const chart = createAreaChart<Row>(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: DATA,
            key: 'period',
            series: [
                {
                    id: 'revenue',
                    label: 'Revenue',
                    value: 'revenue', // Σ = 900 (largest)
                },
                {
                    id: 'cost',
                    label: 'Cost',
                    value: 'cost', // Σ = 120 (smaller)
                },
            ],
        });

        await chart.render();

        // Largest area sits furthest back (lowest z-index) so the smaller area stays visible.
        expect(zIndexOf(chart, 'revenue')).toBeLessThan(zIndexOf(chart, 'cost'));

        chart.destroy();
    });

});
