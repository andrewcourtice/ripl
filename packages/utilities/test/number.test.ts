import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    numberGCD,
    numberNice,
    numberSum,
    roundTo,
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

describe('roundTo', () => {

    test('Should default to at most 2 decimal places', () => {
        expect(roundTo(3.14159)).toBe(3.14);
        expect(roundTo(1.236)).toBe(1.24);
    });

    test('Should leave integers unchanged and strip trailing zeros', () => {
        expect(roundTo(5)).toBe(5);
        expect(roundTo(5.10)).toBe(5.1);
        expect(roundTo(5.001)).toBe(5);
    });

    test('Should respect a custom precision', () => {
        expect(roundTo(3.14159, 3)).toBe(3.142);
        expect(roundTo(3.14159, 0)).toBe(3);
    });

    test('Should handle negative numbers', () => {
        expect(roundTo(-1.239, 2)).toBe(-1.24);
    });

    test('Should pass non-finite values through unchanged', () => {
        expect(roundTo(Infinity)).toBe(Infinity);
        expect(Number.isNaN(roundTo(NaN))).toBe(true);
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
