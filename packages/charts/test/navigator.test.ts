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
    createScatterChart,
} from '../src';

polyfillPath2D();

interface Point {
    id: string;
    x: number;
    y: number;
}

const DATA: Point[] = [
    {
        id: 'a',
        x: 1,
        y: 2,
    },
    {
        id: 'b',
        x: 5,
        y: 8,
    },
    {
        id: 'c',
        x: 9,
        y: 3,
    },
];

function createChart(navigator: boolean) {
    return createScatterChart<Point>(document.createElement('div'), {
        autoRender: false,
        navigator,
        data: DATA,
        key: 'id',
        series: [
            {
                id: 'series',
                xBy: 'x',
                yBy: 'y',
                label: 'Series',
            },
        ],
    });
}

describe('CartesianChart navigator integration', () => {

    test('Should not create a navigator by default', () => {
        mockCanvasContext();

        const chart = createChart(false);

        expect(chart.navigator).toBeUndefined();

        chart.destroy();
    });

    test('Should create a navigator when opted in', () => {
        mockCanvasContext();

        const chart = createChart(true);

        expect(chart.navigator).toBeDefined();
        expect(chart.navigator?.transform).toEqual({
            k: 1,
            x: 0,
            y: 0,
        });

        chart.destroy();
    });

    test('Should react to imperative pan without throwing', () => {
        mockCanvasContext();

        const chart = createChart(true);

        expect(() => chart.navigator?.panBy(40, -20)).not.toThrow();
        expect(chart.navigator?.transform.x).toBe(40);

        chart.destroy();
    });

    test('Should stop driving the chart once destroyed', () => {
        mockCanvasContext();

        const chart = createChart(true);
        const navigator = chart.navigator!;

        chart.destroy();

        // The navigator is torn down with the chart, so further gestures are inert.
        expect(() => navigator.panBy(10, 10)).not.toThrow();
    });

    test('Should create the navigator when toggled on via update', () => {
        mockCanvasContext();

        const chart = createChart(false);

        expect(chart.navigator).toBeUndefined();

        chart.update({
            navigator: true,
        });

        expect(chart.navigator).toBeDefined();

        chart.destroy();
    });

    test('Should destroy the navigator (and reset the view) when toggled off via update', () => {
        mockCanvasContext();

        const chart = createChart(true);

        chart.navigator?.panBy(40, -20);
        expect(chart.navigator?.transform.x).toBe(40);

        chart.update({
            navigator: false,
        });

        expect(chart.navigator).toBeUndefined();

        // Toggling back on starts from a fresh, identity view rather than the stale pan.
        chart.update({
            navigator: true,
        });

        expect(chart.navigator?.transform).toEqual({
            k: 1,
            x: 0,
            y: 0,
        });

        chart.destroy();
    });

});
