import {
    describe,
    expect,
    it,
} from 'vitest';

import {
    correspondence,
    keysDiffer,
} from '../src/core/morph';

describe('correspondence', () => {
    it('maps every surviving key to its previous index', () => {
        expect(correspondence(['a', 'b', 'c'], ['a', 'b', 'c'])).toEqual([0, 1, 2]);
    });

    it('marks an appended key as new (-1)', () => {
        expect(correspondence(['a', 'b', 'c'], ['a', 'b', 'c', 'd'])).toEqual([0, 1, 2, -1]);
    });

    it('marks an inserted key as new and keeps survivors pointing at their old index', () => {
        expect(correspondence(['a', 'b', 'c'], ['a', 'x', 'b', 'c'])).toEqual([0, -1, 1, 2]);
    });

    it('drops a removed key (absent from the result)', () => {
        expect(correspondence(['a', 'b', 'c', 'd'], ['a', 'b', 'c'])).toEqual([0, 1, 2]);
    });

    it('tracks a reorder by identity, not position', () => {
        expect(correspondence(['a', 'b', 'c'], ['c', 'a', 'b'])).toEqual([2, 0, 1]);
    });

    it('resolves disambiguated area-fill keys per run (top/bottom)', () => {
        const prev = ['t:a', 't:b', 'b:b', 'b:a'];
        const next = ['t:a', 't:b', 't:c', 'b:c', 'b:b', 'b:a'];
        expect(correspondence(prev, next)).toEqual([0, 1, -1, -1, 2, 3]);
    });
});

describe('keysDiffer', () => {
    it('is false for identical key lists', () => {
        expect(keysDiffer(['a', 'b'], ['a', 'b'])).toBe(false);
    });

    it('is true when the length changes', () => {
        expect(keysDiffer(['a', 'b'], ['a', 'b', 'c'])).toBe(true);
    });

    it('is true when membership changes at the same length', () => {
        expect(keysDiffer(['a', 'b'], ['a', 'c'])).toBe(true);
        expect(keysDiffer(['a', 'b'], ['b', 'a'])).toBe(true);
    });
});
