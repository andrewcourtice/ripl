/* eslint-disable id-length */

import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    createCube,
    elementIsCube,
} from '../../src';

describe('Cube', () => {

    test('Should create a cube with correct state', () => {
        const cube = createCube({
            x: 1,
            y: 2,
            z: 3,
            size: 2,
            fillStyle: '#ff0000',
        });

        expect(cube.type).toBe('cube');
        expect(cube.x).toBe(1);
        expect(cube.y).toBe(2);
        expect(cube.z).toBe(3);
        expect(cube.size).toBe(2);
    });

    test('Should update state via setters', () => {
        const cube = createCube({
            size: 1,
        });

        cube.x = 5;
        cube.y = 6;
        cube.z = 7;
        cube.size = 3;

        expect(cube.x).toBe(5);
        expect(cube.y).toBe(6);
        expect(cube.z).toBe(7);
        expect(cube.size).toBe(3);
    });

    test('computeFaces returns 6 faces with 4 vertices each', () => {
        const cube = createCube({
            size: 2,
        });

        // Access protected method via type assertion
        const faces = (cube as unknown as { computeFaces(): { vertices: unknown[] }[] }).computeFaces();

        expect(faces).toHaveLength(6);

        for (const face of faces) {
            expect(face.vertices).toHaveLength(4);
        }
    });

    test('elementIsCube identifies cubes', () => {
        const cube = createCube({
            size: 1,
        });

        expect(elementIsCube(cube)).toBe(true);
        expect(elementIsCube({})).toBe(false);
        expect(elementIsCube(null)).toBe(false);
    });

});
