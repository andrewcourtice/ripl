import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    typeIsArray,
    typeIsDate,
    typeIsFunction,
    typeIsNil,
    typeIsNumber,
    typeIsObject,
    typeIsString,
} from '../src';

describe('Type Guards', () => {

    describe('typeIsArray', () => {
        test('Should return true for arrays', () => {
            expect(typeIsArray([])).toBe(true);
            expect(typeIsArray([1, 2, 3])).toBe(true);
        });

        test('Should return false for non-arrays', () => {
            expect(typeIsArray('hello')).toBe(false);
            expect(typeIsArray({})).toBe(false);
            expect(typeIsArray(null)).toBe(false);
        });
    });

    describe('typeIsDate', () => {
        test('Should return true for Date instances', () => {
            expect(typeIsDate(new Date())).toBe(true);
        });

        test('Should return false for non-dates', () => {
            expect(typeIsDate('2024-01-01')).toBe(false);
            expect(typeIsDate(1234567890)).toBe(false);
            expect(typeIsDate(null)).toBe(false);
        });
    });

    describe('typeIsObject', () => {
        test('Should return true for plain objects', () => {
            expect(typeIsObject({})).toBe(true);
            expect(typeIsObject({ a: 1 })).toBe(true);
        });

        test('Should return true for arrays (typeof object)', () => {
            expect(typeIsObject([])).toBe(true);
        });

        test('Should return false for null', () => {
            expect(typeIsObject(null)).toBe(false);
        });

        test('Should return false for primitives', () => {
            expect(typeIsObject('hello')).toBe(false);
            expect(typeIsObject(42)).toBe(false);
            expect(typeIsObject(undefined)).toBe(false);
            expect(typeIsObject(true)).toBe(false);
        });
    });

    describe('typeIsFunction', () => {
        test('Should return true for functions', () => {
            expect(typeIsFunction(() => {})).toBe(true);
            expect(typeIsFunction(function() {})).toBe(true);
            expect(typeIsFunction(Math.max)).toBe(true);
        });

        test('Should return false for non-functions', () => {
            expect(typeIsFunction({})).toBe(false);
            expect(typeIsFunction('hello')).toBe(false);
            expect(typeIsFunction(null)).toBe(false);
        });
    });

    describe('typeIsNumber', () => {
        test('Should return true for numbers', () => {
            expect(typeIsNumber(0)).toBe(true);
            expect(typeIsNumber(42)).toBe(true);
            expect(typeIsNumber(-1.5)).toBe(true);
            expect(typeIsNumber(NaN)).toBe(true);
            expect(typeIsNumber(Infinity)).toBe(true);
        });

        test('Should return false for non-numbers', () => {
            expect(typeIsNumber('42')).toBe(false);
            expect(typeIsNumber(null)).toBe(false);
            expect(typeIsNumber(undefined)).toBe(false);
        });
    });

    describe('typeIsString', () => {
        test('Should return true for strings', () => {
            expect(typeIsString('')).toBe(true);
            expect(typeIsString('hello')).toBe(true);
        });

        test('Should return false for non-strings', () => {
            expect(typeIsString(42)).toBe(false);
            expect(typeIsString(null)).toBe(false);
            expect(typeIsString(undefined)).toBe(false);
        });
    });

    describe('typeIsNil', () => {
        test('Should return true for null and undefined', () => {
            expect(typeIsNil(null)).toBe(true);
            expect(typeIsNil(undefined)).toBe(true);
        });

        test('Should return false for non-nil values', () => {
            expect(typeIsNil(0)).toBe(false);
            expect(typeIsNil('')).toBe(false);
            expect(typeIsNil(false)).toBe(false);
            expect(typeIsNil({})).toBe(false);
        });
    });

});
