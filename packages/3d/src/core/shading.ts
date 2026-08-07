import {
    vec3Dot,
    vec3Normalize,
    vec3TriangleNormal,
} from '../math/vector';

import type {
    Vector3,
} from '../math/vector';

import {
    parseColor,
    serializeRGBA,
} from '@ripl/core';

import type {
    ColorRGBA,
} from '@ripl/core';

import {
    numberClamp,
    typeIsString,
} from '@ripl/utilities';

/**
 * Computes the surface normal of a face from its first three vertices via the cross product.
 *
 * Delegates to {@link vec3TriangleNormal} so the CPU painter and the GPU mesh path agree on
 * degenerate faces — the two used to disagree, one shading a collapsed face black and the other
 * treating it as facing up.
 *
 * @param vertices - The face's vertices; only the first three are read.
 * @returns The face's unit normal.
 */
export function computeFaceNormal(vertices: Vector3[]): Vector3 {
    return vec3TriangleNormal(vertices[0], vertices[1], vertices[2]);
}

/** Computes a 0–1 brightness value for a face given its normal and a light direction. */
export function computeFaceBrightness(normal: Vector3, lightDirection: Vector3, normalized?: boolean): number {
    const light = normalized ? lightDirection : vec3Normalize(lightDirection);
    const dot = -vec3Dot(normal, light);

    return numberClamp(dot, 0, 1);
}

/** Shades a color by a brightness factor (0–1), darkening or lightening the RGB channels. */
export function shadeFaceColor(baseColor: string, brightness: number): string;
/** Shades a color by a brightness factor (0–1), darkening or lightening the RGB channels. */
export function shadeFaceColor(baseColor: ColorRGBA, brightness: number): string;
export function shadeFaceColor(baseColor: string | ColorRGBA, brightness: number): string {
    const rgba = typeIsString(baseColor) ? parseColor(baseColor) : baseColor;

    if (!rgba) {
        return baseColor as string;
    }

    return serializeRGBA(
        Math.round(rgba[0] * brightness),
        Math.round(rgba[1] * brightness),
        Math.round(rgba[2] * brightness),
        rgba[3]
    );
}
