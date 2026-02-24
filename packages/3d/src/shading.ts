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

import type {
    Vector3,
} from './math/vector';

export function computeFaceNormal(vertices: Vector3[]): Vector3 {
    const edge1 = vec3Sub(vertices[1], vertices[0]);
    const edge2 = vec3Sub(vertices[2], vertices[0]);

    return vec3Normalize(vec3Cross(edge1, edge2));
}

export function computeFaceBrightness(normal: Vector3, lightDirection: Vector3): number {
    const normalizedLight = vec3Normalize(lightDirection);
    const dot = -vec3Dot(normal, normalizedLight);
    
    return Math.max(0, Math.min(1, dot));
}

export function shadeFaceColor(baseColor: string, brightness: number): string {
    const rgba = parseColor(baseColor);

    if (!rgba) {
        return baseColor;
    }

    return serialiseRGBA(
        Math.round(rgba[0] * brightness),
        Math.round(rgba[1] * brightness),
        Math.round(rgba[2] * brightness),
        rgba[3]
    );
}
