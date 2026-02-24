import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    createPlane,
    elementIsPlane,
} from '../../src';

describe('Plane', () => {

    test('Should create a plane with correct state', () => {
        const plane = createPlane({
            width: 4,
            height: 3,
        });

        expect(plane.type).toBe('plane');
        expect(plane.width).toBe(4);
        expect(plane.height).toBe(3);
    });

    test('computeFaces returns 1 face with 4 vertices', () => {
        const plane = createPlane({
            width: 2,
            height: 2,
        });

        const faces = (plane as unknown as { computeFaces(): { vertices: unknown[] }[] }).computeFaces();

        expect(faces).toHaveLength(1);
        expect(faces[0].vertices).toHaveLength(4);
    });

    test('elementIsPlane identifies planes', () => {
        const plane = createPlane({
            width: 1,
            height: 1,
        });

        expect(elementIsPlane(plane)).toBe(true);
        expect(elementIsPlane({})).toBe(false);
    });

});
