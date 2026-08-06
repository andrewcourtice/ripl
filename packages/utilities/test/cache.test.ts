import {
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    createLRUCache,
} from '../src';

describe('Cache Utilities', () => {

    describe('createLRUCache', () => {

        test('Should store and retrieve values', () => {
            const cache = createLRUCache<string, number>(4);

            cache.set('a', 1);

            expect(cache.get('a')).toBe(1);
            expect(cache.has('a')).toBe(true);
            expect(cache.size).toBe(1);
        });

        test('Should return undefined for a missing key', () => {
            const cache = createLRUCache<string, number>(4);

            expect(cache.get('missing')).toBeUndefined();
            expect(cache.has('missing')).toBe(false);
        });

        test('Should overwrite an existing key without growing', () => {
            const cache = createLRUCache<string, number>(4);

            cache.set('a', 1);
            cache.set('a', 2);

            expect(cache.get('a')).toBe(2);
            expect(cache.size).toBe(1);
        });

        test('Should never exceed the limit', () => {
            const cache = createLRUCache<number, number>(3);

            for (let i = 0; i < 20; i++) {
                cache.set(i, i);
            }

            expect(cache.size).toBe(3);
        });

        test('Should evict exactly one entry per write at the limit', () => {
            const cache = createLRUCache<string, number>(3);

            cache.set('a', 1);
            cache.set('b', 2);
            cache.set('c', 3);
            cache.set('d', 4);

            expect(cache.size).toBe(3);
            expect(cache.has('a')).toBe(false);
            expect(cache.has('b')).toBe(true);
            expect(cache.has('c')).toBe(true);
            expect(cache.has('d')).toBe(true);
        });

        // The whole point of the LRU over the previous wipe-at-threshold cache: a hot entry survives.
        test('Should evict the least recently used entry, not the oldest inserted', () => {
            const cache = createLRUCache<string, number>(3);

            cache.set('a', 1);
            cache.set('b', 2);
            cache.set('c', 3);

            expect(cache.get('a')).toBe(1);

            cache.set('d', 4);

            expect(cache.has('a')).toBe(true);
            expect(cache.has('b')).toBe(false);
        });

        test('Should refresh recency on overwrite', () => {
            const cache = createLRUCache<string, number>(3);

            cache.set('a', 1);
            cache.set('b', 2);
            cache.set('c', 3);
            cache.set('a', 10);
            cache.set('d', 4);

            expect(cache.get('a')).toBe(10);
            expect(cache.has('b')).toBe(false);
        });

        test('Should delete a key and report whether it was present', () => {
            const cache = createLRUCache<string, number>(4);

            cache.set('a', 1);

            expect(cache.delete('a')).toBe(true);
            expect(cache.delete('a')).toBe(false);
            expect(cache.size).toBe(0);
        });

        test('Should clear every entry', () => {
            const cache = createLRUCache<string, number>(4);

            cache.set('a', 1);
            cache.set('b', 2);
            cache.clear();

            expect(cache.size).toBe(0);
            expect(cache.has('a')).toBe(false);
        });

        test('Should retain undefined values as present entries', () => {
            const cache = createLRUCache<string, number | undefined>(4);

            cache.set('a', undefined);

            expect(cache.has('a')).toBe(true);
            expect(cache.get('a')).toBeUndefined();
            expect(cache.size).toBe(1);
        });

        test('Should clamp a limit below one', () => {
            const cache = createLRUCache<string, number>(0);

            cache.set('a', 1);
            cache.set('b', 2);

            expect(cache.size).toBe(1);
            expect(cache.has('b')).toBe(true);
        });

        test('Should report the configured maximum size', () => {
            expect(createLRUCache<string, number>(4).maxSize).toBe(4);
            expect(createLRUCache<string, number>(0).maxSize).toBe(1);
            expect(createLRUCache<string, number>(2.7).maxSize).toBe(2);
        });

        test('Should iterate from least to most recently used', () => {
            const cache = createLRUCache<string, number>(3);

            cache.set('a', 1);
            cache.set('b', 2);
            cache.set('c', 3);
            cache.get('a');

            expect([...cache.keys()]).toEqual(['b', 'c', 'a']);
            expect([...cache.values()]).toEqual([2, 3, 1]);
            expect([...cache]).toEqual([['b', 2], ['c', 3], ['a', 1]]);
        });

        test('Should not affect recency when iterating', () => {
            const cache = createLRUCache<string, number>(3);

            cache.set('a', 1);
            cache.set('b', 2);
            cache.set('c', 3);

            cache.forEach(() => undefined);
            expect([...cache.keys()]).toEqual(['a', 'b', 'c']);

            cache.set('d', 4);

            expect(cache.has('a')).toBe(false);
        });

        test('Should return itself from set', () => {
            const cache = createLRUCache<string, number>(3);

            expect(cache.set('a', 1)).toBe(cache);

            cache.set('b', 2).set('c', 3);

            expect(cache.size).toBe(3);
        });

        test('Should evict when written through a Map-typed reference', () => {
            const cache = createLRUCache<string, number>(2);
            const map: Map<string, number> = cache;

            map.set('a', 1);
            map.set('b', 2);
            map.set('c', 3);

            expect(map.size).toBe(2);
            expect(map.has('a')).toBe(false);
        });

        // The native Map upserts write through internal slots, so an un-overridden cache grows unbounded.
        test('Should evict when inserting through getOrInsert', () => {
            const cache = createLRUCache<string, number>(2);

            expect(cache.getOrInsert('a', 1)).toBe(1);
            expect(cache.getOrInsert('b', 2)).toBe(2);
            expect(cache.getOrInsert('c', 3)).toBe(3);

            expect(cache.size).toBe(2);
            expect(cache.has('a')).toBe(false);
        });

        test('Should refresh recency on a getOrInsert hit', () => {
            const cache = createLRUCache<string, number>(3);

            cache.set('a', 1);
            cache.set('b', 2);
            cache.set('c', 3);

            expect(cache.getOrInsert('a', 99)).toBe(1);

            cache.set('d', 4);

            expect(cache.has('a')).toBe(true);
            expect(cache.has('b')).toBe(false);
        });

        test('Should only compute a getOrInsertComputed value on a miss', () => {
            const cache = createLRUCache<string, number>(2);
            const compute = vi.fn((key: string) => key.length);

            expect(cache.getOrInsertComputed('ab', compute)).toBe(2);
            expect(cache.getOrInsertComputed('ab', compute)).toBe(2);

            expect(compute).toHaveBeenCalledTimes(1);

            cache.getOrInsertComputed('cde', compute);
            cache.getOrInsertComputed('fghi', compute);

            expect(cache.size).toBe(2);
            expect(cache.has('ab')).toBe(false);
        });

        test('Should be usable as a Map', () => {
            const cache = createLRUCache<string, number>(3);

            cache.set('a', 1);
            cache.set('b', 2);

            expect(cache).toBeInstanceOf(Map);
            expect(new Map(cache).size).toBe(2);
        });

    });

});
