import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    mat4Identity,
    mat4LookAt,
    mat4Multiply,
    mat4Perspective,
    projectDepth,
    projectPoint,
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

    test('projectDepth: nearer points have smaller depth', () => {
        const nearDepth = projectDepth([0, 0, 2], viewProj);
        const farDepth = projectDepth([0, 0, -5], viewProj);

        expect(nearDepth).toBeLessThan(farDepth);
    });

    test('projectPoint with identity matrices maps to viewport center', () => {
        const identity = mat4Identity();
        const [px, py] = projectPoint([0, 0, 0], identity, viewport);

        expect(px).toBeCloseTo(400);
        expect(py).toBeCloseTo(300);
    });

});
