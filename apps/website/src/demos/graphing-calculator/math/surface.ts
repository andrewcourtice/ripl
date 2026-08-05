import {
    createEvaluationScope,
} from './compile';

import type {
    CompiledExpression,
    SurfaceDomain,
    SurfaceField,
    SurfaceFieldOptions,
} from '../types';

/** The coarsest grid a surface may be evaluated at, which is a single quad. */
export const MIN_SURFACE_RESOLUTION = 2;

/**
 * The finest grid a surface may be evaluated at.
 *
 * The CPU painter's algorithm sorts every face globally, so the mesh runs out of frame budget long
 * before the evaluation does; this is a backstop against a pasted resolution, not a quality target.
 */
export const MAX_SURFACE_RESOLUTION = 256;

function copyDomain(domain: SurfaceDomain): SurfaceDomain {
    return {
        xMin: domain.xMin,
        xMax: domain.xMax,
        yMin: domain.yMin,
        yMax: domain.yMax,
    };
}

function createEmptyField(domain: SurfaceDomain): SurfaceField {
    return {
        resolution: MIN_SURFACE_RESOLUTION,
        domain: copyDomain(domain),
        values: new Float64Array(MIN_SURFACE_RESOLUTION * MIN_SURFACE_RESOLUTION).fill(NaN),
        zMin: 0,
        zMax: 0,
    };
}

/**
 * Evaluates a `surface` expression over a grid of vertices.
 *
 * Heights are sampled at vertices rather than per quad, so adjacent quads share them and the mesh
 * costs `resolution²` evaluations instead of four times that. The field is returned as a
 * `Float64Array` held outside any element, because a `Shape3D`'s `computeFaces()` re-runs on every
 * state change and must never call into the expression engine.
 *
 * @param expression - The compiled surface expression.
 * @param options - The domain, grid resolution and parameter values.
 * @returns The height field, with `NaN` wherever the surface is undefined.
 * @example
 * ```typescript
 * const field = evaluateSurface(compiled, {
 *     domain: { xMin: -4, xMax: 4, yMin: -4, yMax: 4 },
 *     resolution: 48,
 *     params: new Map(),
 * });
 * ```
 */
export function evaluateSurface(expression: CompiledExpression, options: SurfaceFieldOptions): SurfaceField {
    const { domain } = options;

    if (expression.error || domain.xMax <= domain.xMin || domain.yMax <= domain.yMin) {
        return createEmptyField(domain);
    }

    const resolution = Math.min(MAX_SURFACE_RESOLUTION, Math.max(MIN_SURFACE_RESOLUTION, Math.floor(options.resolution)));
    const scope = createEvaluationScope(expression, options.params);
    const values = new Float64Array(resolution * resolution);
    const dx = (domain.xMax - domain.xMin) / (resolution - 1);
    const dy = (domain.yMax - domain.yMin) / (resolution - 1);

    let zMin = Infinity;
    let zMax = -Infinity;

    function fillRow(row: number): void {
        const offset = row * resolution;

        scope.set('y', domain.yMin + row * dy);

        for (let col = 0; col < resolution; col++) {
            scope.set('x', domain.xMin + col * dx);

            const height = expression.evaluate(scope);

            values[offset + col] = height;

            if (Number.isFinite(height)) {
                zMin = Math.min(zMin, height);
                zMax = Math.max(zMax, height);
            }
        }
    }

    for (let row = 0; row < resolution; row++) {
        fillRow(row);
    }

    const bounded = zMin <= zMax;

    return {
        resolution,
        domain: copyDomain(domain),
        values,
        zMin: bounded ? zMin : 0,
        zMax: bounded ? zMax : 0,
    };
}
