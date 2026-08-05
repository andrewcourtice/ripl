import {
    beforeAll,
    describe,
    expect,
    test,
} from 'vitest';

import {
    classifyExpression,
} from './classify';

import {
    compileExpression,
} from './compile';

import {
    loadMathEngine,
} from './engine';

import {
    evaluateSurface,
    MAX_SURFACE_RESOLUTION,
} from './surface';

import type {
    SurfaceDomain,
    SurfaceField,
} from '../types';

const DOMAIN: SurfaceDomain = {
    xMin: -1,
    xMax: 1,
    yMin: -1,
    yMax: 1,
};

function evaluate(source: string, resolution: number): SurfaceField {
    return evaluateSurface(compileExpression(classifyExpression(source)), {
        domain: DOMAIN,
        resolution,
        params: new Map(),
    });
}

describe('Graphing calculator surface evaluation', () => {

    beforeAll(async () => {
        await loadMathEngine();
    });

    test('Should evaluate one height per grid vertex', () => {
        const field = evaluate('z = x^2 + y^2', 5);

        expect(field.resolution).toBe(5);
        expect(field.values).toHaveLength(25);
    });

    test('Should sample the domain corner to corner', () => {
        const field = evaluate('z = x + y', 3);

        expect(field.values[0]).toBeCloseTo(-2, 6);
        expect(field.values[8]).toBeCloseTo(2, 6);
        expect(field.values[4]).toBeCloseTo(0, 6);
    });

    test('Should report the height extent', () => {
        const field = evaluate('z = x^2 + y^2', 5);

        expect(field.zMin).toBeCloseTo(0, 6);
        expect(field.zMax).toBeCloseTo(2, 6);
    });

    test('Should mark an undefined vertex as NaN without disturbing the extent', () => {
        const field = evaluate('z = sqrt(x)', 3);

        expect(field.values[0]).toBeNaN();
        expect(field.zMin).toBeCloseTo(0, 6);
        expect(field.zMax).toBeCloseTo(1, 6);
    });

    test('Should substitute parameter values', () => {
        const compiled = compileExpression(classifyExpression('z = a*x'));
        const field = evaluateSurface(compiled, {
            domain: DOMAIN,
            resolution: 3,
            params: new Map([['a', 4]]),
        });

        expect(field.zMax).toBeCloseTo(4, 6);
    });

    test('Should clamp the resolution to the supported range', () => {
        expect(evaluate('z = x', 1).resolution).toBe(2);
        expect(evaluate('z = x', 1e6).resolution).toBe(MAX_SURFACE_RESOLUTION);
    });

    test('Should copy the domain rather than alias the caller', () => {
        const field = evaluate('z = x', 3);

        expect(field.domain).toEqual(DOMAIN);
        expect(field.domain).not.toBe(DOMAIN);
    });

    test('Should return an empty field for an expression that failed to compile', () => {
        const field = evaluate('z = sin(x', 8);

        expect(field.zMin).toBe(0);
        expect(field.zMax).toBe(0);
        expect(field.values.every(Number.isNaN)).toBe(true);
    });

});
