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
    createBarChart,
} from '../src';

interface PercentChartInternals {
    yAxis: {
        scale: {
            domain: number[];
        };
        formatLabel?: (value: number) => string;
    };
    scene: {
        getElementById(id: string): {
            height: number;
            emit(event: string, payload?: unknown): void;
        } | null;
    };
}

function internals(chart: unknown): PercentChartInternals {
    return chart as PercentChartInternals;
}

function barHeight(chart: unknown, id: string): number {
    const bar = internals(chart).scene.getElementById(id);

    expect(bar).toBeTruthy();

    return bar ? bar.height : 0;
}

function createPercentChart() {
    polyfillPath2D();
    mockCanvasContext();

    return createBarChart(document.createElement('div'), {
        autoRender: false,
        animation: false,
        stacked: 'percent',
        data: [
            {
                m: 'a',
                one: 25,
                other: 75,
            },
            {
                m: 'b',
                one: 60,
                other: 140,
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
                id: 'other',
                label: 'Other',
                value: 'other',
            },
        ],
    });
}

describe('100%-stacked bars', () => {

    it('fixes the value axis domain to [0, 1]', async () => {
        const chart = createPercentChart();

        await chart.render();

        const domain = internals(chart).yAxis.scale.domain;

        expect(domain[0]).toBe(0);
        expect(domain[domain.length - 1]).toBe(1);
    });

    it('sizes segments by their share of the category total', async () => {
        const chart = createPercentChart();

        await chart.render();

        // Category a splits 25/75, category b splits 60/140 — height ratios follow the shares.
        expect(barHeight(chart, 'one-a') / barHeight(chart, 'other-a')).toBeCloseTo(25 / 75, 5);
        expect(barHeight(chart, 'one-b') / barHeight(chart, 'other-b')).toBeCloseTo(60 / 140, 5);
    });

    it('fills the category with each stack (shares sum to 100%)', async () => {
        const chart = createPercentChart();

        await chart.render();

        const totalA = barHeight(chart, 'one-a') + barHeight(chart, 'other-a');
        const totalB = barHeight(chart, 'one-b') + barHeight(chart, 'other-b');

        expect(totalA).toBeGreaterThan(0);
        expect(totalA).toBeCloseTo(totalB, 5);
    });

    it('defaults the value axis labels to percentages', async () => {
        const chart = createPercentChart();

        await chart.render();

        expect(internals(chart).yAxis.formatLabel?.(0.5)).toContain('%');
    });

    it('renormalizes shares when a series is hidden via the legend', async () => {
        const chart = createPercentChart();

        await chart.render();

        const stackedTotal = barHeight(chart, 'one-a') + barHeight(chart, 'other-a');

        internals(chart).scene.getElementById('legend-swatch-other')?.emit('click');
        await chart.render();

        // The remaining series is now 100% of every category.
        expect(barHeight(chart, 'one-a')).toBeCloseTo(stackedTotal, 5);
    });

});

describe('100%-stacked areas', () => {

    it('fixes the value axis domain to [0, 1] and formats it as percentages', async () => {
        polyfillPath2D();
        mockCanvasContext();

        const chart = createAreaChart(document.createElement('div'), {
            autoRender: false,
            animation: false,
            stacked: 'percent',
            data: [
                {
                    m: 'a',
                    one: 25,
                    other: 75,
                },
                {
                    m: 'b',
                    one: 60,
                    other: 140,
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
                    id: 'other',
                    label: 'Other',
                    value: 'other',
                },
            ],
        });

        await chart.render();

        const domain = internals(chart).yAxis.scale.domain;

        expect(domain[0]).toBe(0);
        expect(domain[domain.length - 1]).toBe(1);
        expect(internals(chart).yAxis.formatLabel?.(0.5)).toContain('%');
    });

});
