import {
    describe,
    expect,
    it,
} from 'vitest';

import {
    computeStackOffset,
    createIndexLookup,
    createKeyedLookup,
    resolveAccessor,
} from '../src/core/data';

interface Row {
    name: string;
    value: number;
}

describe('resolveAccessor', () => {
    it('reads a property by key', () => {
        const get = resolveAccessor<Row, number>('value');
        expect(get({
            name: 'a',
            value: 42,
        })).toBe(42);
    });

    it('passes through a function accessor', () => {
        const get = resolveAccessor<Row, number>(item => item.value * 2);
        expect(get({
            name: 'a',
            value: 5,
        })).toBe(10);
    });

    it('treats a non-key value as a constant', () => {
        const get = resolveAccessor<Row, number>(7);
        expect(get({
            name: 'a',
            value: 1,
        })).toBe(7);
    });
});

describe('computeStackOffset', () => {
    const series = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const values: Record<string, Record<string, number>> = {
        a: { x: 10 },
        b: { x: 20 },
        c: { x: -5 },
    };

    const getValue = (s: { id: string }, item: { key: string }) => values[s.id][item.key];

    it('returns 0 for the first series', () => {
        expect(computeStackOffset(series, series[0], { key: 'x' }, getValue)).toBe(0);
    });

    it('accumulates preceding positive values', () => {
        expect(computeStackOffset(series, series[1], { key: 'x' }, getValue)).toBe(10);
    });

    it('stacks positive and negative values independently', () => {
        // series c is negative; only preceding negatives count (none), so offset is 0.
        expect(computeStackOffset(series, series[2], { key: 'x' }, getValue)).toBe(0);
    });

    it('sums all preceding values of the same sign', () => {
        const positives = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
        const allPositive = (s: { id: string }) => ({
            a: 1,
            b: 2,
            c: 3,
        }[s.id] ?? 0);
        expect(computeStackOffset(positives, positives[2], {}, allPositive)).toBe(3);
    });

    it('matches the scanned index when the caller supplies one', () => {
        expect(computeStackOffset(series, series[1], { key: 'x' }, getValue, 1)).toBe(10);
    });
});

describe('createIndexLookup', () => {
    it('resolves each value to its index', () => {
        const indexOf = createIndexLookup(['a', 'b', 'c']);

        expect([indexOf('a'), indexOf('b'), indexOf('c')]).toEqual([0, 1, 2]);
    });

    it('matches indexOf across duplicates, misses, NaN and mixed types', () => {
        const shared = { id: 'a' };
        const values: unknown[] = ['a', 'b', 'a', shared, shared, 1, '1', NaN, NaN, 0, -0, undefined, null];
        const indexOf = createIndexLookup(values);
        const probes: unknown[] = [...values, 'z', {}, NaN, -0, 0, false];

        probes.forEach(probe => expect(indexOf(probe)).toBe(values.indexOf(probe)));
    });

    it('resolves -1 against an empty array', () => {
        expect(createIndexLookup<string>([])('a')).toBe(-1);
    });
});

describe('createKeyedLookup', () => {
    const rows = [
        {
            id: 'a',
            value: 1,
        },
        {
            id: 'b',
            value: 2,
        },
        {
            id: 'a',
            value: 3,
        },
    ];

    it('matches find across duplicate keys and misses', () => {
        const byId = createKeyedLookup(rows, row => row.id);

        ['a', 'b', 'z'].forEach(id => expect(byId(id)).toBe(rows.find(row => row.id === id)));
    });
});
