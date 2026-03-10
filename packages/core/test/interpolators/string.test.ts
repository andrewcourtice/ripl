import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    interpolateString,
} from '../../src';

describe('interpolateString', () => {

    test('Should interpolate numeric values in tagged template literals', () => {
        const interpolator = interpolateString(tag => [
            tag`translate(${0}, ${0})`,
            tag`translate(${100}, ${200})`,
        ]);

        const result = interpolator(0.5);

        expect(result).toContain('translate(');
        expect(result).toContain('50');
        expect(result).toContain('100');
    });

    test('Should return start values at t=0', () => {
        const interpolator = interpolateString(tag => [
            tag`scale(${1})`,
            tag`scale(${2})`,
        ]);

        const result = interpolator(0);

        expect(result).toBe('scale(1)');
    });

    test('Should return end values at t=1', () => {
        const interpolator = interpolateString(tag => [
            tag`scale(${1})`,
            tag`scale(${2})`,
        ]);

        const result = interpolator(1);

        expect(result).toBe('scale(2)');
    });

    test('Should throw if arg counts do not match', () => {
        expect(() => interpolateString(tag => [
            tag`translate(${0})`,
            tag`translate(${100}, ${200})`,
        ])).toThrow('Interpolation strings must have a matching number of interpolated args');
    });

    test('Should apply custom formatter', () => {
        const interpolator = interpolateString(
            tag => [
                tag`rotate(${0})`,
                tag`rotate(${90})`,
            ],
            value => Math.round(value)
        );

        const result = interpolator(0.5);

        expect(result).toBe('rotate(45)');
    });

    test('Should handle multiple interpolated values', () => {
        const interpolator = interpolateString(tag => [
            tag`matrix(${1}, ${0}, ${0}, ${1}, ${0}, ${0})`,
            tag`matrix(${2}, ${0}, ${0}, ${2}, ${100}, ${200})`,
        ]);

        const result = interpolator(1);

        expect(result).toContain('matrix(');
        expect(result).toContain('200');
    });

    test('Should preserve static text fragments', () => {
        const interpolator = interpolateString(tag => [
            tag`width: ${100}px; height: ${50}px`,
            tag`width: ${200}px; height: ${100}px`,
        ]);

        const result = interpolator(0);

        expect(result).toBe('width: 100px; height: 50px');
    });

    test('Should handle zero args gracefully', () => {
        const interpolator = interpolateString(tag => [
            tag`hello`,
            tag`hello`,
        ]);

        const result = interpolator(0.5);

        expect(result).toBe('hello');
    });

});
