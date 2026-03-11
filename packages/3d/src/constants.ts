import type {
    Vector3,
} from './math/vector';

/** Pre-normalised light direction vectors for common light positions. */
export const LIGHT_DIRECTION = {
    top: [0, -1, 0],
    bottom: [0, 1, 0],
    left: [-1, 0, 0],
    right: [1, 0, 0],
    front: [0, 0, -1],
    back: [0, 0, 1],
    topLeft: [-0.707, -0.707, 0],
    topRight: [0.707, -0.707, 0],
    topFront: [0, -0.707, -0.707],
    topBack: [0, -0.707, 0.707],
    topLeftFront: [-0.577, -0.577, -0.577],
    topRightFront: [0.577, -0.577, -0.577],
    topLeftBehind: [-0.577, -0.577, 0.577],
    topRightBehind: [0.577, -0.577, 0.577],
    bottomLeft: [-0.707, 0.707, 0],
    bottomRight: [0.707, 0.707, 0],
} as const satisfies Record<string, Vector3>;
