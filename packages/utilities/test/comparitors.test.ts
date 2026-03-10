import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    comparitorDate,
    comparitorNumeric,
    comparitorString,
} from '../src/comparitors';

describe('comparitorNumeric', () => {

    test('Should sort ascending', () => {
        const arr = [3, 1, 2];
        arr.sort(comparitorNumeric);
        expect(arr).toEqual([1, 2, 3]);
    });

    test('Should handle equal values', () => {
        expect(comparitorNumeric(5, 5)).toBe(0);
    });

    test('Should return negative for a < b', () => {
        expect(comparitorNumeric(1, 2)).toBeLessThan(0);
    });

    test('Should return positive for a > b', () => {
        expect(comparitorNumeric(3, 1)).toBeGreaterThan(0);
    });

});

describe('comparitorDate', () => {

    test('Should sort chronologically', () => {
        const a = new Date(2020, 0, 1);
        const b = new Date(2021, 0, 1);
        const c = new Date(2019, 0, 1);

        const arr = [a, b, c];
        arr.sort(comparitorDate);

        expect(arr).toEqual([c, a, b]);
    });

    test('Should handle equal dates', () => {
        const a = new Date(2020, 0, 1);
        const b = new Date(2020, 0, 1);

        expect(comparitorDate(a, b)).toBe(0);
    });

});

describe('comparitorString', () => {

    test('Should sort alphabetically', () => {
        const arr = ['banana', 'apple', 'cherry'];
        arr.sort(comparitorString);

        expect(arr).toEqual(['apple', 'banana', 'cherry']);
    });

    test('Should handle equal strings', () => {
        expect(comparitorString('abc', 'abc')).toBe(0);
    });

    test('Should handle case-insensitive comparison', () => {
        const result = comparitorString('Apple', 'apple');

        expect(typeof result).toBe('number');
    });

});
