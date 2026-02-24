import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    createCylinder,
    elementIsCylinder,
} from '../../src';

describe('Cylinder', () => {

    test('Should create a cylinder with correct state', () => {
        const cyl = createCylinder({
            radiusTop: 1,
            radiusBottom: 1,
            height: 2,
        });

        expect(cyl.type).toBe('cylinder');
        expect(cyl.radiusTop).toBe(1);
        expect(cyl.radiusBottom).toBe(1);
        expect(cyl.height).toBe(2);
        expect(cyl.segments).toBe(16);
    });

    test('computeFaces returns side faces + caps', () => {
        const cyl = createCylinder({
            radiusTop: 1,
            radiusBottom: 1,
            height: 2,
            segments: 8,
        });

        const faces = (cyl as unknown as { computeFaces(): unknown[] }).computeFaces();

        // 8 side faces + 8 top cap triangles + 8 bottom cap triangles = 24
        expect(faces).toHaveLength(24);
    });

    test('elementIsCylinder identifies cylinders', () => {
        const cyl = createCylinder({
            radiusTop: 1,
            radiusBottom: 1,
            height: 2,
        });

        expect(elementIsCylinder(cyl)).toBe(true);
        expect(elementIsCylinder({})).toBe(false);
    });

});
