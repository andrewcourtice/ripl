import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    createTexture,
    resolveMaterial,
    triangulateFacesFlat,
    triangulateFacesIndices,
    VERTEX_FLOATS,
} from '../../src';

import type {
    Face3D,
    Material,
} from '../../src';

const POSITION_OFFSET = 0;
const NORMAL_OFFSET = 3;
const COLOR_OFFSET = 6;
const UV_OFFSET = 10;

function flatten(faces: Face3D[], material?: Material) {
    return triangulateFacesFlat(faces, resolveMaterial(material, '#ffffff'));
}

const TRIANGLE: Face3D[] = [
    {
        vertices: [
            [0, 0, 0],
            [1, 0, 0],
            [0, 1, 0],
        ],
    },
];

describe('Triangulation', () => {

    describe('triangulateFacesFlat', () => {

        test('Should emit one interleaved vertex per face vertex', () => {
            expect(flatten(TRIANGLE)).toHaveLength(3 * VERTEX_FLOATS);
        });

        test('Should store positions verbatim', () => {
            const vertices = flatten([
                {
                    vertices: [
                        [10.5, -3.2, 7.8],
                        [1, 0, 0],
                        [0, 1, 0],
                    ],
                },
            ]);

            expect(vertices[POSITION_OFFSET]).toBeCloseTo(10.5);
            expect(vertices[POSITION_OFFSET + 1]).toBeCloseTo(-3.2);
            expect(vertices[POSITION_OFFSET + 2]).toBeCloseTo(7.8);
        });

        test('Should derive a normal when the face declares none', () => {
            const vertices = flatten(TRIANGLE);

            expect(vertices[NORMAL_OFFSET]).toBeCloseTo(0);
            expect(vertices[NORMAL_OFFSET + 1]).toBeCloseTo(0);
            expect(vertices[NORMAL_OFFSET + 2]).toBeCloseTo(1);
        });

        test('Should give every vertex the declared face normal', () => {
            const vertices = flatten([
                {
                    ...TRIANGLE[0],
                    normal: [0, 0, -1],
                },
            ]);

            for (let index = 0; index < 3; index++) {
                const base = index * VERTEX_FLOATS + NORMAL_OFFSET;

                expect(vertices[base]).toBe(0);
                expect(vertices[base + 1]).toBe(0);
                expect(vertices[base + 2]).toBe(-1);
            }
        });

        // A collapsed face has no facing, and the CPU painter resolves the same fallback.
        test('Should fall back to the up vector for a degenerate face', () => {
            const vertices = flatten([
                {
                    vertices: [
                        [0, 0, 0],
                        [1, 0, 0],
                        [2, 0, 0],
                    ],
                },
            ]);

            expect(vertices[NORMAL_OFFSET]).toBe(0);
            expect(vertices[NORMAL_OFFSET + 1]).toBe(1);
            expect(vertices[NORMAL_OFFSET + 2]).toBe(0);
        });

        test('Should interpolate per-vertex normals when the material shades smoothly', () => {
            const vertices = flatten([
                {
                    ...TRIANGLE[0],
                    normals: [
                        [1, 0, 0],
                        [0, 1, 0],
                        [0, 0, 1],
                    ],
                },
            ]);

            expect(vertices[NORMAL_OFFSET]).toBe(1);
            expect(vertices[VERTEX_FLOATS + NORMAL_OFFSET + 1]).toBe(1);
            expect(vertices[VERTEX_FLOATS * 2 + NORMAL_OFFSET + 2]).toBe(1);
        });

        test('Should ignore per-vertex normals when the material shades flat', () => {
            const vertices = flatten([
                {
                    ...TRIANGLE[0],
                    normals: [
                        [1, 0, 0],
                        [0, 1, 0],
                        [0, 0, 1],
                    ],
                },
            ], {
                flatShading: true,
            });

            expect(vertices[NORMAL_OFFSET + 2]).toBeCloseTo(1);
        });

        test('Should normalize colour channels to the unit range', () => {
            const vertices = flatten(TRIANGLE, {
                color: 'rgba(51, 102, 204, 0.8)',
            });

            expect(vertices[COLOR_OFFSET]).toBeCloseTo(51 / 255);
            expect(vertices[COLOR_OFFSET + 1]).toBeCloseTo(102 / 255);
            expect(vertices[COLOR_OFFSET + 2]).toBeCloseTo(204 / 255);
            expect(vertices[COLOR_OFFSET + 3]).toBeCloseTo(0.8);
        });

        test('Should write per-vertex colours when the material enables them', () => {
            const vertices = flatten([
                {
                    ...TRIANGLE[0],
                    colors: ['#ff0000', '#00ff00', '#0000ff'],
                },
            ], {
                vertexColors: true,
            });

            expect(vertices[COLOR_OFFSET]).toBe(1);
            expect(vertices[VERTEX_FLOATS + COLOR_OFFSET + 1]).toBe(1);
            expect(vertices[VERTEX_FLOATS * 2 + COLOR_OFFSET + 2]).toBe(1);
        });

        test('Should ignore per-vertex colours when the material does not enable them', () => {
            const vertices = flatten([
                {
                    ...TRIANGLE[0],
                    colors: ['#ff0000', '#00ff00', '#0000ff'],
                },
            ], {
                color: '#000000',
            });

            expect(vertices[COLOR_OFFSET]).toBe(0);
        });

        test('Should write UVs when the face carries them', () => {
            const vertices = flatten([
                {
                    ...TRIANGLE[0],
                    uvs: [
                        [0, 0],
                        [1, 0],
                        [0, 1],
                    ],
                },
            ], {
                map: createTexture(document.createElement('canvas')),
            });

            expect(vertices[UV_OFFSET]).toBe(0);
            expect(vertices[VERTEX_FLOATS + UV_OFFSET]).toBe(1);
            expect(vertices[VERTEX_FLOATS * 2 + UV_OFFSET + 1]).toBe(1);
        });

        test('Should zero the UVs of a face that carries none', () => {
            const vertices = flatten(TRIANGLE);

            expect(vertices[UV_OFFSET]).toBe(0);
            expect(vertices[UV_OFFSET + 1]).toBe(0);
        });

        test('Should accumulate across multiple faces', () => {
            const vertices = flatten([
                TRIANGLE[0],
                {
                    vertices: [
                        [2, 0, 0],
                        [3, 0, 0],
                        [3, 1, 0],
                        [2, 1, 0],
                    ],
                },
            ]);

            expect(vertices).toHaveLength(7 * VERTEX_FLOATS);
        });

        test('Should produce an empty buffer for no faces', () => {
            const vertices = flatten([]);

            expect(vertices).toHaveLength(0);
            expect(vertices).toBeInstanceOf(Float32Array);
        });

    });

    describe('triangulateFacesIndices', () => {

        test('Should emit one triangle for a triangular face', () => {
            expect(Array.from(triangulateFacesIndices(TRIANGLE))).toEqual([0, 1, 2]);
        });

        test('Should fan-triangulate a quad into two triangles', () => {
            const indices = triangulateFacesIndices([
                {
                    vertices: [
                        [0, 0, 0],
                        [1, 0, 0],
                        [1, 1, 0],
                        [0, 1, 0],
                    ],
                },
            ]);

            expect(Array.from(indices)).toEqual([0, 1, 2, 0, 2, 3]);
        });

        test('Should offset each face by the vertices before it', () => {
            const indices = triangulateFacesIndices([
                TRIANGLE[0],
                {
                    vertices: [
                        [2, 0, 0],
                        [3, 0, 0],
                        [2, 1, 0],
                    ],
                },
            ]);

            expect(Array.from(indices)).toEqual([0, 1, 2, 3, 4, 5]);
        });

        test('Should produce an empty buffer for no faces', () => {
            const indices = triangulateFacesIndices([]);

            expect(indices).toHaveLength(0);
            expect(indices).toBeInstanceOf(Uint32Array);
        });

    });

});
