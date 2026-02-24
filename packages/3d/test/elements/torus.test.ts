import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    createTorus,
    elementIsTorus,
} from '../../src';

describe('Torus', () => {

    test('Should create a torus with correct state', () => {
        const torus = createTorus({
            radius: 2,
            tube: 0.5,
        });

        expect(torus.type).toBe('torus');
        expect(torus.radius).toBe(2);
        expect(torus.tube).toBe(0.5);
        expect(torus.radialSegments).toBe(12);
        expect(torus.tubularSegments).toBe(24);
    });

    test('computeFaces returns expected face count', () => {
        const torus = createTorus({
            radius: 2,
            tube: 0.5,
            radialSegments: 6,
            tubularSegments: 8,
        });

        const faces = (torus as unknown as { computeFaces(): unknown[] }).computeFaces();

        // tubularSegments * radialSegments = 8 * 6 = 48
        expect(faces).toHaveLength(48);
    });

    test('elementIsTorus identifies torus', () => {
        const torus = createTorus({
            radius: 1,
            tube: 0.3,
        });

        expect(elementIsTorus(torus)).toBe(true);
        expect(elementIsTorus({})).toBe(false);
    });

});
