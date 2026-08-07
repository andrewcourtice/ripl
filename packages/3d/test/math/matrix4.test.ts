import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    mat4Compose,
    mat4Identity,
    mat4Invert,
    mat4LookAt,
    mat4Multiply,
    mat4NormalMatrix,
    mat4Orthographic,
    mat4Perspective,
    mat4RotateX,
    mat4RotateY,
    mat4RotateZ,
    mat4Scale,
    mat4TransformDirection,
    mat4TransformPoint,
    mat4Translate,
    mat4Transpose,
    vec3Cross,
    vec3Dot,
    vec3Normalize,
    vec3Sub,
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

    // 3D-17: `up` parallel to the view direction gave `xAxis = [0, 0, 0]` and a rank-deficient view
    // matrix, so every point in the scene projected to the same place.
    test('Should build a usable view matrix when up is parallel to the view direction', () => {
        const view = mat4LookAt([0, 5, 0], [0, 0, 0], [0, 1, 0]);

        const origin = mat4TransformPoint(view, [0, 0, 0]);
        const offset = mat4TransformPoint(view, [1, 0, 0]);

        expect(origin[2]).toBeCloseTo(-5);
        expect(offset).not.toEqual(origin);
    });

    test('Should return the identity when the eye sits on the target', () => {
        expect(Array.from(mat4LookAt([2, 2, 2], [2, 2, 2], [0, 1, 0]))).toEqual(Array.from(mat4Identity()));
    });

    test('mat4Perspective produces valid projection', () => {
        const proj = mat4Perspective(Math.PI / 3, 1, 0.1, 100);

        // Should not be identity
        expect(proj[0]).not.toBe(0);
        expect(proj[5]).not.toBe(0);
        expect(proj[11]).toBe(-1);
    });

    // WGPU-1: `proj[11] === -1` holds under both the GL and the WebGPU depth conventions, which is
    // exactly why a GL matrix rendered against WebGPU's [0, 1] clip volume went unnoticed. Pin the
    // plane mapping instead of the matrix shape.
    test('Should map the perspective near plane to a depth of 0', () => {
        const proj = mat4Perspective(Math.PI / 3, 1, 0.1, 1000);

        expect(mat4TransformPoint(proj, [0, 0, -0.1])[2]).toBeCloseTo(0, 6);
    });

    test('Should map the perspective far plane to a depth of 1', () => {
        const proj = mat4Perspective(Math.PI / 3, 1, 0.1, 1000);

        expect(mat4TransformPoint(proj, [0, 0, -1000])[2]).toBeCloseTo(1, 6);
    });

    test('Should keep perspective depth monotonic and inside [0, 1] across the frustum', () => {
        const proj = mat4Perspective(Math.PI / 3, 1, 0.1, 1000);
        const depths = [0.1, 0.15, 0.2, 1, 5, 100, 1000].map(distance => mat4TransformPoint(proj, [0, 0, -distance])[2]);

        for (const depth of depths) {
            expect(depth).toBeGreaterThanOrEqual(0);
            expect(depth).toBeLessThanOrEqual(1);
        }

        for (let idx = 1; idx < depths.length; idx++) {
            expect(depths[idx]).toBeGreaterThan(depths[idx - 1]);
        }
    });

    test('mat4Orthographic produces valid projection', () => {
        const proj = mat4Orthographic(-1, 1, -1, 1, 0.1, 100);

        expect(proj[0]).not.toBe(0);
        expect(proj[5]).not.toBe(0);
        expect(proj[15]).toBe(1);
    });

    test('Should map the orthographic near plane to a depth of 0', () => {
        const proj = mat4Orthographic(-1, 1, -1, 1, 0.1, 100);

        expect(mat4TransformPoint(proj, [0, 0, -0.1])[2]).toBeCloseTo(0, 6);
    });

    test('Should map the orthographic far plane to a depth of 1', () => {
        const proj = mat4Orthographic(-1, 1, -1, 1, 0.1, 100);

        expect(mat4TransformPoint(proj, [0, 0, -100])[2]).toBeCloseTo(1, 6);
    });

    test('Should map orthographic depth linearly through the frustum', () => {
        const proj = mat4Orthographic(-1, 1, -1, 1, 0, 100);

        expect(mat4TransformPoint(proj, [0, 0, -50])[2]).toBeCloseTo(0.5, 6);
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

    describe('mat4Invert', () => {

        const cases: [label: string, matrix: () => ReturnType<typeof mat4Identity>][] = [
            ['identity', () => mat4Identity()],
            ['translation', () => mat4Translate(mat4Identity(), [3, -4, 5])],
            ['rotation', () => mat4RotateY(mat4RotateX(mat4Identity(), 0.7), -1.3)],
            ['non-uniform scale', () => mat4Scale(mat4Identity(), [2, 0.5, 4])],
            ['composed TRS', () => mat4Compose([1, 2, 3], [0.3, -0.9, 1.1], [2, 0.25, 3])],
            ['perspective', () => mat4Perspective(Math.PI / 3, 1.5, 0.1, 100)],
        ];

        test.each(cases)('round-trips a %s matrix to the identity', (_label, build) => {
            const matrix = build();
            const inverse = mat4Invert(matrix)!;

            expect(inverse).not.toBeNull();

            const product = mat4Multiply(matrix, inverse);
            const identity = mat4Identity();

            for (let idx = 0; idx < 16; idx++) {
                expect(product[idx]).toBeCloseTo(identity[idx], 10);
            }
        });

        test('returns null for a singular matrix', () => {
            expect(mat4Invert(mat4Scale(mat4Identity(), [1, 0, 1]))).toBeNull();
        });

    });

    test('mat4Transpose swaps rows and columns', () => {
        const matrix = mat4Compose([1, 2, 3], [0.4, 0.5, 0.6], [2, 3, 4]);
        const transposed = mat4Transpose(matrix);

        for (let col = 0; col < 4; col++) {
            for (let row = 0; row < 4; row++) {
                expect(transposed[col * 4 + row]).toBe(matrix[row * 4 + col]);
            }
        }
    });

    test('mat4Transpose is its own inverse', () => {
        const matrix = mat4Compose([5, 6, 7], [1, 2, 3], [1, 2, 3]);
        const roundTripped = mat4Transpose(mat4Transpose(matrix));

        for (let idx = 0; idx < 16; idx++) {
            expect(roundTripped[idx]).toBe(matrix[idx]);
        }
    });

    // Transforming a normal by the model matrix is only correct under uniform scale; this pins the
    // non-uniform case, where the naive transform shears the normal off the surface.
    test('mat4NormalMatrix keeps a normal perpendicular under non-uniform scale', () => {
        const model = mat4Scale(mat4RotateY(mat4Identity(), 0.6), [3, 0.2, 1.5]);
        const normalMatrix = mat4NormalMatrix(model);

        // Slanted rather than axis-aligned: a normal that lies along a scale axis survives the
        // naive transform intact, so an axis-aligned surface cannot tell the two apart.
        const origin: Vector3 = [0, 0, 0];
        const alongU: Vector3 = [1, 1, 0];
        const alongV: Vector3 = [0, 0, 1];
        const normal = vec3Normalize(vec3Cross(alongU, alongV));

        const worldOrigin = mat4TransformPoint(model, origin);
        const edgeU = vec3Normalize(vec3Sub(mat4TransformPoint(model, alongU), worldOrigin));
        const edgeV = vec3Normalize(vec3Sub(mat4TransformPoint(model, alongV), worldOrigin));
        const worldNormal = vec3Normalize(mat4TransformDirection(normalMatrix, normal));

        expect(vec3Dot(worldNormal, edgeU)).toBeCloseTo(0, 10);
        expect(vec3Dot(worldNormal, edgeV)).toBeCloseTo(0, 10);

        const naive = vec3Normalize(mat4TransformDirection(model, normal));

        expect(Math.abs(vec3Dot(naive, edgeU))).toBeGreaterThan(0.1);
    });

    test('mat4NormalMatrix falls back to the identity for a singular model', () => {
        const normalMatrix = mat4NormalMatrix(mat4Scale(mat4Identity(), [0, 1, 1]));

        expect(Array.from(normalMatrix)).toEqual(Array.from(mat4Identity()));
    });

    test('mat4Compose matches translate then rotate then scale', () => {
        const composed = mat4Compose([1, 2, 3], [0.2, 0.4, 0.6], [2, 3, 4]);

        let expected = mat4Translate(mat4Identity(), [1, 2, 3]);
        expected = mat4RotateX(expected, 0.2);
        expected = mat4RotateY(expected, 0.4);
        expected = mat4RotateZ(expected, 0.6);
        expected = mat4Scale(expected, [2, 3, 4]);

        for (let idx = 0; idx < 16; idx++) {
            expect(composed[idx]).toBeCloseTo(expected[idx], 12);
        }
    });

});
