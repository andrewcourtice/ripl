import {
    typeIsVector3,
    vec3Lerp,
} from './math/vector';

import type {
    InterpolatorFactory,
} from '@ripl/core';

import type {
    Vector3,
} from './math/vector';

export const interpolateVector3: InterpolatorFactory<Vector3> = Object.assign(
    (from: Vector3, to: Vector3) => {
        return (time: number): Vector3 => vec3Lerp(from, to, time);
    },
    {
        test: (value: unknown): boolean => typeIsVector3(value),
    }
);
