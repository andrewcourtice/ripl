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
    isGroup,
} from '@ripl/core';

import {
    valueOneOrMore,
} from '@ripl/utilities';

import {
    createPieChart,
    createPolarAreaChart,
} from '../src';

polyfillPath2D();

interface Slice {
    label: string;
    value: number;
}

const INITIAL: Slice[] = [
    {
        label: 'a',
        value: 1,
    },
    {
        label: 'b',
        value: 2,
    },
    {
        label: 'c',
        value: 3,
    },
];

// Shared keys 'a'/'b' become updates; 'c' exits; 'd' enters.
const UPDATED: Slice[] = [
    {
        label: 'a',
        value: 5,
    },
    {
        label: 'b',
        value: 1,
    },
    {
        label: 'd',
        value: 4,
    },
];

/**
 * A segment's arc/label/connector live under a per-segment group, but `transition()` animates a
 * target's OWN state — a group's own `.data` is undefined, so passing groups freezes the update.
 * These tests assert the update/exit passes target the leaf children (arcs), never the groups.
 */
describe('Pie / polar-area slice transitions target leaves', () => {

    beforeEach(() => {
        vi.useFakeTimers();
        mockCanvasContext();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    async function transitionTargetsAfterUpdate(chart: { render(): Promise<unknown>;
        update(o: unknown): Promise<unknown>;
        destroy(): void; }) {
        chart.render();
        await vi.advanceTimersByTimeAsync(5000);

        const spy = vi.spyOn((chart as unknown as { renderer: { transition: (...args: unknown[]) => unknown } }).renderer, 'transition');

        // autoRender is off, so re-render explicitly to diff the new data against the old.
        chart.update({ data: UPDATED });
        chart.render();
        await vi.advanceTimersByTimeAsync(5000);

        // Flatten every target passed to transition() across the update's enter/update/exit passes.
        return spy.mock.calls.flatMap(call => valueOneOrMore(call[0]));
    }

    test('pie update animates leaf arcs, not segment groups', async () => {
        const chart = createPieChart<Slice>(document.createElement('div'), {
            autoRender: false,
            data: INITIAL,
            key: 'label',
            value: 'value',
            label: 'label',
        });

        const targets = await transitionTargetsAfterUpdate(chart);

        expect(targets.length).toBeGreaterThan(0);
        // The update reaches the leaf arcs...
        expect(targets.some(target => elementIsArc(target))).toBe(true);
        // ...and never hands a bare group to transition() (which would silently no-op).
        expect(targets.some(target => isGroup(target))).toBe(false);

        chart.destroy();
    });

    test('polar-area update animates leaf arcs, not segment groups', async () => {
        const chart = createPolarAreaChart<Slice>(document.createElement('div'), {
            autoRender: false,
            data: INITIAL,
            key: 'label',
            value: 'value',
            label: 'label',
        });

        const targets = await transitionTargetsAfterUpdate(chart);

        expect(targets.length).toBeGreaterThan(0);
        expect(targets.some(target => elementIsArc(target))).toBe(true);
        expect(targets.some(target => isGroup(target))).toBe(false);

        chart.destroy();
    });

});
