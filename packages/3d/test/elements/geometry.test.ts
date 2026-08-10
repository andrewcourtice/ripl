import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    bernstein3,
    createBezierSurface,
    createMesh,
    createParametric,
    createSphere,
    elementIsBezierSurface,
    elementIsMesh,
    elementIsParametric,
    evaluateBezierPatch,
    parametricNormal,
    tessellateParametric,
    vec3Length,
} from '../../src';

import type {
    BezierPatch,
    Face3D,
    Vector3,
} from '../../src';

/** Reaches the protected `computeFaces` method the way the other element tests do. */
function computeFaces(element: unknown): Face3D[] {
    return (element as { computeFaces(): Face3D[] }).computeFaces();
}

/** A flat patch in the XZ plane, whose control points are a 4×4 grid at y = 0. */
function createFlatPatch(): BezierPatch {
    const points: Vector3[] = [];

    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            points.push([col / 3, 0, row / 3]);
        }
    }

    return points as BezierPatch;
}

describe('Mesh', () => {

    const faces: Face3D[] = [
        {
            vertices: [
                [0, 0, 0],
                [1, 0, 0],
                [0, 1, 0],
            ],
        },
    ];

    test('Should emit the faces it was given', () => {
        expect(computeFaces(createMesh({ faces }))).toEqual(faces);
    });

    test('Should emit nothing when given no faces', () => {
        expect(computeFaces(createMesh())).toEqual([]);
    });

    test('Should rebuild after its faces are replaced', () => {
        const mesh = createMesh({ faces });

        expect(computeFaces(mesh)).toHaveLength(1);

        mesh.setFaces([...faces, ...faces]);

        expect(computeFaces(mesh)).toHaveLength(2);
        expect(mesh.revision).toBe(1);
    });

    test('Should identify meshes', () => {
        expect(elementIsMesh(createMesh())).toBe(true);
        expect(elementIsMesh(createSphere({ radius: 1 }))).toBe(false);
    });

});

describe('Parametric', () => {

    const plane = (u: number, v: number): Vector3 => [u * 2 - 1, 0, v * 2 - 1];

    test('Should emit one quad per grid cell', () => {
        expect(tessellateParametric(plane, 4, 3)).toHaveLength(12);
    });

    test('Should give every quad four vertices, normals and UVs', () => {
        const faces = tessellateParametric(plane, 3, 3);

        expect(faces.every(face => face.vertices.length === 4)).toBe(true);
        expect(faces.every(face => face.normals?.length === 4)).toBe(true);
        expect(faces.every(face => face.uvs?.length === 4)).toBe(true);
    });

    test('Should keep every UV inside the unit range', () => {
        const uvs = tessellateParametric(plane, 5, 5).flatMap(face => face.uvs ?? []);

        expect(uvs.every(([cu, cv]) => cu >= 0 && cu <= 1 && cv >= 0 && cv <= 1)).toBe(true);
    });

    test('Should resolve a constant normal for a flat surface', () => {
        const normals = tessellateParametric(plane, 3, 3).flatMap(face => face.normals ?? []);

        expect(normals.every(normal => Math.abs(Math.abs(normal[1]) - 1) < 1e-6)).toBe(true);
    });

    // Derived analytically rather than averaged from adjacent faces, so a smooth surface is smooth
    // from the first frame with no second pass over the mesh.
    test('Should resolve the true normal of a sphere at every point', () => {
        const radius = 2;
        const sphere = (u: number, v: number): Vector3 => {
            const theta = u * Math.PI * 2;
            const phi = v * Math.PI;

            return [
                radius * Math.sin(phi) * Math.cos(theta),
                radius * Math.cos(phi),
                radius * Math.sin(phi) * Math.sin(theta),
            ];
        };

        for (const [u, v] of [[0.25, 0.5], [0.6, 0.3], [0.1, 0.8]]) {
            const point = sphere(u, v);
            const normal = parametricNormal(sphere, u, v);
            const outward = point.map(component => component / radius);
            const alignment = Math.abs(
                normal[0] * outward[0] + normal[1] * outward[1] + normal[2] * outward[2]
            );

            expect(alignment).toBeCloseTo(1, 4);
        }
    });

    test('Should emit unit-length normals', () => {
        const normals = tessellateParametric(
            (u, v) => [u, Math.sin(u * 4) * Math.cos(v * 4), v],
            5,
            5
        ).flatMap(face => face.normals ?? []);

        expect(normals.every(normal => Math.abs(vec3Length(normal) - 1) < 1e-6)).toBe(true);
    });

    test('Should clamp its derivative step to the parameter domain at the edges', () => {
        const calls: number[] = [];

        parametricNormal((u, v) => {
            calls.push(u, v);

            return [u, 0, v];
        }, 0, 1);

        expect(calls.every(value => value >= 0 && value <= 1)).toBe(true);
    });

    test('Should rebuild after its surface is replaced', () => {
        const element = createParametric({
            surface: plane,
            uSegments: 2,
            vSegments: 2,
        });

        expect(computeFaces(element)).toHaveLength(4);

        element.setSurface((u, v) => [u, v, 0]);

        expect(element.revision).toBe(1);
    });

    test('Should rebuild when its segment counts change', () => {
        const element = createParametric({
            surface: plane,
            uSegments: 2,
            vSegments: 2,
        });

        element.uSegments = 4;

        expect(computeFaces(element)).toHaveLength(8);
    });

    test('Should treat a zero segment count as one', () => {
        expect(tessellateParametric(plane, 0, 0)).toHaveLength(1);
    });

    test('Should identify parametric surfaces', () => {
        expect(elementIsParametric(createParametric({ surface: plane }))).toBe(true);
        expect(elementIsParametric(createMesh())).toBe(false);
    });

});

