// Side-effect import: `@ripl/web` registers the browser factory (canvas context, text
// measurement, rAF). `@ripl/charts` is context-agnostic and installs no backend of its own.
import '@ripl/web';

import {
    afterEach,
    beforeEach,
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
    elementIsArc,
    TAU,
} from '@ripl/core';

import type {
    Arc,
    Group,
} from '@ripl/core';

import {
    createPieChart,
} from '../src';

polyfillPath2D();

interface RenderedChart {
    render(): Promise<unknown>;
    destroy(): void;
    scene: Group;
}

function segmentSweeps(chart: RenderedChart) {
    const sweeps: number[] = [];

    chart.scene.graph({ deep: true }).forEach(element => {
        if (elementIsArc(element)) {
            const arc = element as Arc;

            sweeps.push(arc.endAngle - arc.startAngle);
        }
    });

    return sweeps;
}

/**
 * A dataset of bare numbers reaches `numberSum(data, accessor)`, which once short-circuited past
 * the accessor for numeric arrays and summed the raw data instead of the mapped values.
 */
describe('Charts over a dataset of bare numbers', () => {

    beforeEach(() => {
        vi.useFakeTimers();
        mockCanvasContext();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    test('pie sizes its segments from the mapped values, not the raw data', async () => {
        const chart = createPieChart<number>(document.createElement('div'), {
            autoRender: false,
            animation: false,
            data: [10, 20],
            key: value => String(value),
            value: value => value * 2,
            label: value => String(value),
        }) as unknown as RenderedChart;

        chart.render();
        await vi.advanceTimersByTimeAsync(5000);

        const sweeps = segmentSweeps(chart).sort((a, b) => a - b);

        expect(sweeps).toHaveLength(2);
        expect(sweeps[0]).toBeCloseTo(TAU / 3, 9);
        expect(sweeps[1]).toBeCloseTo((2 * TAU) / 3, 9);
        expect(sweeps[0] + sweeps[1]).toBeCloseTo(TAU, 9);

        chart.destroy();
    });

});
