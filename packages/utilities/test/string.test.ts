import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    stringEquals,
    stringUniqueId,
} from '../src';

describe('String Utilities', () => {

    describe('stringUniqueId', () => {
        test('Should generate a string', () => {
            const id = stringUniqueId();
            expect(typeof id).toBe('string');
            expect(id.length).toBeGreaterThan(0);
        });

        test('Should generate unique values', () => {
            const ids = new Set(Array.from({ length: 100 }, () => stringUniqueId()));
            expect(ids.size).toBe(100);
        });
    });

    describe('stringEquals', () => {
        test('Should compare strings case-insensitively', () => {
            expect(stringEquals('Hello', 'hello')).toBe(true);
            expect(stringEquals('WORLD', 'world')).toBe(true);
            expect(stringEquals('Test', 'Test')).toBe(true);
        });

        test('Should return false for different strings', () => {
            expect(stringEquals('hello', 'world')).toBe(false);
            expect(stringEquals('abc', 'abd')).toBe(false);
        });
    });

});
