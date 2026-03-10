import {
    mat4TransformPoint,
} from './matrix';

import type {
    Matrix4,
} from './matrix';

import type {
    Vector3,
} from './vector';

/** A 2D screen-space point with a depth component for z-ordering. */
export type ProjectedPoint = [x: number, y: number, depth: number];

/** Viewport dimensions used for projection. */
export interface Viewport {
    width: number;
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
