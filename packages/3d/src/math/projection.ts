import {
    mat4Invert,
    mat4TransformPoint,
} from './matrix';

import {
    createRay,
} from './ray';

import {
    vec3Sub,
} from './vector';

import type {
    Matrix4,
} from './matrix';

import type {
    Ray,
} from './ray';

import type {
    Vector3,
} from './vector';

/** A 2D screen-space point with a depth component for z-ordering. */
export type ProjectedPoint = [x: number, y: number, depth: number];

/** Viewport dimensions used for projection. */
export interface Viewport {
    /** Width of the viewport, in pixels. */
    width: number;
    /** Height of the viewport, in pixels. */
    height: number;
}

/** Projects a 3D world-space point onto 2D screen-space via a view-projection matrix and viewport. */
export function projectPoint(point: Vector3, viewProjection: Matrix4, viewport: Viewport): ProjectedPoint {
    const clip = mat4TransformPoint(viewProjection, point);

    return [
        (clip[0] * 0.5 + 0.5) * viewport.width,
        (-clip[1] * 0.5 + 0.5) * viewport.height,
        clip[2],
    ];
}

/**
 * Reverses {@link projectPoint}, mapping a screen-space point at a given clip depth back into world
 * space.
 *
 * @param x - Screen-space x, in the same logical pixels {@link projectPoint} produces.
 * @param y - Screen-space y.
 * @param depth - Clip-space depth, `0` at the near plane and `1` at the far plane.
 * @param inverseViewProjection - The inverse of the view-projection matrix used to project.
 * @param viewport - The viewport the point was projected into.
 * @returns The world-space point.
 */
export function unprojectPoint(
    x: number,
    y: number,
    depth: number,
    inverseViewProjection: Matrix4,
    viewport: Viewport
): Vector3 {
    return mat4TransformPoint(inverseViewProjection, [
        (x / viewport.width) * 2 - 1,
        1 - (y / viewport.height) * 2,
        depth,
    ]);
}

/**
 * Builds the world-space ray passing through a screen-space point.
 *
 * Unprojects the near and far planes and joins them, which works for both perspective and
 * orthographic projections — an orthographic ray is parallel to the view direction rather than
 * fanning from an eye point, and this recovers that without a special case.
 *
 * @param x - Screen-space x, in logical pixels.
 * @param y - Screen-space y.
 * @param viewProjection - The view-projection matrix in use.
 * @param viewport - The viewport the point was measured in.
 * @returns The ray, or `null` when the view-projection matrix is singular.
 */
export function rayFromScreen(
    x: number,
    y: number,
    viewProjection: Matrix4,
    viewport: Viewport
): Ray | null {
    const inverse = mat4Invert(viewProjection);

    if (!inverse) {
        return null;
    }

    const near = unprojectPoint(x, y, 0, inverse, viewport);
    const far = unprojectPoint(x, y, 1, inverse, viewport);

    return createRay(near, vec3Sub(far, near));
}
