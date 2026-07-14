import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    scaleOrdinal,
} from '../../src';

describe('Scale', () => {

    describe('Ordinal Scale', () => {

        test('Should map domain values to corresponding range values', () => {
            const scale = scaleOrdinal(['a', 'b', 'c'], ['red', 'green', 'blue']);

            expect(scale('a')).toBe('red');
            expect(scale('b')).toBe('green');
            expect(scale('c')).toBe('blue');
        });

        test('Should cycle the range when the domain is larger', () => {
            const scale = scaleOrdinal(['a', 'b', 'c', 'd'], ['red', 'green']);

            expect(scale('a')).toBe('red');
            expect(scale('b')).toBe('green');
            expect(scale('c')).toBe('red');
            expect(scale('d')).toBe('green');
        });

        test('Should assign the next slot to unknown values', () => {
            const scale = scaleOrdinal(['a'], ['red', 'green', 'blue']);

            expect(scale('a')).toBe('red');
            expect(scale('b')).toBe('green');
            expect(scale('b')).toBe('green');
            expect(scale('c')).toBe('blue');
        });

        test('Should deduplicate the domain', () => {
            const scale = scaleOrdinal(['a', 'a', 'b'], ['red', 'green', 'blue']);

            expect(scale('a')).toBe('red');
            expect(scale('b')).toBe('green');
            expect(scale.domain).toEqual(['a', 'b']);
        });

    });

});
