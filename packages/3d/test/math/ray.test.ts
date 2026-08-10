import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    createRay,
    rayAt,
    rayHitBarycentric,
    rayIntersectTriangle,
    vec3Length,
} from '../../src';

import type {
    Vector3,
} from '../../src';

describe('Ray', () => {

    const triA: Vector3 = [0, 0, 0];
    const triB: Vector3 = [2, 0, 0];
    const triC: Vector3 = [0, 2, 0];

    test('Should normalize the direction it is created with', () => {
        const ray = createRay([0, 0, 0], [0, 0, -4]);

        expect(vec3Length(ray.direction)).toBeCloseTo(1, 12);
        expect(ray.direction).toEqual([0, 0, -1]);
    });

    test('Should walk along its direction', () => {
        const ray = createRay([1, 2, 3], [0, 1, 0]);

        expect(rayAt(ray, 4)).toEqual([1, 6, 3]);
    });

    describe('rayIntersectTriangle', () => {

        test('Should report the distance to a triangle it hits', () => {
            const ray = createRay([0.5, 0.5, 5], [0, 0, -1]);
            const hit = rayIntersectTriangle(ray, triA, triB, triC)!;

            expect(hit).not.toBeNull();
            expect(hit.distance).toBeCloseTo(5, 12);
            expect(hit.weightB).toBeCloseTo(0.25, 12);
            expect(hit.weightC).toBeCloseTo(0.25, 12);
        });

        test('Should miss a point outside the triangle', () => {
            const ray = createRay([3, 3, 5], [0, 0, -1]);

            expect(rayIntersectTriangle(ray, triA, triB, triC)).toBeNull();
        });

        test('Should miss a triangle behind the origin', () => {
            const ray = createRay([0.5, 0.5, 5], [0, 0, 1]);

            expect(rayIntersectTriangle(ray, triA, triB, triC)).toBeNull();
        });

        test('Should miss a triangle it runs parallel to', () => {
            const ray = createRay([0.5, 0.5, 0], [1, 0, 0]);

            expect(rayIntersectTriangle(ray, triA, triB, triC)).toBeNull();
        });

        test('Should report a hit from behind as back facing', () => {
            const front = rayIntersectTriangle(createRay([0.5, 0.5, 5], [0, 0, -1]), triA, triB, triC)!;
            const back = rayIntersectTriangle(createRay([0.5, 0.5, -5], [0, 0, 1]), triA, triB, triC)!;

            expect(front.backFacing).toBe(false);
            expect(back.backFacing).toBe(true);
        });

        test('Should report barycentrics that reconstruct the hit point', () => {
            const ray = createRay([0.3, 1.1, 4], [0, 0, -1]);
            const hit = rayIntersectTriangle(ray, triA, triB, triC)!;
            const point = rayAt(ray, hit.distance);
            const reconstructed = rayHitBarycentric(hit, triA, triB, triC);

            expect(reconstructed[0]).toBeCloseTo(point[0], 9);
            expect(reconstructed[1]).toBeCloseTo(point[1], 9);
            expect(reconstructed[2]).toBeCloseTo(point[2], 9);
        });

        test('Should interpolate a two-component attribute across the triangle', () => {
            const hit = rayIntersectTriangle(createRay([0.5, 0.5, 5], [0, 0, -1]), triA, triB, triC)!;
            const uv = rayHitBarycentric<[number, number]>(hit, [0, 0], [1, 0], [0, 1]);

            expect(uv[0]).toBeCloseTo(0.25, 12);
            expect(uv[1]).toBeCloseTo(0.25, 12);
        });

    });

});
