import {
    Shape3D,
} from '../core/shape';

import {
    tessellateParametric,
} from './parametric';

import type {
    Face3D,
    Shape3DOptions,
    Shape3DState,
} from '../core/shape';

import type {
    Vector3,
} from '../math/vector';

import type {
    Shape3DDefaults,
} from '../core/shape';

import {
    interpolateNumber,
} from '@ripl/core';

/**
 * The sixteen control points of a bicubic Bézier patch, in row-major order.
 *
 * The surface passes through the four corners and is pulled towards the twelve interior points, so
 * a patch is edited by moving points rather than by evaluating a formula.
 */
export type BezierPatch = [
    Vector3, Vector3, Vector3, Vector3,
    Vector3, Vector3, Vector3, Vector3,
    Vector3, Vector3, Vector3, Vector3,
    Vector3, Vector3, Vector3, Vector3
];

/** State for a surface tessellated from Bézier patches. */
export interface BezierSurfaceState extends Shape3DState {
    /** The number of subdivisions along each parameter of every patch. */
    segments: number;
    /** A counter bumped whenever the patch list is replaced, invalidating the cached geometry. */
    revision: number;
}

/** Options for constructing a {@link BezierSurface}. */
export interface BezierSurfaceOptions extends Shape3DOptions<BezierSurfaceState> {
    /** The patches to tessellate. Held by reference and never copied. */
    patches: BezierPatch[];
}

/**
 * Evaluates the four cubic Bernstein basis functions at `t`.
 *
 * @param t - The parameter, from `0` to `1`.
 * @returns The four weights, summing to `1`.
 */
export function bernstein3(t: number): [number, number, number, number] {
    const inv = 1 - t;

    return [
        inv * inv * inv,
        3 * inv * inv * t,
        3 * inv * t * t,
        t * t * t,
    ];
}

/**
 * Evaluates a bicubic Bézier patch at `(u, v)`.
 *
 * @param patch - The patch's sixteen control points, in row-major order.
 * @param u - The parameter along the patch's rows, from `0` to `1`.
 * @param v - The parameter along the patch's columns, from `0` to `1`.
 * @returns The point on the surface.
 */
export function evaluateBezierPatch(patch: BezierPatch, u: number, v: number): Vector3 {
    const weightsU = bernstein3(u);
    const weightsV = bernstein3(v);

    let px = 0;
    let py = 0;
    let pz = 0;

    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            const weight = weightsU[row] * weightsV[col];
            const point = patch[row * 4 + col];

            px += point[0] * weight;
            py += point[1] * weight;
            pz += point[2] * weight;
        }
    }

    return [px, py, pz];
}

const BEZIER_SURFACE_DEFAULTS: Shape3DDefaults<BezierSurfaceState> = {
    revision: 0,
    segments: 8,
    interpolators: {
        revision: interpolateNumber,
        segments: interpolateNumber,
    },
};

/**
 * A surface tessellated from one or more bicubic Bézier patches.
 *
 * This is how curved surfaces that no primitive covers get built — the Utah teapot, a car body, a
 * lofted shape. Each patch is tessellated as a parametric surface, so normals and UVs come free.
 *
 * @example
 * const surface = createBezierSurface({
 *     patches: TEAPOT_PATCHES,
 *     segments: 10,
 *     fill: '#c86432',
 * });
 */
export class BezierSurface extends Shape3D<BezierSurfaceState> {

    private _patches: BezierPatch[];

    /** The number of subdivisions along each parameter of every patch. */
    public get segments() {
        return this.getStateValue('segments');
    }

    public set segments(value) {
        this.setStateValue('segments', value);
    }

    /** A counter bumped whenever the patch list is replaced. */
    public get revision() {
        return this.getStateValue('revision');
    }

    /** The patches this surface is tessellated from. */
    public get patches() {
        return this._patches;
    }

    constructor(options: BezierSurfaceOptions) {
        const {
            patches,
            ...state
        } = options;

        super('bezier-surface', state, BEZIER_SURFACE_DEFAULTS);

        this._patches = patches;
    }

    /**
     * Replaces the patch list, invalidating the cached geometry.
     *
     * @param patches - The new patches, held by reference.
     */
    public setPatches(patches: BezierPatch[]): void {
        this._patches = patches;
        this.setStateValue('revision', this.revision + 1);
    }

    protected computeFaces(): Face3D[] {
        const segments = this.segments;

        return this._patches.flatMap(patch => tessellateParametric(
            (u, v) => evaluateBezierPatch(patch, u, v),
            segments,
            segments
        ));
    }

}

/** Creates a {@link BezierSurface}. */
export function createBezierSurface(options: BezierSurfaceOptions) {
    return new BezierSurface(options);
}

/** Type guard that checks whether a value is a {@link BezierSurface} instance. */
export function elementIsBezierSurface(value: unknown): value is BezierSurface {
    return value instanceof BezierSurface;
}
