import {
    typeIsVector3,
    vec3Lerp,
} from '../math/vector';

import {
    registerInterpolator,
} from '@ripl/core';

import type {
    InterpolatorFactory,
} from '@ripl/core';

import type {
    Vector3,
} from '../math/vector';

/** Interpolator factory for `Vector3` values, using component-wise linear interpolation. */
export const interpolateVector3: InterpolatorFactory<Vector3> = Object.assign(
    (from: Vector3, to: Vector3) => {
        return (time: number): Vector3 => vec3Lerp(from, to, time);
    },
    {
        test: (value: unknown): boolean => typeIsVector3(value),
    }
);

/*
 * Registered eagerly, because the built-in `interpolateBorderRadius` matches any array of up to
 * four numbers and would otherwise claim a Vector3 first — animating a light's colour or a shape's
 * scale as a border radius.
 */
registerInterpolator(interpolateVector3);
