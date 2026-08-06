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
    BorderRadius,
} from '@ripl/core';

import {
    createBarChart,
} from '../src';

interface Row {
    k: string;
    lower: number;
    upper: number;
    empty: number;
    below: number;
}

const DATA: Row[] = [
    {
        k: 'a',
        lower: 5,
        upper: 3,
        empty: 0,
        below: -4,
    },
];

function createStackedChart() {
    polyfillPath2D();
    mockCanvasContext();

    const chart = createBarChart<Row>(document.createElement('div'), {
        autoRender: false,
        animation: false,
        stacked: true,
        borderRadius: 6,
        data: DATA,
        key: 'k',
        series: [
            {
                id: 'lower',
                label: 'Lower',
                value: 'lower',
            },
            {
                id: 'upper',
                label: 'Upper',
                value: 'upper',
            },
            {
                id: 'empty',
                label: 'Empty',
                value: 'empty',
            },
            {
                id: 'below',
                label: 'Below',
                value: 'below',
            },
        ],
    });

    (chart as unknown as { scene: { context: { rescale(width: number, height: number): void } } }).scene.context.rescale(600, 400);
    chart.render();

    return chart;
}

function radiusOf(chart: unknown, id: string): number | BorderRadius {
    const bar = (chart as { scene: { getElementById(elementId: string): { borderRadius: number | BorderRadius } | null } })
        .scene
        .getElementById(id);

    expect(bar).toBeTruthy();

    return bar!.borderRadius;
}

describe('stacked bar rounding', () => {

    it('rounds only the outermost segment of each sign', () => {
        const chart = createStackedChart();

        expect(radiusOf(chart, 'lower-a')).toBe(0);
        expect(radiusOf(chart, 'upper-a')).toEqual([6, 6, 0, 0]);
        expect(radiusOf(chart, 'below-a')).toEqual([0, 0, 6, 6]);

        chart.destroy();
    });

    it('never treats a zero-valued series as the outermost segment', () => {
        const chart = createStackedChart();

        expect(radiusOf(chart, 'empty-a')).toBe(0);

        chart.destroy();
    });

});
