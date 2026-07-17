import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    timeFormat,
} from '../src/time';

const LOCALE = 'en-US';

describe('timeFormat', () => {

    test('Should format a date with a default short format', () => {
        const result = timeFormat(new Date(2024, 0, 15), {
            locale: LOCALE,
        });

        expect(result).toBe('Jan 15, 2024');
    });

    test('Should accept an epoch millisecond value', () => {
        const millis = new Date(2024, 0, 15).getTime();

        expect(timeFormat(millis, {
            locale: LOCALE,
        })).toBe('Jan 15, 2024');
    });

    test('Should honour explicit field options', () => {
        const result = timeFormat(new Date(2024, 5, 1), {
            locale: LOCALE,
            month: 'long',
            year: 'numeric',
        });

        expect(result).toBe('June 2024');
    });

    test('Should format time-of-day fields', () => {
        const result = timeFormat(new Date(2024, 0, 1, 9, 30, 0), {
            locale: LOCALE,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });

        expect(result).toBe('09:30');
    });

});
