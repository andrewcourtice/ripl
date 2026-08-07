import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    createRevolution,
    createTube,
    TEAPOT_PART_LABELS,
    TEAPOT_PARTS,
    TEAPOT_SURFACES,
} from './teapot';

import {
    tessellateParametric,
    vec3Length,
} from '@ripl/3d';

import type {
    Vector3,
} from '@ripl/3d';

const entries = TEAPOT_PARTS.map(part => [part, TEAPOT_SURFACES[part]] as const);

function sampleGrid(surface: (u: number, v: number) => Vector3, steps = 12): Vector3[] {
    const points: Vector3[] = [];

    for (let iu = 0; iu <= steps; iu++) {
        for (let iv = 0; iv <= steps; iv++) {
            points.push(surface(iu / steps, iv / steps));
        }
    }

    return points;
}

describe('Teapot geometry', () => {

    test.each(entries)('%s produces only finite points', (_part, surface) => {
        expect(sampleGrid(surface).every(point => point.every(Number.isFinite))).toBe(true);
    });

    test.each(entries)('%s stays within a sane world box', (_part, surface) => {
        expect(sampleGrid(surface).every(point => point.every(component => Math.abs(component) < 4))).toBe(true);
    });

    test.each(entries)('%s tessellates into quads with normals and UVs', (_part, surface) => {
        const faces = tessellateParametric(surface, 8, 8);

        expect(faces).toHaveLength(64);
        expect(faces.every(face => face.vertices.length === 4)).toBe(true);
        expect(faces.every(face => face.normals?.length === 4)).toBe(true);
        expect(faces.every(face => face.uvs?.length === 4)).toBe(true);
    });

    test.each(entries)('%s emits unit-length normals', (_part, surface) => {
        const normals = tessellateParametric(surface, 8, 8).flatMap(face => face.normals ?? []);

        expect(normals.every(normal => Math.abs(vec3Length(normal) - 1) < 1e-5)).toBe(true);
    });

    test('Every part has a label', () => {
        expect(TEAPOT_PARTS.every(part => !!TEAPOT_PART_LABELS[part])).toBe(true);
    });

    describe('createRevolution', () => {

        const surface = createRevolution([
            [[1, 0], [1, 0], [1, 1], [1, 1]],
        ]);

        test('Should close the ring exactly', () => {
            const start = surface(0, 0.5);
            const end = surface(1, 0.5);

            expect(end[0]).toBeCloseTo(start[0], 12);
            expect(end[2]).toBeCloseTo(start[2], 12);
        });

        test('Should place every point at the profile radius from the axis', () => {
            for (const [u, v] of [[0, 0.5], [0.25, 0.2], [0.6, 0.9]]) {
                const [px, , pz] = surface(u, v);

                expect(Math.sqrt(px * px + pz * pz)).toBeCloseTo(1, 12);
            }
        });

        test('Should run the profile up the Y axis', () => {
            expect(surface(0, 0)[1]).toBeCloseTo(0, 12);
            expect(surface(0, 1)[1]).toBeCloseTo(1, 12);
        });

    });

    describe('createTube', () => {

        const surface = createTube([
            [0, 0, 0],
            [1, 0, 0],
            [2, 0, 0],
            [3, 0, 0],
        ], [0.5, 0.5]);

        test('Should keep every point at the tube radius from the centre line', () => {
            for (const [u, v] of [[0.2, 0], [0.5, 0.3], [0.8, 0.7]]) {
                const point = surface(u, v);
                const centreX = point[0];
                const offset = Math.sqrt(point[1] * point[1] + point[2] * point[2]);

                expect(offset).toBeCloseTo(0.5, 6);
                expect(centreX).toBeGreaterThanOrEqual(0);
            }
        });

        test('Should close the tube exactly', () => {
            const start = surface(0.5, 0);
            const end = surface(0.5, 1);

            expect(end[1]).toBeCloseTo(start[1], 10);
            expect(end[2]).toBeCloseTo(start[2], 10);
        });

        test('Should taper between its two radii', () => {
            const tapered = createTube([
                [0, 0, 0],
                [1, 0, 0],
                [2, 0, 0],
                [3, 0, 0],
            ], [1, 0.2]);

            const near = tapered(0, 0);
            const far = tapered(1, 0);

            expect(Math.hypot(near[1], near[2])).toBeCloseTo(1, 6);
            expect(Math.hypot(far[1], far[2])).toBeCloseTo(0.2, 6);
        });

    });

    // The parts are modelled to meet: a lid floating above the rim or a spout detached from the
    // body reads as broken geometry rather than a teapot.
    test('The lid sits on the body rim', () => {
        const rim = TEAPOT_SURFACES.body(0, 1);
        const lip = TEAPOT_SURFACES.lid(0, 0);

        expect(Math.abs(rim[1] - lip[1])).toBeLessThan(0.05);
    });

    test('The knob sits on the lid', () => {
        const lidTop = TEAPOT_SURFACES.lid(0, 1);
        const knobBase = TEAPOT_SURFACES.knob(0, 0);

        expect(Math.abs(lidTop[1] - knobBase[1])).toBeLessThan(0.05);
    });

    test('The spout and handle reach opposite sides of the body', () => {
        expect(TEAPOT_SURFACES.spout(1, 0)[0]).toBeGreaterThan(1);
        expect(TEAPOT_SURFACES.handle(0.5, 0)[0]).toBeLessThan(-1);
    });

});
