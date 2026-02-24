import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    createCone,
    elementIsCone,
} from '../../src';

describe('Cone', () => {

    test('Should create a cone with correct state', () => {
        const cone = createCone({
            radius: 1,
            height: 2,
        });

        expect(cone.type).toBe('cone');
        expect(cone.radius).toBe(1);
        expect(cone.height).toBe(2);
        expect(cone.segments).toBe(16);
    });

    test('computeFaces returns side triangles + base cap', () => {
        const cone = createCone({
            radius: 1,
            height: 2,
            segments: 8,
        });

        const faces = (cone as unknown as { computeFaces(): unknown[] }).computeFaces();

        // 8 side triangles + 8 base cap triangles = 16
        expect(faces).toHaveLength(16);
    });

    test('elementIsCone identifies cones', () => {
        const cone = createCone({
            radius: 1,
            height: 2,
        });

        expect(elementIsCone(cone)).toBe(true);
        expect(elementIsCone({})).toBe(false);
    });

});
