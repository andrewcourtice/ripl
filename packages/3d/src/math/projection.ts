import {
    mat4TransformPoint,
} from './matrix';

import type {
    Matrix4,
} from './matrix';

import type {
    Vector3,
} from './vector';

import type {
    ProjectedPoint,
} from '../context';

export interface Viewport {
    width: number;
    height: number;
}

export function projectPoint(point: Vector3, viewProjection: Matrix4, viewport: Viewport): ProjectedPoint {
    const clip = mat4TransformPoint(viewProjection, point);

    return [
        (clip[0] * 0.5 + 0.5) * viewport.width,
        (-clip[1] * 0.5 + 0.5) * viewport.height,
        clip[2],
    ];
}
