import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    predicateIdentity,
    predicateKey,
} from '../src';

describe('Predicate Utilities', () => {

    describe('predicateIdentity', () => {
        test('Should return true for strictly equal values', () => {
            expect(predicateIdentity(1, 1)).toBe(true);
            expect(predicateIdentity('a', 'a')).toBe(true);
            const obj = {};
            expect(predicateIdentity(obj, obj)).toBe(true);
        });

        test('Should return false for different values', () => {
            expect(predicateIdentity(1, 2)).toBe(false);
            expect(predicateIdentity('a', 'b')).toBe(false);
            expect(predicateIdentity({}, {})).toBe(false);
        });
    });

    describe('predicateKey', () => {
        test('Should compare objects by a specific key', () => {
            const a = {
                id: 1,
                name: 'Alice',
            };
            const b = {
                id: 1,
                name: 'Bob',
            };
            const c = {
                id: 2,
                name: 'Alice',
            };

            expect(predicateKey(a, b, 'id')).toBe(true);
            expect(predicateKey(a, c, 'id')).toBe(false);
            expect(predicateKey(a, c, 'name')).toBe(true);
        });
    });

});
