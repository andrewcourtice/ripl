// Side-effect import: `@ripl/web` registers the browser factory (canvas context, text
// measurement, rAF). `@ripl/charts` is context-agnostic and installs no backend of its own.
import '@ripl/web';

import {
    describe,
    expect,
    it,
} from 'vitest';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

import type {
    Group,
    Scene,
} from '@ripl/core';

import {
    createBoxPlotChart,
    createHistogramChart,
    createLineChart,
    createTrendChart,
} from '../src';

function annotationGroup(chart: unknown): Group | undefined {
    const scene = (chart as { scene: Scene }).scene;
    return scene.getElementById('chart-annotations') as Group | undefined;
}

describe('cartesian annotations', () => {

    it('renders reference lines and bands over the plot', async () => {
        polyfillPath2D();
        mockCanvasContext();

        const chart = createLineChart(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: [
                {
                    m: 'a',
                    v: 10,
                },
                {
                    m: 'b',
                    v: 90,
                },
            ],
            key: 'm',
            series: [{
                id: 's',
                label: 'S',
                value: 'v',
            }],
            annotations: [
                {
                    axis: 'y',
                    value: 50,
                    label: 'target',
                },
                {
                    type: 'band',
                    axis: 'y',
                    from: 20,
                    to: 40,
                },
            ],
        });

        await chart.render();

        const group = annotationGroup(chart);

        expect(group).toBeDefined();
        expect(group!.getElementsByType('line').length).toBeGreaterThanOrEqual(1);
        expect(group!.getElementsByType('rect').length).toBe(1);
        expect(group!.getElementsByType('text').length).toBe(1);
    });

    it('draws no annotation layer when none are configured', async () => {
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
                id: 's',
                label: 'S',
                value: 'v',
            }],
        });

        await chart.render();

        expect(annotationGroup(chart)).toBeUndefined();
    });

});

describe('charts that advertise cartesian furniture actually draw it', () => {

    // Cartesian options are accepted by every chart but only work where the component is wired in.

    function crosshair(chart: unknown) {
        return (chart as { crosshair?: object }).crosshair;
    }

    it('gives the box plot a working crosshair', async () => {
        polyfillPath2D();
        mockCanvasContext();

        const chart = createBoxPlotChart(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: [
                {
                    g: 'a',
                    v: 1,
                },
                {
                    g: 'a',
                    v: 4,
                },
                {
                    g: 'a',
                    v: 9,
                },
                {
                    g: 'b',
                    v: 2,
                },
                {
                    g: 'b',
                    v: 6,
                },
                {
                    g: 'b',
                    v: 11,
                },
            ],
            key: 'g',
            value: 'v',
            crosshair: true,
        });

        await chart.render();

        expect(crosshair(chart)).toBeDefined();

        chart.update({ crosshair: false });
        await chart.render();

        expect(crosshair(chart)).toBeUndefined();
    });

    it('gives the histogram a working crosshair', async () => {
        polyfillPath2D();
        mockCanvasContext();

        const chart = createHistogramChart(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: [1, 2, 2, 3, 5, 8, 8, 9].map(v => ({ v })),
            value: 'v',
            crosshair: true,
        });

        await chart.render();

        expect(crosshair(chart)).toBeDefined();

        chart.update({ crosshair: false });
        await chart.render();

        expect(crosshair(chart)).toBeUndefined();
    });

    it('draws annotations on the trend chart', async () => {
        polyfillPath2D();
        mockCanvasContext();

        const chart = createTrendChart(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: [
                {
                    m: 'a',
                    v: 10,
                },
                {
                    m: 'b',
                    v: 40,
                },
            ],
            key: 'm',
            series: [{
                type: 'line',
                id: 'v',
                label: 'V',
                value: 'v',
            }],
            annotations: [{
                axis: 'y',
                value: 25,
                label: 'Target',
            }],
        });

        await chart.render();

        expect(annotationGroup(chart)).toBeDefined();

        chart.update({ annotations: [] });
        await chart.render();

        expect(annotationGroup(chart)?.children.length ?? 0).toBe(0);
    });

});
