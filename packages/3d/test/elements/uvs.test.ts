import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    createCone,
    createCube,
    createCylinder,
    createPlane,
    createSphere,
    createTorus,
} from '../../src';

import type {
    Face3D,
} from '../../src';

/** Reaches the protected `computeFaces` method the way the other element tests do. */
function computeFaces(element: unknown): Face3D[] {
    return (element as { computeFaces(): Face3D[] }).computeFaces();
}

const primitives = {
    cube: () => createCube({
        size: 1,
    }),
    sphere: () => createSphere({
        radius: 1,
    }),
    cylinder: () => createCylinder({
        radiusTop: 1,
        radiusBottom: 1,
        height: 2,
    }),
    cone: () => createCone({
        radius: 1,
        height: 2,
    }),
    plane: () => createPlane({
        width: 2,
        height: 2,
    }),
    torus: () => createTorus({
        radius: 2,
        tube: 0.5,
    }),
};

const entries = Object.entries(primitives);

describe('Primitive texture coordinates', () => {

    test.each(entries)('%s gives every face one UV per vertex', (_name, create) => {
        const faces = computeFaces(create());

        expect(faces.length).toBeGreaterThan(0);
        expect(faces.every(face => face.uvs?.length === face.vertices.length)).toBe(true);
    });

    // A coordinate outside the unit range would wrap or clamp unpredictably against an asset
    // authored for the conventional range.
    test.each(entries)('%s keeps every UV inside the unit range', (_name, create) => {
        const uvs = computeFaces(create()).flatMap(face => face.uvs ?? []);

        expect(uvs.every(([tu, tv]) => tu >= 0 && tu <= 1 && tv >= 0 && tv <= 1)).toBe(true);
    });

    test.each(entries)('%s emits only finite UVs', (_name, create) => {
        const uvs = computeFaces(create()).flatMap(face => face.uvs ?? []);

        expect(uvs.every(([tu, tv]) => Number.isFinite(tu) && Number.isFinite(tv))).toBe(true);
    });

    test.each(entries)('%s spans the whole texture rather than a corner of it', (_name, create) => {
        const uvs = computeFaces(create()).flatMap(face => face.uvs ?? []);
        const maxU = Math.max(...uvs.map(([tu]) => tu));
        const maxV = Math.max(...uvs.map(([, tv]) => tv));

        expect(maxU).toBeCloseTo(1, 6);
        expect(maxV).toBeCloseTo(1, 6);
    });

    test('A cube maps the whole texture onto each of its six faces', () => {
        const faces = computeFaces(createCube({
            size: 1,
        }));

        expect(faces).toHaveLength(6);

        for (const face of faces) {
            expect(face.uvs).toEqual([
                [0, 1],
                [1, 1],
                [1, 0],
                [0, 0],
            ]);
        }
    });

    test('A sphere wraps its horizontal coordinate once around the equator', () => {
        const faces = computeFaces(createSphere({
            radius: 1,
            segments: 8,
            rings: 6,
        }));
        const uvs = faces.flatMap(face => face.uvs ?? []);

        expect(Math.min(...uvs.map(([tu]) => tu))).toBeCloseTo(0, 6);
        expect(Math.max(...uvs.map(([tu]) => tu))).toBeCloseTo(1, 6);
    });

    test('A sphere puts its north pole at the top of the texture', () => {
        const faces = computeFaces(createSphere({
            radius: 1,
            segments: 8,
            rings: 6,
        }));
        const northPole = faces[0];

        expect(northPole.uvs?.[0][1]).toBeCloseTo(1, 6);
    });

    test('A cylinder maps each cap as a disc inscribed in the texture', () => {
        const faces = computeFaces(createCylinder({
            radiusTop: 1,
            radiusBottom: 1,
            height: 2,
            segments: 8,
        }));
        const cap = faces.find(face => face.normal?.[1] === 1)!;

        expect(cap.uvs?.[0]).toEqual([0.5, 0.5]);
    });

});
