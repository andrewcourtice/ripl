import {
    vec3Normalize,
} from '../math/vector';

import {
    objectFreeze,
} from '@ripl/utilities';

import type {
    Vector3,
} from '../math/vector';

/**
 * Pre-normalized light direction vectors for common light positions.
 *
 * Each entry is normalized at module load from its exact axis combination, so a diagonal is a true
 * unit vector rather than a rounded decimal — {@link Context3D.getLightDirectionForRender} and the
 * WGSL shader both assume unit length and a truncated one biases every diagonal light slightly dim.
 */
export const LIGHT_DIRECTION = objectFreeze({
    /** Light shining straight down from above. */
    top: vec3Normalize([0, -1, 0]),
    /** Light shining straight up from below. */
    bottom: vec3Normalize([0, 1, 0]),
    /** Light shining from the left. */
    left: vec3Normalize([-1, 0, 0]),
    /** Light shining from the right. */
    right: vec3Normalize([1, 0, 0]),
    /** Light shining from the front (towards the viewer). */
    front: vec3Normalize([0, 0, -1]),
    /** Light shining from behind the scene. */
    back: vec3Normalize([0, 0, 1]),
    /** Light shining from the upper-left. */
    topLeft: vec3Normalize([-1, -1, 0]),
    /** Light shining from the upper-right. */
    topRight: vec3Normalize([1, -1, 0]),
    /** Light shining from above and in front. */
    topFront: vec3Normalize([0, -1, -1]),
    /** Light shining from above and behind. */
    topBack: vec3Normalize([0, -1, 1]),
    /** Light shining from the upper-left and in front. */
    topLeftFront: vec3Normalize([-1, -1, -1]),
    /** Light shining from the upper-right and in front. */
    topRightFront: vec3Normalize([1, -1, -1]),
    /** Light shining from the upper-left and behind. */
    topLeftBehind: vec3Normalize([-1, -1, 1]),
    /** Light shining from the upper-right and behind. */
    topRightBehind: vec3Normalize([1, -1, 1]),
    /** Light shining from the lower-left. */
    bottomLeft: vec3Normalize([-1, 1, 0]),
    /** Light shining from the lower-right. */
    bottomRight: vec3Normalize([1, 1, 0]),
}) satisfies Record<string, Vector3>;
