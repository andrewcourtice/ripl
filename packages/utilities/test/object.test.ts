import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    objectFreeze,
} from '../src/object';

describe('objectFreeze', () => {

    test('Should return a frozen copy', () => {
        const original = {
            a: 1,
            b: 2,
        };

        const frozen = objectFreeze(original);

        expect(Object.isFrozen(frozen)).toBe(true);
        expect(frozen.a).toBe(1);
        expect(frozen.b).toBe(2);
    });

    test('Should not freeze the original object', () => {
        const original = {
            a: 1,
        };

        objectFreeze(original);

        expect(Object.isFrozen(original)).toBe(false);
    });

    test('Should prevent mutations on the frozen copy', () => {
        const frozen = objectFreeze({ x: 10 });

        expect(() => {
            (frozen as Record<string, number>).x = 99;
        }).toThrow();
    });

});
