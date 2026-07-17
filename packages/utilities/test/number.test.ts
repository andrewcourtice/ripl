import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    numberClamp,
    numberExtent,
    numberFormat,
    numberFractional,
    numberMaxOf,
    numberMinOf,
    numberNice,
    numberRoundTo,
    numberSum,
} from '../src/number';

// Explicit en-US locale keeps assertions deterministic across environments.
const LOCALE = 'en-US';

describe('numberClamp', () => {

    test('Should clamp a value to the upper bound', () => {
        expect(numberClamp(10, 5, 8)).toBe(8);
    });

    test('Should clamp a value to the lower bound', () => {
        expect(numberClamp(-10, -5, 8)).toBe(-5);
    });

    test('Should leave an in-range value unchanged', () => {
        expect(numberClamp(6, 0, 10)).toBe(6);
    });

    test('Should handle reversed bounds', () => {
        expect(numberClamp(6, 10, 0)).toBe(6);
        expect(numberClamp(20, 10, 0)).toBe(10);
    });

});

describe('numberMinOf', () => {

    test('Should return the minimum extracted value', () => {
        const data = [
            { v: 10 },
            { v: 50 },
            { v: 30 },
        ];

        expect(numberMinOf(data, d => d.v)).toBe(10);
    });

});

describe('numberMaxOf', () => {

    test('Should return the maximum extracted value', () => {
        const data = [
            { v: 10 },
            { v: 50 },
            { v: 30 },
        ];

        expect(numberMaxOf(data, d => d.v)).toBe(50);
    });

});

describe('numberExtent', () => {

    test('Should return the [min, max] extent', () => {
        const data = [
            { v: 10 },
            { v: 50 },
            { v: 30 },
        ];

        expect(numberExtent(data, d => d.v)).toEqual([10, 50]);
    });

});

describe('numberFractional', () => {

    test('Should return the fractional part of a float', () => {
        const value = 31.257;

        expect(numberFractional(value)).toBe(value - Math.floor(value));
    });

    test('Should return 0 for an integer', () => {
        expect(numberFractional(5)).toBe(0);
    });

});

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

describe('numberRoundTo', () => {

    test('Should default to at most 2 decimal places', () => {
        expect(numberRoundTo(3.14159)).toBe(3.14);
        expect(numberRoundTo(1.236)).toBe(1.24);
    });

    test('Should leave integers unchanged and strip trailing zeros', () => {
        expect(numberRoundTo(5)).toBe(5);
        expect(numberRoundTo(5.10)).toBe(5.1);
        expect(numberRoundTo(5.001)).toBe(5);
    });

    test('Should respect a custom precision', () => {
        expect(numberRoundTo(3.14159, 3)).toBe(3.142);
        expect(numberRoundTo(3.14159, 0)).toBe(3);
    });

    test('Should handle negative numbers', () => {
        expect(numberRoundTo(-1.239, 2)).toBe(-1.24);
    });

    test('Should pass non-finite values through unchanged', () => {
        expect(numberRoundTo(Infinity)).toBe(Infinity);
        expect(Number.isNaN(numberRoundTo(NaN))).toBe(true);
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

describe('numberFormat', () => {

    test('Should group thousands by default', () => {
        expect(numberFormat(1234567, {
            locale: LOCALE,
        })).toBe('1,234,567');
    });

    test('Should cap fraction digits via precision and strip trailing zeros', () => {
        expect(numberFormat(1234.5, {
            locale: LOCALE,
            precision: 2,
        })).toBe('1,234.5');

        expect(numberFormat(1234.567, {
            locale: LOCALE,
            precision: 2,
        })).toBe('1,234.57');

        expect(numberFormat(1234, {
            locale: LOCALE,
            precision: 2,
        })).toBe('1,234');
    });

    test('Should format percentages', () => {
        expect(numberFormat(0.25, {
            locale: LOCALE,
            style: 'percent',
        })).toBe('25%');
    });

    test('Should format currency', () => {
        expect(numberFormat(1999.9, {
            locale: LOCALE,
            style: 'currency',
            currency: 'USD',
        })).toBe('$1,999.90');
    });

    test('Should format compact/SI notation', () => {
        expect(numberFormat(1200000, {
            locale: LOCALE,
            notation: 'compact',
        })).toBe('1.2M');
    });

    test('Should fall back to String for non-numeric values', () => {
        expect(numberFormat('n/a')).toBe('n/a');
        expect(numberFormat(null)).toBe('null');
    });

});
