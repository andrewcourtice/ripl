import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    valueOneOrMore,
} from '../src/value';

describe('valueOneOrMore', () => {

    test('Should wrap a single value in an array', () => {
        expect(valueOneOrMore('hello')).toEqual(['hello']);
    });

    test('Should flatten an array into a new array', () => {
        expect(valueOneOrMore([1, 2, 3])).toEqual([1, 2, 3]);
    });

    test('Should wrap a single number in an array', () => {
        expect(valueOneOrMore(42)).toEqual([42]);
    });

    test('Should handle an empty array', () => {
        expect(valueOneOrMore([])).toEqual([]);
    });

});
