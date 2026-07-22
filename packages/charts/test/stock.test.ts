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
    Rect,
    Text,
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
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
}

const CANDLES: Candle[] = [
    {
        date: 'd1',
        open: 100,
        high: 108,
        low: 98,
        close: 105,
        volume: 12000,
    },
    {
        date: 'd2',
        open: 105,
        high: 110,
        low: 103,
        close: 104,
        volume: 9800,
    },
    {
        date: 'd3',
        open: 104,
        high: 112,
        low: 102,
        close: 111,
        volume: 15000,
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
            open: 'open',
            high: 'high',
            low: 'low',
            close: 'close',
            volume: 'volume',
            showVolume: true,
        });

        await chart.render();

        expect(sceneOf(chart).getElementById('volume')).toBeDefined();

        chart.destroy();
    });

    test('Should centre the volume caption under the volume bars', async () => {
        mockCanvasContext();
        mockCanvasSize(640, 400);

        const chart = createStockChart<Candle>(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: CANDLES,
            key: 'date',
            open: 'open',
            high: 'high',
            low: 'low',
            close: 'close',
            volume: 'volume',
            showVolume: true,
        });

        await chart.render();

        const scene = sceneOf(chart);
        const label = scene.getElementById<Text>('volume-label');
        const clip = scene.getElementById<Rect>('volume-clip');

        expect(label).toBeDefined();
        expect(label?.textAlign).toBe('center');

        // The clip rect spans the volume plot, so its centre is the caption's expected x.
        const plotMidpoint = clip!.x + clip!.width / 2;

        expect(label?.x).toBeCloseTo(plotMidpoint);

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
            open: 'open',
            high: 'high',
            low: 'low',
            close: 'close',
            volume: 'volume',
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
