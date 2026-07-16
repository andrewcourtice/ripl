import {
    afterEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

import {
    createStockChart,
} from '../src';

import type {
    Group,
} from '@ripl/core';

polyfillPath2D();

/** jsdom measures every element as 0×0; give the canvas a real size so the layout has room. */
function mockCanvasSize(width: number, height: number): void {
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({
        width,
        height,
        top: 0,
        left: 0,
        right: width,
        bottom: height,
        x: 0,
        y: 0,
        toJSON: () => ({}),
    } as DOMRect);
}

afterEach(() => {
    vi.restoreAllMocks();
});

/** Reaches into a chart's scene to inspect the rendered element graph. */
function sceneOf(chart: unknown): Group {
    return (chart as { scene: Group }).scene;
}

interface Candle {
    date: string;
    o: number;
    h: number;
    l: number;
    c: number;
    v: number;
}

const CANDLES: Candle[] = [
    {
        date: 'd1',
        o: 100,
        h: 108,
        l: 98,
        c: 105,
        v: 12000,
    },
    {
        date: 'd2',
        o: 105,
        h: 110,
        l: 103,
        c: 104,
        v: 9800,
    },
    {
        date: 'd3',
        o: 104,
        h: 112,
        l: 102,
        c: 111,
        v: 15000,
    },
];

describe('StockChart volume toggle', () => {

    test('Should render the volume sub-chart when volume data is supplied', async () => {
        mockCanvasContext();
        mockCanvasSize(640, 400);

        const chart = createStockChart<Candle>(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: CANDLES,
            key: 'date',
            open: 'o',
            high: 'h',
            low: 'l',
            close: 'c',
            volume: 'v',
            showVolume: true,
        });

        await chart.render();

        expect(sceneOf(chart).getElementById('volume')).toBeDefined();

        chart.destroy();
    });

    test('Should tear down the volume group when volume is toggled off', async () => {
        mockCanvasContext();
        mockCanvasSize(640, 400);

        const chart = createStockChart<Candle>(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: CANDLES,
            key: 'date',
            open: 'o',
            high: 'h',
            low: 'l',
            close: 'c',
            volume: 'v',
            showVolume: true,
        });

        await chart.render();
        expect(sceneOf(chart).getElementById('volume')).toBeDefined();

        chart.update({
            showVolume: false,
        });

        await chart.render();

        // The orphaned volume group is destroyed so the candlesticks reclaim the space cleanly.
        expect(sceneOf(chart).getElementById('volume')).toBeUndefined();
        expect((chart as unknown as { _volumeGroup: unknown })._volumeGroup).toBeUndefined();

        chart.destroy();
    });

});
