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
    createBoxPlotChart,
} from '../src';

import type {
    Element,
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

interface Score {
    group: string;
    score: number;
}

const SCORES: Score[] = [
    ...[10, 20, 30, 40, 100].map(score => ({
        group: 'A',
        score,
    })),
    ...[15, 25, 35, 45, 55].map(score => ({
        group: 'B',
        score,
    })),
];

describe('BoxPlotChart animations', () => {

    test('Should stash each box\'s final geometry on `data` so entry can grow it from the median', async () => {
        mockCanvasContext();
        mockCanvasSize(640, 400);

        const chart = createBoxPlotChart<Score>(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: SCORES,
            group: 'group',
            value: 'score',
        });

        await chart.render();

        const box = sceneOf(chart).getElementById('A-box') as unknown as { data?: { height: number; }; };

        // The box carries a `data` snapshot of its full geometry — the candlestick-style entry grows
        // from a collapsed median toward this stashed height.
        expect(box.data).toBeDefined();
        expect(box.data!.height).toBeGreaterThan(0);

        chart.destroy();
    });

    test('Should tween boxes in place on update rather than clearing and rebuilding them', async () => {
        mockCanvasContext();
        mockCanvasSize(640, 400);

        const chart = createBoxPlotChart<Score>(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: SCORES,
            group: 'group',
            value: 'score',
        });

        await chart.render();

        const boxBefore = sceneOf(chart).getElementById('A-box') as Element | undefined;
        expect(boxBefore).toBeDefined();

        // Same categories, shifted values.
        const next = SCORES.map(item => ({
            ...item,
            score: item.score + 5,
        }));

        chart.update({
            data: next,
        });

        await chart.render();

        const boxAfter = sceneOf(chart).getElementById('A-box') as Element | undefined;

        // The same element instance survives the update — it is reconciled and transitioned to the new
        // geometry, not cleared and rebuilt (which teleported the boxes with no animation).
        expect(boxAfter).toBe(boxBefore);

        chart.destroy();
    });

});
