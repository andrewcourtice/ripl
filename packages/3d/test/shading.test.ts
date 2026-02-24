import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    computeFaceBrightness,
    computeFaceNormal,
    shadeFaceColor,
} from '../src';

import type {
    Vector3,
} from '../src';

describe('Shading', () => {

    test('computeFaceNormal returns correct normal for XY plane triangle', () => {
        const vertices: Vector3[] = [
            [0, 0, 0],
            [1, 0, 0],
            [0, 1, 0],
        ];

        const normal = computeFaceNormal(vertices);

        expect(normal[0]).toBeCloseTo(0);
        expect(normal[1]).toBeCloseTo(0);
        expect(normal[2]).toBeCloseTo(1);
    });

    test('computeFaceBrightness: face facing light returns 1', () => {
        const normal: Vector3 = [0, 0, -1];
        const light: Vector3 = [0, 0, 1];
        expect(computeFaceBrightness(normal, light)).toBeCloseTo(1);
    });

    test('computeFaceBrightness: face facing away returns 0', () => {
        const normal: Vector3 = [0, 0, 1];
        const light: Vector3 = [0, 0, 1];
        expect(computeFaceBrightness(normal, light)).toBeCloseTo(0);
    });

    test('computeFaceBrightness: 45 degree angle', () => {
        const s = Math.SQRT1_2;
        const normal: Vector3 = [0, -s, -s];
        const light: Vector3 = [0, 0, 1];
        const brightness = computeFaceBrightness(normal, light);
        expect(brightness).toBeCloseTo(Math.SQRT1_2, 4);
    });

    test('shadeFaceColor: brightness 1 returns base color', () => {
        const result = shadeFaceColor('rgb(100, 200, 50)', 1);
        expect(result).toContain('100');
        expect(result).toContain('200');
        expect(result).toContain('50');
    });

    test('shadeFaceColor: brightness 0 returns black', () => {
        const result = shadeFaceColor('rgb(100, 200, 50)', 0);
        expect(result).toContain('0');
    });

    test('shadeFaceColor: invalid color returns original string', () => {
        expect(shadeFaceColor('not-a-color', 0.5)).toBe('not-a-color');
    });

});
