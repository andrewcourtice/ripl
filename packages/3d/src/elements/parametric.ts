import {
    Shape3D,
} from '../core/shape';

import {
    vec3Cross,
    vec3Normalize,
    vec3Sub,
} from '../math/vector';

import type {
    Face3D,
    Shape3DOptions,
    Shape3DState,
} from '../core/shape';

import type {
    Vector2,
} from '../math/vector2';

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
 * Evaluates a surface at a point in its parameter domain.
 *
 * @param u - The first parameter, from `0` to `1`.
 * @param v - The second parameter, from `0` to `1`.
 * @returns The world-space point at `(u, v)`.
 */
export type ParametricSurface = (u: number, v: number) => Vector3;

/** State for a surface tessellated from a parametric function. */
export interface ParametricState extends Shape3DState {
    /** The number of subdivisions along the first parameter. */
    uSegments: number;
    /** The number of subdivisions along the second parameter. */
    vSegments: number;
    /** A counter bumped whenever the surface function is replaced, invalidating the cached geometry. */
    revision: number;
}

/** Options for constructing a {@link Parametric}. */
export interface ParametricOptions extends Shape3DOptions<ParametricState> {
    /** The function to tessellate. */
    surface: ParametricSurface;
}

// Small enough to approximate the tangent, large enough that the difference does not vanish into
// floating-point noise for a surface with modest curvature.
const DERIVATIVE_STEP = 1e-4;

const PARAMETRIC_DEFAULTS: Shape3DDefaults<ParametricState> = {
    revision: 0,
    uSegments: 24,
    vSegments: 24,
    interpolators: {
        revision: interpolateNumber,
        uSegments: interpolateNumber,
        vSegments: interpolateNumber,
    },
};

/**
 * A surface tessellated from a function of two parameters.
 *
 * Normals come from the numeric partial derivatives, so a smooth analytic surface gets smooth
 * shading with no averaging pass, and UVs are the parameters themselves.
 *
 * @example
 * const ripple = createParametric({
 *     surface: (u, v) => {
 *         const x = u * 4 - 2;
 *         const z = v * 4 - 2;
 *
 *         return [x, Math.sin(x * 3) * Math.cos(z * 3) * 0.3, z];
 *     },
 *     uSegments: 48,
 *     vSegments: 48,
 * });
 */
export class Parametric extends Shape3D<ParametricState> {

    private _surface: ParametricSurface;

    /** The number of subdivisions along the first parameter. */
    public get uSegments() {
        return this.getStateValue('uSegments');
    }

    public set uSegments(value) {
        this.setStateValue('uSegments', value);
    }

    /** The number of subdivisions along the second parameter. */
    public get vSegments() {
        return this.getStateValue('vSegments');
    }

    public set vSegments(value) {
        this.setStateValue('vSegments', value);
    }

    /** A counter bumped whenever the surface function is replaced. */
    public get revision() {
        return this.getStateValue('revision');
    }

    /** The function this surface is tessellated from. */
    public get surface() {
        return this._surface;
    }

    constructor(options: ParametricOptions) {
        const {
            surface,
            ...state
        } = options;

        super('parametric', state, PARAMETRIC_DEFAULTS);

        this._surface = surface;
    }

    /**
     * Replaces the surface function, invalidating the cached geometry.
     *
     * @param surface - The new function to tessellate.
     */
    public setSurface(surface: ParametricSurface): void {
        this._surface = surface;
        this.setStateValue('revision', this.revision + 1);
    }

    protected computeFaces(): Face3D[] {
        return tessellateParametric(this._surface, this.uSegments, this.vSegments);
    }

}

// How far inside the domain to retreat when the surface degenerates at the sample point.
const POLE_RETREAT = 1e-3;

function partialNormal(surface: ParametricSurface, u: number, v: number): Vector3 {
    const uLow = Math.max(0, u - DERIVATIVE_STEP);
    const uHigh = Math.min(1, u + DERIVATIVE_STEP);
    const vLow = Math.max(0, v - DERIVATIVE_STEP);
    const vHigh = Math.min(1, v + DERIVATIVE_STEP);

    const tangentU = vec3Sub(surface(uHigh, v), surface(uLow, v));
    const tangentV = vec3Sub(surface(u, vHigh), surface(u, vLow));

    return vec3Normalize(vec3Cross(tangentU, tangentV));
}

/**
 * Approximates a parametric surface's normal at `(u, v)` from its numeric partial derivatives.
 *
 * The step is clamped to stay inside the domain at the edges, so a surface defined only on `[0, 1]`
 * is never sampled outside it.
 *
 * A surface of revolution collapses to a point at each pole, where the tangents are parallel and the
 * cross product vanishes. Rather than hand back a zero normal — which shades the pole black — this
 * retreats a little way into the domain and takes the normal there, which for a smooth surface is
 * the limit the pole is approaching.
 *
 * @param surface - The surface to differentiate.
 * @param u - The first parameter.
 * @param v - The second parameter.
 * @returns The unit normal, or the up vector for a surface degenerate in both directions.
 */
export function parametricNormal(surface: ParametricSurface, u: number, v: number): Vector3 {
    const normal = partialNormal(surface, u, v);

    if (normal[0] !== 0 || normal[1] !== 0 || normal[2] !== 0) {
        return normal;
    }

    for (const [offsetU, offsetV] of [[0, POLE_RETREAT], [0, -POLE_RETREAT], [POLE_RETREAT, 0], [-POLE_RETREAT, 0]]) {
        const retreated = partialNormal(
            surface,
            Math.min(1, Math.max(0, u + offsetU)),
            Math.min(1, Math.max(0, v + offsetV))
        );

        if (retreated[0] !== 0 || retreated[1] !== 0 || retreated[2] !== 0) {
            return retreated;
        }
    }

    return [0, 1, 0];
}

/**
 * Tessellates a parametric surface into a grid of quads with normals and UVs.
 *
 * @param surface - The surface to tessellate.
 * @param uSegments - Subdivisions along the first parameter.
 * @param vSegments - Subdivisions along the second parameter.
 * @returns One quad per grid cell.
 */
export function tessellateParametric(surface: ParametricSurface, uSegments: number, vSegments: number): Face3D[] {
    const uCount = Math.max(1, Math.trunc(uSegments));
    const vCount = Math.max(1, Math.trunc(vSegments));
    const faces: Face3D[] = [];

    for (let iu = 0; iu < uCount; iu++) {
        const u0 = iu / uCount;
        const u1 = (iu + 1) / uCount;

        for (let iv = 0; iv < vCount; iv++) {
            const v0 = iv / vCount;
            const v1 = (iv + 1) / vCount;

            const corners: Vector2[] = [
                [u0, v0],
                [u1, v0],
                [u1, v1],
                [u0, v1],
            ];

            faces.push({
                vertices: corners.map(([cu, cv]) => surface(cu, cv)),
                normals: corners.map(([cu, cv]) => parametricNormal(surface, cu, cv)),
                uvs: corners,
            });
        }
    }

    return faces;
}

/** Creates a {@link Parametric} surface. */
export function createParametric(options: ParametricOptions) {
    return new Parametric(options);
}

/** Type guard that checks whether a value is a {@link Parametric} instance. */
export function elementIsParametric(value: unknown): value is Parametric {
    return value instanceof Parametric;
}
