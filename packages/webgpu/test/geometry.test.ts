import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    triangulatefaces,
} from '../src/geometry';

import type {
    Face3D,
} from '@ripl/3d';

import type {
    ColorRGBA,
} from '@ripl/core';

describe('triangulatefaces', () => {

    const identity = new Float64Array([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ]);

    const white: ColorRGBA = [255, 255, 255, 1];

    test('single triangle produces 3 vertices and 3 indices', () => {
        const faces: Face3D[] = [
            {
                vertices: [
                    [0, 0, 0],
                    [1, 0, 0],
                    [0, 1, 0],
                ],
            },
        ];

        const result = triangulatefaces(faces, identity, white);

        // 3 vertices × 10 floats each = 30
        expect(result.vertices).toHaveLength(30);
        // 1 triangle = 3 indices
        expect(result.indices).toHaveLength(3);
        expect(result.indices[0]).toBe(0);
        expect(result.indices[1]).toBe(1);
        expect(result.indices[2]).toBe(2);
    });

    test('quad face produces 4 vertices and 6 indices (fan triangulation)', () => {
        const faces: Face3D[] = [
            {
                vertices: [
                    [0, 0, 0],
                    [1, 0, 0],
                    [1, 1, 0],
                    [0, 1, 0],
                ],
            },
        ];

        const result = triangulatefaces(faces, identity, white);

        // 4 vertices × 10 floats = 40
        expect(result.vertices).toHaveLength(40);
        // 2 triangles = 6 indices
        expect(result.indices).toHaveLength(6);
        // First triangle: 0, 1, 2
        expect(result.indices[0]).toBe(0);
        expect(result.indices[1]).toBe(1);
        expect(result.indices[2]).toBe(2);
        // Second triangle: 0, 2, 3
        expect(result.indices[3]).toBe(0);
        expect(result.indices[4]).toBe(2);
        expect(result.indices[5]).toBe(3);
    });

    test('interleaves position, normal, and color per vertex', () => {
        const faces: Face3D[] = [
            {
                vertices: [
                    [1, 2, 3],
                    [4, 5, 6],
                    [7, 8, 9],
                ],
            },
        ];

        const color: ColorRGBA = [255, 128, 0, 0.5];
        const result = triangulatefaces(faces, identity, color);

        // First vertex: position
        expect(result.vertices[0]).toBe(1);
        expect(result.vertices[1]).toBe(2);
        expect(result.vertices[2]).toBe(3);

        // First vertex: normal (auto-computed) at indices 3-5
        expect(typeof result.vertices[3]).toBe('number');
        expect(typeof result.vertices[4]).toBe('number');
        expect(typeof result.vertices[5]).toBe('number');

        // First vertex: color at indices 6-9
        expect(result.vertices[6]).toBeCloseTo(1); // 255/255
        expect(result.vertices[7]).toBeCloseTo(128 / 255); // ~0.502
        expect(result.vertices[8]).toBeCloseTo(0); // 0/255
        expect(result.vertices[9]).toBeCloseTo(0.5); // alpha passed through
    });

    test('normalises RGBA color channels correctly', () => {
        const faces: Face3D[] = [
            {
                vertices: [
                    [0, 0, 0],
                    [1, 0, 0],
                    [0, 1, 0],
                ],
            },
        ];

        const color: ColorRGBA = [51, 102, 204, 0.8];
        const result = triangulatefaces(faces, identity, color);

        // Check color of first vertex (indices 6-9)
        expect(result.vertices[6]).toBeCloseTo(51 / 255);
        expect(result.vertices[7]).toBeCloseTo(102 / 255);
        expect(result.vertices[8]).toBeCloseTo(204 / 255);
        expect(result.vertices[9]).toBeCloseTo(0.8);
    });

    test('uses provided face.normal when present', () => {
        const customNormal: [number, number, number] = [0, 0, -1];
        const faces: Face3D[] = [
            {
                vertices: [
                    [0, 0, 0],
                    [1, 0, 0],
                    [0, 1, 0],
                ],
                normal: customNormal,
            },
        ];

        const result = triangulatefaces(faces, identity, white);

        // All 3 vertices should have the custom normal
        for (let vi = 0; vi < 3; vi++) {
            const base = vi * 10;
            expect(result.vertices[base + 3]).toBe(0);
            expect(result.vertices[base + 4]).toBe(0);
            expect(result.vertices[base + 5]).toBe(-1);
        }
    });

    test('computes normal when face.normal is undefined', () => {
        // XY-plane triangle: normal should point in +Z
        const faces: Face3D[] = [
            {
                vertices: [
                    [0, 0, 0],
                    [1, 0, 0],
                    [0, 1, 0],
                ],
            },
        ];

        const result = triangulatefaces(faces, identity, white);

        expect(result.vertices[3]).toBeCloseTo(0);
        expect(result.vertices[4]).toBeCloseTo(0);
        expect(result.vertices[5]).toBeCloseTo(1);
    });

    test('degenerate face (collinear vertices) uses fallback normal [0, 1, 0]', () => {
        const faces: Face3D[] = [
            {
                vertices: [
                    [0, 0, 0],
                    [1, 0, 0],
                    [2, 0, 0],
                ],
            },
        ];

        const result = triangulatefaces(faces, identity, white);

        expect(result.vertices[3]).toBe(0);
        expect(result.vertices[4]).toBe(1);
        expect(result.vertices[5]).toBe(0);
    });

    test('multiple faces accumulate correct vertex and index counts', () => {
        const faces: Face3D[] = [
            {
                vertices: [
                    [0, 0, 0],
                    [1, 0, 0],
                    [0, 1, 0],
                ],
            },
            {
                vertices: [
                    [2, 0, 0],
                    [3, 0, 0],
                    [3, 1, 0],
                    [2, 1, 0],
                ],
            },
        ];

        const result = triangulatefaces(faces, identity, white);

        // 3 + 4 = 7 vertices × 10 = 70 floats
        expect(result.vertices).toHaveLength(70);
        // 1 triangle + 2 triangles = 3 + 6 = 9 indices (wait: 3 + 6 = 9)
        // Actually: first face: 3 indices, second face (quad): 6 indices = 9
        // Wait, first face (tri): (3-2)*3 = 3, second face (quad): (4-2)*3 = 6 → total 9
        expect(result.indices).toHaveLength(9);
    });

    test('indices for second face are offset by first face vertex count', () => {
        const faces: Face3D[] = [
            {
                vertices: [
                    [0, 0, 0],
                    [1, 0, 0],
                    [0, 1, 0],
                ],
            },
            {
                vertices: [
                    [2, 0, 0],
                    [3, 0, 0],
                    [2, 1, 0],
                ],
            },
        ];

        const result = triangulatefaces(faces, identity, white);

        // First face indices: 0, 1, 2
        expect(result.indices[0]).toBe(0);
        expect(result.indices[1]).toBe(1);
        expect(result.indices[2]).toBe(2);

        // Second face indices offset by 3 (first face vertex count)
        expect(result.indices[3]).toBe(3);
        expect(result.indices[4]).toBe(4);
        expect(result.indices[5]).toBe(5);
    });

    test('empty faces array produces empty typed arrays', () => {
        const result = triangulatefaces([], identity, white);

        expect(result.vertices).toHaveLength(0);
        expect(result.indices).toHaveLength(0);
        expect(result.vertices).toBeInstanceOf(Float32Array);
        expect(result.indices).toBeInstanceOf(Uint32Array);
    });

    test('position data is stored as-is from vertex coordinates', () => {
        const faces: Face3D[] = [
            {
                vertices: [
                    [10.5, -3.2, 7.8],
                    [1, 0, 0],
                    [0, 1, 0],
                ],
            },
        ];

        const result = triangulatefaces(faces, identity, white);

        expect(result.vertices[0]).toBeCloseTo(10.5);
        expect(result.vertices[1]).toBeCloseTo(-3.2);
        expect(result.vertices[2]).toBeCloseTo(7.8);
    });

});
