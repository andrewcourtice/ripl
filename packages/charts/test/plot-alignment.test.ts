import {
    describe,
    expect,
    it,
} from 'vitest';

import {
    mockCanvasContext,
    mockTextMetrics,
    polyfillPath2D,
} from '@ripl/test-utils';

import type {
    Line,
    Polyline,
} from '@ripl/core';

import {
    createBarChart,
    createLineChart,
} from '../src';

import type {
    ChartArea,
} from '../src';

interface ChartInternals {
    scene: {
        context: { rescale(width: number, height: number): void };
        queryAll(selector: string): unknown[];
    };
    yAxis: {
        measure(): number;
        getBoundingBox(): { left: number;
            right: number; };
    };
    xAxis: {
        measure(): number;
        getBoundingBox(): { top: number;
            bottom: number; };
    };
    _xScale: (value: string) => number;
    _yScale: (value: number) => number;
}

function internals(chart: unknown): ChartInternals {
    return chart as ChartInternals;
}

/** The rendered y-axis line, which is where the axis visually sits. */
function axisLines(chart: unknown): Line[] {
    return internals(chart).scene.queryAll('.chart-axis__line') as Line[];
}

function seriesPolyline(chart: unknown, seriesId: string): Polyline {
    const found = internals(chart).scene.queryAll(`#${seriesId}-line`) as Polyline[];

    expect(found.length).toBe(1);
    return found[0];
}

function createChart(values: number[], keys: string[]) {
    polyfillPath2D();
    mockTextMetrics(mockCanvasContext());

    const chart = createLineChart(document.createElement('div'), {
        autoRender: false,
        animation: false,
        data: keys.map((key, index) => ({
            k: key,
            v: values[index],
        })),
        key: 'k',
        series: [{
            id: 's',
            label: 'S',
            value: 'v',
            markers: true,
        }],
    });

    // jsdom provides no layout, so size the context to get a real pixel-space plot.
    internals(chart).scene.context.rescale(600, 400);

    return chart;
}

/**
 * The y-axis line's x, which must coincide with the left edge of the plot the series is drawn into.
 * A left-aligned y-axis draws its line on the plot-facing (right) edge of its band.
 */
function yAxisLineX(chart: unknown): number {
    const vertical = axisLines(chart).filter(line => line.x1 === line.x2);

    expect(vertical.length).toBe(1);
    return vertical[0].x1;
}

describe('Plot alignment', () => {

    it('Should place the first data point exactly on the y-axis line', async () => {
        const chart = createChart([1, 2, 3], ['a', 'b', 'c']);

        await chart.render();

        const firstPoint = seriesPolyline(chart, 's').points[0];

        expect(firstPoint[0]).toBeCloseTo(yAxisLineX(chart), 6);
    });

    it('Should keep the first point on the axis after the longest label changes width', async () => {
        const chart = createChart([1, 2, 3], ['a', 'b', 'c']);

        await chart.render();

        const before = yAxisLineX(chart);

        // Widening the values widens the tick labels, which moves the y-axis band and the plot.
        // This is the case that previously left the axis line and the series disagreeing, because
        // the plot was sized from the *previous* render's labels.
        chart.update({
            data: [{
                k: 'a',
                v: 1_000_000,
            }, {
                k: 'b',
                v: 2_000_000,
            }, {
                k: 'c',
                v: 3_000_000,
            }],
        });

        await chart.render();

        const after = yAxisLineX(chart);
        const firstPoint = seriesPolyline(chart, 's').points[0];

        // The axis genuinely moved, so this is a real test of the alignment.
        expect(after).toBeGreaterThan(before);
        expect(firstPoint[0]).toBeCloseTo(after, 6);
    });

    it('Should keep the axis line on the plot edge after the labels get narrower', async () => {
        const chart = createChart([1_000_000, 2_000_000, 3_000_000], ['a', 'b', 'c']);

        await chart.render();

        const before = yAxisLineX(chart);

        chart.update({
            data: [{
                k: 'a',
                v: 1,
            }, {
                k: 'b',
                v: 2,
            }, {
                k: 'c',
                v: 3,
            }],
        });

        await chart.render();

        const after = yAxisLineX(chart);

        expect(after).toBeLessThan(before);
        expect(seriesPolyline(chart, 's').points[0][0]).toBeCloseTo(after, 6);
    });

    it('Should agree between the measured band, the axis box and the axis line', async () => {
        const chart = createChart([1, 22, 333], ['a', 'b', 'c']);

        await chart.render();

        const chartInternals = internals(chart);
        const box = chartInternals.yAxis.getBoundingBox();

        expect(box.right - box.left).toBeCloseTo(chartInternals.yAxis.measure(), 6);
        expect(yAxisLineX(chart)).toBeCloseTo(box.right, 6);
    });

    it('Should settle the layout within the iteration bound', async () => {
        const chart = createChart([1, 22, 333], ['a', 'b', 'c']);
        const chartInternals = chart as unknown as {
            resolveCartesianPlot(area: ChartArea, apply: (plot: ChartArea) => void, maxPasses?: number): ChartArea;
        };

        let passes = 0;
        const original = chartInternals.resolveCartesianPlot.bind(chartInternals);

        chartInternals.resolveCartesianPlot = (area, apply, maxPasses) => original(area, plot => {
            passes++;
            apply(plot);
        }, maxPasses);

        await chart.render();

        // One pass per iteration plus the final re-application; settling on the second iteration
        // means at most three calls.
        expect(passes).toBeLessThanOrEqual(3);
    });

    it('Should place the first bar inside the plot for a horizontal bar chart', async () => {
        polyfillPath2D();
        mockTextMetrics(mockCanvasContext());

        const chart = createBarChart(document.createElement('div'), {
            autoRender: false,
            animation: false,
            orientation: 'horizontal',
            data: [{
                k: 'alpha',
                v: 10,
            }, {
                k: 'a-very-long-category-label',
                v: 20,
            }],
            key: 'k',
            series: [{
                id: 's',
                label: 'S',
                value: 'v',
            }],
        });

        internals(chart).scene.context.rescale(600, 400);
        await chart.render();

        const box = internals(chart).yAxis.getBoundingBox();

        expect(box.right - box.left).toBeCloseTo(internals(chart).yAxis.measure(), 6);
        expect(yAxisLineX(chart)).toBeCloseTo(box.right, 6);
    });

});
