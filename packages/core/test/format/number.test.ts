import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    formatNumber,
} from '../../src';

// Explicit en-US locale keeps assertions deterministic across environments.
const LOCALE = 'en-US';

describe('formatNumber', () => {

    test('Should group thousands by default', () => {
        expect(formatNumber(1234567, {
            locale: LOCALE,
        })).toBe('1,234,567');
    });

    test('Should cap fraction digits via precision and strip trailing zeros', () => {
        expect(formatNumber(1234.5, {
            locale: LOCALE,
            precision: 2,
        })).toBe('1,234.5');

        expect(formatNumber(1234.567, {
            locale: LOCALE,
            precision: 2,
        })).toBe('1,234.57');

        expect(formatNumber(1234, {
            locale: LOCALE,
            precision: 2,
        })).toBe('1,234');
    });

    test('Should format percentages', () => {
        expect(formatNumber(0.25, {
            locale: LOCALE,
            style: 'percent',
        })).toBe('25%');
    });

    test('Should format currency', () => {
        expect(formatNumber(1999.9, {
            locale: LOCALE,
            style: 'currency',
            currency: 'USD',
        })).toBe('$1,999.90');
    });

    test('Should format compact/SI notation', () => {
        expect(formatNumber(1200000, {
            locale: LOCALE,
            notation: 'compact',
        })).toBe('1.2M');
    });

    test('Should fall back to String for non-numeric values', () => {
        expect(formatNumber('n/a')).toBe('n/a');
        expect(formatNumber(null)).toBe('null');
    });

});
