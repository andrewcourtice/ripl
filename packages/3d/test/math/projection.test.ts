import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    mat4Identity,
    mat4Invert,
    mat4LookAt,
    mat4Multiply,
    mat4Orthographic,
    mat4Perspective,
    projectPoint,
    rayAt,
    rayFromScreen,
    unprojectPoint,
    vec3Length,
    vec3Sub,
} from '../../src';

import type {
    Vector3,
} from '../../src';

describe('Projection', () => {

    const eye: Vector3 = [0, 0, 5];
    const target: Vector3 = [0, 0, 0];
    const up: Vector3 = [0, 1, 0];
    const view = mat4LookAt(eye, target, up);
    const proj = mat4Perspective(Math.PI / 3, 1, 0.1, 100);
    const viewProj = mat4Multiply(proj, view);
    const viewport = {
        width: 800,
        height: 600,
    };

    test('projectPoint maps origin near center of viewport', () => {
        const [px, py] = projectPoint([0, 0, 0], viewProj, viewport);

        expect(px).toBeCloseTo(400, 0);
        expect(py).toBeCloseTo(300, 0);
    });

    test('projectPoint maps off-center points correctly', () => {
        const [leftX] = projectPoint([-1, 0, 0], viewProj, viewport);
        const [rightX] = projectPoint([1, 0, 0], viewProj, viewport);

        expect(leftX).toBeLessThan(400);
        expect(rightX).toBeGreaterThan(400);
    });

    test('projectPoint: nearer points have smaller depth', () => {
        const [,, nearDepth] = projectPoint([0, 0, 2], viewProj, viewport);
        const [,, farDepth] = projectPoint([0, 0, -5], viewProj, viewport);

        expect(nearDepth).toBeLessThan(farDepth);
    });

    test('projectPoint with identity matrices maps to viewport center', () => {
        const identity = mat4Identity();
        const [px, py] = projectPoint([0, 0, 0], identity, viewport);

        expect(px).toBeCloseTo(400);
        expect(py).toBeCloseTo(300);
    });


    test('unprojectPoint reverses projectPoint', () => {
        const inverse = mat4Invert(viewProj)!;
        const point: Vector3 = [0.4, -1.2, 0.9];
        const [px, py, depth] = projectPoint(point, viewProj, viewport);
        const recovered = unprojectPoint(px, py, depth, inverse, viewport);

        expect(recovered[0]).toBeCloseTo(point[0], 9);
        expect(recovered[1]).toBeCloseTo(point[1], 9);
        expect(recovered[2]).toBeCloseTo(point[2], 9);
    });

    describe('rayFromScreen', () => {

        test('passes through the point that projected to the pixel', () => {
            const point: Vector3 = [0.7, 0.3, -1.5];
            const [px, py] = projectPoint(point, viewProj, viewport);
            const ray = rayFromScreen(px, py, viewProj, viewport)!;

            expect(ray).not.toBeNull();

            const toPoint = vec3Sub(point, ray.origin);
            const along = rayAt(ray, vec3Length(toPoint));

            expect(along[0]).toBeCloseTo(point[0], 6);
            expect(along[1]).toBeCloseTo(point[1], 6);
            expect(along[2]).toBeCloseTo(point[2], 6);
        });

        test('produces parallel rays under an orthographic projection', () => {
            const ortho = mat4Multiply(mat4Orthographic(-2, 2, -2, 2, 0.1, 100), view);
            const left = rayFromScreen(100, 300, ortho, viewport)!;
            const right = rayFromScreen(700, 300, ortho, viewport)!;

            expect(left.direction[0]).toBeCloseTo(right.direction[0], 9);
            expect(left.direction[1]).toBeCloseTo(right.direction[1], 9);
            expect(left.direction[2]).toBeCloseTo(right.direction[2], 9);
            expect(left.origin[0]).not.toBeCloseTo(right.origin[0], 3);
        });

        test('returns null for a singular view projection', () => {
            expect(rayFromScreen(0, 0, new Float64Array(16), viewport)).toBeNull();
        });

    });

});
