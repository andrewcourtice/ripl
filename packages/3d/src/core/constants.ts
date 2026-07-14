import type {
    Vector3,
} from '../math/vector';

/** Pre-normalised light direction vectors for common light positions. */
export const LIGHT_DIRECTION = {
    /** Light shining straight down from above. */
    top: [0, -1, 0],
    /** Light shining straight up from below. */
    bottom: [0, 1, 0],
    /** Light shining from the left. */
    left: [-1, 0, 0],
    /** Light shining from the right. */
    right: [1, 0, 0],
    /** Light shining from the front (towards the viewer). */
    front: [0, 0, -1],
    /** Light shining from behind the scene. */
    back: [0, 0, 1],
    /** Light shining from the upper-left. */
    topLeft: [-0.707, -0.707, 0],
    /** Light shining from the upper-right. */
    topRight: [0.707, -0.707, 0],
    /** Light shining from above and in front. */
    topFront: [0, -0.707, -0.707],
    /** Light shining from above and behind. */
    topBack: [0, -0.707, 0.707],
    /** Light shining from the upper-left and in front. */
    topLeftFront: [-0.577, -0.577, -0.577],
    /** Light shining from the upper-right and in front. */
    topRightFront: [0.577, -0.577, -0.577],
    /** Light shining from the upper-left and behind. */
    topLeftBehind: [-0.577, -0.577, 0.577],
    /** Light shining from the upper-right and behind. */
    topRightBehind: [0.577, -0.577, 0.577],
    /** Light shining from the lower-left. */
    bottomLeft: [-0.707, 0.707, 0],
    /** Light shining from the lower-right. */
    bottomRight: [0.707, 0.707, 0],
} as const satisfies Record<string, Vector3>;
