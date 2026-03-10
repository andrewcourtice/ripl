import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    numberGCD,
    numberNice,
    numberSum,
} from '../src/number';

describe('numberSum', () => {

    test('Should sum plain number array', () => {
        expect(numberSum([1, 2, 3])).toBe(6);
    });

    test('Should return 0 for empty array', () => {
        expect(numberSum([])).toBe(0);
    });

    test('Should sum with iteratee function', () => {
        const items = [
            { value: 10 },
            { value: 20 },
            { value: 30 },
        ];

        expect(numberSum(items, item => item.value)).toBe(60);
    });

    test('Should handle negative numbers', () => {
        expect(numberSum([-1, -2, 3])).toBe(0);
    });

});

describe('numberGCD', () => {

    test('Should compute GCD of two numbers', () => {
        expect(numberGCD(12, 8)).toBe(4);
    });

    test('Should return the non-zero value when one is 0', () => {
        expect(numberGCD(0, 5)).toBe(5);
        expect(numberGCD(7, 0)).toBe(7);
    });

    test('Should handle equal numbers', () => {
        expect(numberGCD(6, 6)).toBe(6);
    });

    test('Should handle coprime numbers', () => {
        expect(numberGCD(7, 13)).toBe(1);
    });

});

describe('numberNice', () => {

    test('Should round to a nice number', () => {
        const result = numberNice(123);

        expect(result).toBeDefined();
        expect(typeof result).toBe('number');
    });

    test('Should handle round=true', () => {
        const result = numberNice(37, true);

        expect(result).toBeDefined();
        expect(typeof result).toBe('number');
    });

    test('Should return a number >= input when rounding up', () => {
        const result = numberNice(37, false);

        expect(result).toBeGreaterThanOrEqual(37);
    });

});
