import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    serializeGradient,
} from '../../src';

import type {
    ConicGradient,
    LinearGradient,
    RadialGradient,
} from '../../src';

describe('Gradient Serializer', () => {

    // ── Linear ───────────────────────────────────────────────────

    describe('Linear Gradient', () => {

        test('Should serialize with default angle (180deg omitted)', () => {
            const gradient: LinearGradient = {
                type: 'linear',
                repeating: false,
                angle: 180,
                stops: [
                    { color: 'red' },
                    { color: 'blue' },
                ],
            };
            expect(serializeGradient(gradient)).toBe('linear-gradient(red, blue)');
        });

        test('Should serialize with custom angle', () => {
            const gradient: LinearGradient = {
                type: 'linear',
                repeating: false,
                angle: 90,
                stops: [
                    { color: 'red' },
                    { color: 'blue' },
                ],
            };
            expect(serializeGradient(gradient)).toBe('linear-gradient(90deg, red, blue)');
        });

        test('Should serialize repeating linear gradient', () => {
            const gradient: LinearGradient = {
                type: 'linear',
                repeating: true,
                angle: 45,
                stops: [
                    {
                        color: 'red',
                        offset: 0,
                    },
                    {
                        color: 'blue',
                        offset: 0.5,
                    },
                ],
            };
            const result = serializeGradient(gradient);
            expect(result).toMatch(/^repeating-linear-gradient/);
            expect(result).toContain('45deg');
        });

        test('Should format stop offsets as percentages', () => {
            const gradient: LinearGradient = {
                type: 'linear',
                repeating: false,
                angle: 180,
                stops: [
                    {
                        color: 'red',
                        offset: 0,
                    },
                    {
                        color: 'blue',
                        offset: 0.5,
                    },
                    {
                        color: 'green',
                        offset: 1,
                    },
                ],
            };
            const result = serializeGradient(gradient);
            expect(result).toContain('red 0.00%');
            expect(result).toContain('blue 50.00%');
            expect(result).toContain('green 100.00%');
        });

        test('Should omit offset when not specified', () => {
            const gradient: LinearGradient = {
                type: 'linear',
                repeating: false,
                angle: 180,
                stops: [
                    { color: 'red' },
                    { color: 'blue' },
                ],
            };
            const result = serializeGradient(gradient);
            expect(result).toBe('linear-gradient(red, blue)');
        });

    });

    // ── Radial ───────────────────────────────────────────────────

    describe('Radial Gradient', () => {

        test('Should serialize with default shape and position (omitted)', () => {
            const gradient: RadialGradient = {
                type: 'radial',
                repeating: false,
                shape: 'ellipse',
                position: [50, 50],
                stops: [
                    { color: 'red' },
                    { color: 'blue' },
                ],
            };
            expect(serializeGradient(gradient)).toBe('radial-gradient(red, blue)');
        });

        test('Should serialize with custom shape', () => {
            const gradient: RadialGradient = {
                type: 'radial',
                repeating: false,
                shape: 'circle',
                position: [50, 50],
                stops: [
                    { color: 'red' },
                    { color: 'blue' },
                ],
            };
            expect(serializeGradient(gradient)).toBe('radial-gradient(circle, red, blue)');
        });

        test('Should serialize with custom position', () => {
            const gradient: RadialGradient = {
                type: 'radial',
                repeating: false,
                shape: 'ellipse',
                position: [25, 75],
                stops: [
                    { color: 'red' },
                    { color: 'blue' },
                ],
            };
            expect(serializeGradient(gradient)).toBe('radial-gradient(ellipse at 25% 75%, red, blue)');
        });

        test('Should serialize repeating radial gradient', () => {
            const gradient: RadialGradient = {
                type: 'radial',
                repeating: true,
                shape: 'circle',
                position: [50, 50],
                stops: [
                    { color: 'red' },
                    { color: 'blue' },
                ],
            };
            expect(serializeGradient(gradient)).toMatch(/^repeating-radial-gradient/);
        });

    });

    // ── Conic ────────────────────────────────────────────────────

    describe('Conic Gradient', () => {

        test('Should serialize with default angle and position (omitted)', () => {
            const gradient: ConicGradient = {
                type: 'conic',
                repeating: false,
                angle: 0,
                position: [50, 50],
                stops: [
                    { color: 'red' },
                    { color: 'blue' },
                ],
            };
            expect(serializeGradient(gradient)).toBe('conic-gradient(red, blue)');
        });

        test('Should serialize with custom angle', () => {
            const gradient: ConicGradient = {
                type: 'conic',
                repeating: false,
                angle: 45,
                position: [50, 50],
                stops: [
                    { color: 'red' },
                    { color: 'blue' },
                ],
            };
            expect(serializeGradient(gradient)).toBe('conic-gradient(from 45deg, red, blue)');
        });

        test('Should serialize with custom position', () => {
            const gradient: ConicGradient = {
                type: 'conic',
                repeating: false,
                angle: 0,
                position: [25, 75],
                stops: [
                    { color: 'red' },
                    { color: 'blue' },
                ],
            };
            expect(serializeGradient(gradient)).toBe('conic-gradient(at 25% 75%, red, blue)');
        });

        test('Should serialize with custom angle and position', () => {
            const gradient: ConicGradient = {
                type: 'conic',
                repeating: false,
                angle: 90,
                position: [10, 20],
                stops: [
                    { color: 'red' },
                    { color: 'blue' },
                ],
            };
            expect(serializeGradient(gradient)).toBe('conic-gradient(from 90deg at 10% 20%, red, blue)');
        });

        test('Should serialize repeating conic gradient', () => {
            const gradient: ConicGradient = {
                type: 'conic',
                repeating: true,
                angle: 0,
                position: [50, 50],
                stops: [
                    { color: 'red' },
                    { color: 'blue' },
                ],
            };
            expect(serializeGradient(gradient)).toMatch(/^repeating-conic-gradient/);
        });

    });

});
