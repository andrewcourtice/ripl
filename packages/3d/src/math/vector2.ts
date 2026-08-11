import {
    typeIsArray,
    typeIsNumber,
} from '@ripl/utilities';

/** A 2-component vector represented as a labeled tuple [x, y]. */
export type Vector2 = [x: number, y: number];

/** Returns the component-wise sum of two vectors. */
export function vec2Add(a: Vector2, b: Vector2): Vector2 {
    return [a[0] + b[0], a[1] + b[1]];
}

/** Returns the component-wise difference of two vectors. */
export function vec2Sub(a: Vector2, b: Vector2): Vector2 {
    return [a[0] - b[0], a[1] - b[1]];
}

/** Scales a vector by a scalar. */
export function vec2Scale(v: Vector2, s: number): Vector2 {
    return [v[0] * s, v[1] * s];
}

/** Returns the component-wise product of two vectors. */
export function vec2Multiply(a: Vector2, b: Vector2): Vector2 {
    return [a[0] * b[0], a[1] * b[1]];
}

/** Computes the dot product of two vectors. */
export function vec2Dot(a: Vector2, b: Vector2): number {
    return a[0] * b[0] + a[1] * b[1];
}

/** Returns the Euclidean length of a vector. */
export function vec2Length(v: Vector2): number {
    return Math.sqrt(v[0] * v[0] + v[1] * v[1]);
}

/** Returns the unit-length direction of a vector, or the zero vector if length is 0. */
export function vec2Normalize(v: Vector2): Vector2 {
    const len = vec2Length(v);

    if (len === 0) {
        return [0, 0];
    }

    return [v[0] / len, v[1] / len];
}

/** Linearly interpolates between two vectors by factor `t`. */
export function vec2Lerp(a: Vector2, b: Vector2, t: number): Vector2 {
    return [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
    ];
}

/** Type guard that checks whether a value is a `Vector2` tuple. */
export function typeIsVector2(value: unknown): value is Vector2 {
    return typeIsArray(value) && value.length === 2
        && typeIsNumber(value[0])
        && typeIsNumber(value[1]);
}
