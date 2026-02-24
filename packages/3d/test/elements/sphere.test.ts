import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    createSphere,
    elementIsSphere,
} from '../../src';

describe('Sphere', () => {

    test('Should create a sphere with correct state', () => {
        const sphere = createSphere({
            radius: 2,
        });

        expect(sphere.type).toBe('sphere');
        expect(sphere.radius).toBe(2);
        expect(sphere.segments).toBe(16);
        expect(sphere.rings).toBe(12);
    });

    test('Should create with custom segments and rings', () => {
        const sphere = createSphere({
            radius: 1,
            segments: 8,
            rings: 6,
        });

        expect(sphere.segments).toBe(8);
        expect(sphere.rings).toBe(6);
    });

    test('computeFaces returns expected face count', () => {
        const sphere = createSphere({
            radius: 1,
            segments: 8,
            rings: 6,
        });

        const faces = (sphere as unknown as { computeFaces(): unknown[] }).computeFaces();

        // For 8 segments and 6 rings: each ring produces `segments` faces
        // Total = rings * segments = 6 * 8 = 48
        expect(faces).toHaveLength(48);
    });

    test('elementIsSphere identifies spheres', () => {
        const sphere = createSphere({
            radius: 1,
        });

        expect(elementIsSphere(sphere)).toBe(true);
        expect(elementIsSphere({})).toBe(false);
        expect(elementIsSphere(null)).toBe(false);
    });

});
