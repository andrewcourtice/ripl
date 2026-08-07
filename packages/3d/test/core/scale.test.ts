import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    createCube,
    mat4NormalMatrix,
    mat4TransformDirection,
    mat4TransformPoint,
    Shape3D,
    vec3Dot,
    vec3Normalize,
    vec3Sub,
} from '../../src';

import type {
    Shape3DState,
    Vector3,
} from '../../src';

/** Reaches the protected `getModelMatrix` the way the element tests reach `computeFaces`. */
function modelMatrix(element: unknown) {
    return (element as { getModelMatrix(): Float64Array }).getModelMatrix();
}

describe('Shape3D scale', () => {

    test('Should default to unit scale on every axis', () => {
        const cube = createCube({
            size: 1,
        });

        expect(cube.scaleX).toBe(1);
        expect(cube.scaleY).toBe(1);
        expect(cube.scaleZ).toBe(1);
        expect(cube.scale).toBe(1);
    });

    test('Should apply a per-axis scale to the model matrix', () => {
        const cube = createCube({
            size: 1,
            scaleX: 2,
            scaleY: 3,
            scaleZ: 4,
        });
        const point = mat4TransformPoint(modelMatrix(cube), [1, 1, 1]);

        expect(point).toEqual([2, 3, 4]);
    });

    test('Should set every axis through the uniform accessor', () => {
        const cube = createCube({
            size: 1,
        });

        cube.scale = 5;

        expect(cube.scaleX).toBe(5);
        expect(cube.scaleY).toBe(5);
        expect(cube.scaleZ).toBe(5);
    });

    test('Should scale about the shape origin, after its rotation and before its position', () => {
        const cube = createCube({
            size: 1,
            x: 10,
            scaleX: 2,
        });

        expect(mat4TransformPoint(modelMatrix(cube), [1, 0, 0])[0]).toBe(12);
    });

    // Transforming a normal by the model matrix is only correct under uniform scale; a squashed
    // shape needs the inverse transpose or its highlights sit in the wrong place.
    test('Should keep a normal perpendicular to the surface under non-uniform scale', () => {
        const cube = createCube({
            size: 2,
            scaleX: 3,
            scaleY: 0.25,
            rotationY: 0.6,
        });
        const model = modelMatrix(cube);
        const normalMatrix = mat4NormalMatrix(model);

        const origin: Vector3 = [0, 0, 0];
        const alongU: Vector3 = [1, 1, 0];
        const alongV: Vector3 = [0, 0, 1];
        const localNormal = vec3Normalize([1, -1, 0]);

        const worldOrigin = mat4TransformPoint(model, origin);
        const edgeU = vec3Normalize(vec3Sub(mat4TransformPoint(model, alongU), worldOrigin));
        const edgeV = vec3Normalize(vec3Sub(mat4TransformPoint(model, alongV), worldOrigin));
        const worldNormal = vec3Normalize(mat4TransformDirection(normalMatrix, localNormal));

        expect(vec3Dot(worldNormal, edgeU)).toBeCloseTo(0, 10);
        expect(vec3Dot(worldNormal, edgeV)).toBeCloseTo(0, 10);
    });

    test('Should collapse the geometry to a point at zero scale', () => {
        const cube = createCube({
            size: 1,
            scale: 0,
        });

        expect(mat4TransformPoint(modelMatrix(cube), [1, 1, 1])).toEqual([0, 0, 0]);
    });

});

/*
 * interpolateVector3 was exported and unit tested but referenced by nothing: getInterpolator picked
 * from a closed list of core interpolators, and interpolateBorderRadius — which matches any array of
 * up to four numbers — claimed a Vector3 before anything else could. Every vector-valued property
 * this work added would otherwise animate as a border radius.
 */
describe('Vector3 interpolation', () => {

    interface AnchoredState extends Shape3DState {
        anchor: Vector3;
    }

    class Anchored extends Shape3D<AnchoredState> {

        public get anchor() {
            return this.getStateValue('anchor');
        }

        constructor(anchor: Vector3) {
            super('anchored', {
                anchor,
            });
        }

    }

    test('Should interpolate a Vector3 property component-wise', () => {
        const element = new Anchored([0, 0, 0]);
        const tick = element.interpolate({
            anchor: [10, 20, 30],
        });

        tick(0.5);

        expect(element.anchor).toEqual([5, 10, 15]);
    });

    test('Should land exactly on the target at the end of the transition', () => {
        const element = new Anchored([1, 2, 3]);
        const tick = element.interpolate({
            anchor: [4, 5, 6],
        });

        tick(1);

        expect(element.anchor).toEqual([4, 5, 6]);
    });

    // Without the registration a Vector3 fell to interpolateBorderRadius, which normalizes a
    // three-element array into four corners and hands back a value of the wrong shape entirely.
    test('Should not resolve a Vector3 as a border radius', () => {
        const element = new Anchored([0, 0, 0]);
        const tick = element.interpolate({
            anchor: [10, 20, 30],
        });

        tick(0.5);

        expect(element.anchor).toHaveLength(3);
    });

});
