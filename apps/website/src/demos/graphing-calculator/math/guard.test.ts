import {
    beforeAll,
    describe,
    expect,
    test,
} from 'vitest';

import {
    getMathEngine,
    loadMathEngine,
} from './engine';

import {
    guardNode,
    guardResult,
} from './guard';

function guard(source: string): string | undefined {
    return guardNode(getMathEngine().parse(source));
}

describe('Graphing calculator expression guard', () => {

    beforeAll(async () => {
        await loadMathEngine();
    });

    test('Should accept a scalar expression', () => {
        expect(guard('a * sin(b * x) + sqrt(abs(x))')).toBeUndefined();
    });

    test('Should reject a range', () => {
        expect(guard('1:1e9')).toBeTruthy();
    });

    test('Should reject an allocating function', () => {
        expect(guard('zeros(1e8)')).toBeTruthy();
        expect(guard('ones(1e8)')).toBeTruthy();
        expect(guard('combinations(1e9, 5e8)')).toBeTruthy();
    });

    test('Should reject property and index access', () => {
        expect(guard('a[1]')).toBeTruthy();
        expect(guard('a.b')).toBeTruthy();
    });

    test('Should reject an array literal', () => {
        expect(guard('[1, 2, 3]')).toBeTruthy();
    });

    test('Should reject an assignment', () => {
        expect(guard('a = 2')).toBeTruthy();
    });

    test('Should reject a function definition', () => {
        expect(guard('f(x) = x^2')).toBeTruthy();
    });

    test('Should reject a comparison', () => {
        expect(guard('x >= 2')).toBeTruthy();
        expect(guard('1 < x < 2')).toBeTruthy();
    });

    test('Should reject a non-numeric probe result', () => {
        expect(guardResult(1)).toBeUndefined();
        expect(guardResult(NaN)).toBeUndefined();
        expect(guardResult(true)).toBeTruthy();
        expect(guardResult('2')).toBeTruthy();
    });

});