describe('BezierSurface', () => {

    describe('bernstein3', () => {

        test('Should sum to one at every parameter', () => {
            for (const t of [0, 0.25, 0.5, 0.75, 1]) {
                const total = bernstein3(t).reduce((sum, weight) => sum + weight, 0);

                expect(total).toBeCloseTo(1, 12);
            }
        });

        test('Should collapse onto each end control point at the ends', () => {
            expect(bernstein3(0)).toEqual([1, 0, 0, 0]);
            expect(bernstein3(1)).toEqual([0, 0, 0, 1]);
        });

    });

    describe('evaluateBezierPatch', () => {

        const patch = createFlatPatch();

        test('Should interpolate its four corner control points exactly', () => {
            expect(evaluateBezierPatch(patch, 0, 0)).toEqual([0, 0, 0]);
            expect(evaluateBezierPatch(patch, 1, 1)[0]).toBeCloseTo(1, 12);
            expect(evaluateBezierPatch(patch, 1, 1)[2]).toBeCloseTo(1, 12);
        });

        test('Should stay in the plane of a flat patch', () => {
            for (const [u, v] of [[0.2, 0.7], [0.5, 0.5], [0.9, 0.1]]) {
                expect(evaluateBezierPatch(patch, u, v)[1]).toBeCloseTo(0, 12);
            }
        });

    });

    test('Should tessellate every patch at the requested resolution', () => {
        const surface = createBezierSurface({
            patches: [createFlatPatch(), createFlatPatch()],
            segments: 4,
        });

        expect(computeFaces(surface)).toHaveLength(2 * 16);
    });

    test('Should resolve a constant normal across a flat patch', () => {
        const normals = computeFaces(createBezierSurface({
            patches: [createFlatPatch()],
            segments: 4,
        })).flatMap(face => face.normals ?? []);

        expect(normals.every(normal => Math.abs(Math.abs(normal[1]) - 1) < 1e-6)).toBe(true);
    });

    test('Should carry UVs through from the patch parameters', () => {
        const faces = computeFaces(createBezierSurface({
            patches: [createFlatPatch()],
            segments: 2,
        }));

        expect(faces.every(face => face.uvs?.length === 4)).toBe(true);
    });

    test('Should rebuild after its patches are replaced', () => {
        const surface = createBezierSurface({
            patches: [createFlatPatch()],
            segments: 2,
        });

        expect(computeFaces(surface)).toHaveLength(4);

        surface.setPatches([createFlatPatch(), createFlatPatch()]);

        expect(computeFaces(surface)).toHaveLength(8);
        expect(surface.revision).toBe(1);
    });

    test('Should rebuild when its segment count changes', () => {
        const surface = createBezierSurface({
            patches: [createFlatPatch()],
            segments: 2,
        });

        surface.segments = 4;

        expect(computeFaces(surface)).toHaveLength(16);
    });

    test('Should identify bezier surfaces', () => {
        expect(elementIsBezierSurface(createBezierSurface({ patches: [] }))).toBe(true);
        expect(elementIsBezierSurface(createMesh())).toBe(false);
    });

});
