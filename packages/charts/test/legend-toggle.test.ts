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
} from '../src';

interface ChartInternals {
    _series: {
        groups: unknown[];
    };
    scene: {
        getElementById(id: string): {
            emit(event: string, payload?: unknown): void;
        } | null;
    };
    yAxis: {
        scale: {
            domain: number[];
        };
    };
}

function internals(chart: unknown): ChartInternals {
    return chart as ChartInternals;
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
                small: 8,
                large: 100,
            },
            {
                m: 'b',
                small: 12,
                large: 140,
            },
        ],
        key: 'm',
        series: [
            {
                id: 'small',
                label: 'Small',
                value: 'small',
            },
            {
                id: 'large',
                label: 'Large',
                value: 'large',
            },
        ],
    });
}

function clickLegendItem(chart: unknown, id: string) {
    const swatch = internals(chart).scene.getElementById(`legend-swatch-${id}`);

    expect(swatch).toBeTruthy();
    swatch?.emit('click');
}

describe('legend series toggling', () => {

    it('hides a series on legend click and rescales the value axis', async () => {
        const chart = createChart();

        await chart.render();

        expect(internals(chart)._series.groups.length).toBe(2);
        expect(internals(chart).yAxis.scale.domain.at(-1)).toBeGreaterThanOrEqual(140);

        clickLegendItem(chart, 'large');
        await chart.render();

        expect(internals(chart)._series.groups.length).toBe(1);
        expect(internals(chart).yAxis.scale.domain.at(-1)).toBeLessThan(140);
    });

    it('restores a hidden series on a second legend click', async () => {
        const chart = createChart();

        await chart.render();

        clickLegendItem(chart, 'large');
        await chart.render();

        expect(internals(chart)._series.groups.length).toBe(1);

        clickLegendItem(chart, 'large');
        await chart.render();

        expect(internals(chart)._series.groups.length).toBe(2);
        expect(internals(chart).yAxis.scale.domain.at(-1)).toBeGreaterThanOrEqual(140);
    });

    it('renders cleanly with every series hidden', async () => {
        const chart = createChart();

        await chart.render();

        clickLegendItem(chart, 'small');
        await chart.render();

        clickLegendItem(chart, 'large');
        await chart.render();

        expect(internals(chart)._series.groups.length).toBe(0);

        const domain = internals(chart).yAxis.scale.domain;

        expect(domain.every(Number.isFinite)).toBe(true);
    });

    it('keeps hidden series hidden across a data update', async () => {
        const chart = createChart();

        await chart.render();

        clickLegendItem(chart, 'large');
        await chart.render();

        chart.update({
            data: [
                {
                    m: 'a',
                    small: 10,
                    large: 90,
                },
                {
                    m: 'b',
                    small: 14,
                    large: 120,
                },
            ],
        });

        await chart.render();

        expect(internals(chart)._series.groups.length).toBe(1);
    });

});
