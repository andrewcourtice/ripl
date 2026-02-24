import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    mat4Identity,
    mat4LookAt,
    mat4Multiply,
    mat4Orthographic,
    mat4Perspective,
    mat4RotateX,
    mat4RotateY,
    mat4RotateZ,
    mat4Scale,
    mat4TransformPoint,
    mat4Translate,
} from '../../src';

import type {
    Vector3,
} from '../../src';

describe('Matrix4', () => {

    test('mat4Identity creates identity matrix', () => {
        const id = mat4Identity();
        expect(id[0]).toBe(1);
        expect(id[5]).toBe(1);
        expect(id[10]).toBe(1);
        expect(id[15]).toBe(1);
        expect(id[1]).toBe(0);
        expect(id[4]).toBe(0);
    });

    test('mat4Multiply with identity is no-op', () => {
        const id = mat4Identity();
        const translated = mat4Translate(id, [1, 2, 3]);
        const result = mat4Multiply(translated, id);

        for (let idx = 0; idx < 16; idx++) {
            expect(result[idx]).toBeCloseTo(translated[idx]);
        }
    });

    test('mat4Translate moves origin to expected point', () => {
        const matrix = mat4Translate(mat4Identity(), [10, 20, 30]);
        const point = mat4TransformPoint(matrix, [0, 0, 0]);

        expect(point[0]).toBeCloseTo(10);
        expect(point[1]).toBeCloseTo(20);
        expect(point[2]).toBeCloseTo(30);
    });

    test('mat4Scale scales point components', () => {
        const matrix = mat4Scale(mat4Identity(), [2, 3, 4]);
        const point = mat4TransformPoint(matrix, [1, 1, 1]);

        expect(point[0]).toBeCloseTo(2);
        expect(point[1]).toBeCloseTo(3);
        expect(point[2]).toBeCloseTo(4);
    });

    test('mat4RotateX rotates 90 degrees', () => {
        const matrix = mat4RotateX(mat4Identity(), Math.PI / 2);
        const point = mat4TransformPoint(matrix, [0, 1, 0]);

        expect(point[0]).toBeCloseTo(0);
        expect(point[1]).toBeCloseTo(0);
        expect(point[2]).toBeCloseTo(1);
    });

    test('mat4RotateY rotates 90 degrees', () => {
        const matrix = mat4RotateY(mat4Identity(), Math.PI / 2);
        const point = mat4TransformPoint(matrix, [1, 0, 0]);

        expect(point[0]).toBeCloseTo(0);
        expect(point[1]).toBeCloseTo(0);
        expect(point[2]).toBeCloseTo(-1);
    });

    test('mat4RotateZ rotates 90 degrees', () => {
        const matrix = mat4RotateZ(mat4Identity(), Math.PI / 2);
        const point = mat4TransformPoint(matrix, [1, 0, 0]);

        expect(point[0]).toBeCloseTo(0);
        expect(point[1]).toBeCloseTo(1);
        expect(point[2]).toBeCloseTo(0);
    });

    test('mat4LookAt produces expected view matrix', () => {
        const eye: Vector3 = [0, 0, 5];
        const target: Vector3 = [0, 0, 0];
        const up: Vector3 = [0, 1, 0];
        const view = mat4LookAt(eye, target, up);

        // Origin should map to (0, 0, -5) in view space
        const result = mat4TransformPoint(view, [0, 0, 0]);
        expect(result[0]).toBeCloseTo(0);
        expect(result[1]).toBeCloseTo(0);
        expect(result[2]).toBeCloseTo(-5);
    });

    test('mat4Perspective produces valid projection', () => {
        const proj = mat4Perspective(Math.PI / 3, 1, 0.1, 100);

        // Should not be identity
        expect(proj[0]).not.toBe(0);
        expect(proj[5]).not.toBe(0);
        expect(proj[11]).toBe(-1);
    });

    test('mat4Orthographic produces valid projection', () => {
        const proj = mat4Orthographic(-1, 1, -1, 1, 0.1, 100);

        expect(proj[0]).not.toBe(0);
        expect(proj[5]).not.toBe(0);
        expect(proj[15]).toBe(1);
    });

    test('mat4TransformPoint with combined transform', () => {
        let matrix = mat4Identity();
        matrix = mat4Translate(matrix, [5, 0, 0]);
        matrix = mat4Scale(matrix, [2, 2, 2]);

        const point = mat4TransformPoint(matrix, [1, 0, 0]);
        expect(point[0]).toBeCloseTo(7);
        expect(point[1]).toBeCloseTo(0);
        expect(point[2]).toBeCloseTo(0);
    });

    test('mat4Multiply is associative', () => {
        const ma = mat4Translate(mat4Identity(), [1, 0, 0]);
        const mb = mat4RotateZ(mat4Identity(), Math.PI / 4);
        const mc = mat4Scale(mat4Identity(), [2, 2, 2]);

        const abThenC = mat4Multiply(mat4Multiply(ma, mb), mc);
        const aThenBc = mat4Multiply(ma, mat4Multiply(mb, mc));

        for (let idx = 0; idx < 16; idx++) {
            expect(abThenC[idx]).toBeCloseTo(aThenBc[idx], 10);
        }
    });

});
