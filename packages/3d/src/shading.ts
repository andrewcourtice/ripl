import {
    parseColor,
    serialiseRGBA,
} from '@ripl/core';

import {
    vec3Cross,
    vec3Dot,
    vec3Normalize,
    vec3Sub,
} from './math/vector';

import {
    typeIsString,
} from '@ripl/utilities';

import type {
    ColorRGBA,
} from '@ripl/core';

import type {
    Vector3,
} from './math/vector';

/** Computes the surface normal of a face from its first three vertices via the cross product. */
export function computeFaceNormal(vertices: Vector3[]): Vector3 {
    const edge1 = vec3Sub(vertices[1], vertices[0]);
    const edge2 = vec3Sub(vertices[2], vertices[0]);

    return vec3Normalize(vec3Cross(edge1, edge2));
}

/** Computes a 0–1 brightness value for a face given its normal and a light direction. */
export function computeFaceBrightness(normal: Vector3, lightDirection: Vector3, normalized?: boolean): number {
    const light = normalized ? lightDirection : vec3Normalize(lightDirection);
    const dot = -vec3Dot(normal, light);

    return Math.max(0, Math.min(1, dot));
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

    return serialiseRGBA(
        Math.round(rgba[0] * brightness),
        Math.round(rgba[1] * brightness),
        Math.round(rgba[2] * brightness),
        rgba[3]
    );
}
