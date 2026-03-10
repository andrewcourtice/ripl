import {
    typeIsNumber,
} from '@ripl/utilities';

/** A 3-component vector represented as a labeled tuple [x, y, z]. */
export type Vector3 = [x: number, y: number, z: number];

/** Returns the component-wise sum of two vectors. */
export function vec3Add(a: Vector3, b: Vector3): Vector3 {
    return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

/** Returns the component-wise difference of two vectors. */
export function vec3Sub(a: Vector3, b: Vector3): Vector3 {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/** Scales a vector by a scalar. */
export function vec3Scale(v: Vector3, s: number): Vector3 {
    return [v[0] * s, v[1] * s, v[2] * s];
}

/** Computes the dot product of two vectors. */
export function vec3Dot(a: Vector3, b: Vector3): number {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** Computes the cross product of two vectors. */
export function vec3Cross(a: Vector3, b: Vector3): Vector3 {
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    ];
}

/** Returns the Euclidean length of a vector. */
export function vec3Length(v: Vector3): number {
    return Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
}

/** Returns the unit-length direction of a vector, or the zero vector if length is 0. */
export function vec3Normalize(v: Vector3): Vector3 {
    const len = vec3Length(v);

    if (len === 0) {
        return [0, 0, 0];
    }

    return [v[0] / len, v[1] / len, v[2] / len];
}

/** Linearly interpolates between two vectors by factor `t`. */
export function vec3Lerp(a: Vector3, b: Vector3, t: number): Vector3 {
    return [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
    ];
}

/** Negates all components of a vector. */
export function vec3Negate(v: Vector3): Vector3 {
    return [-v[0], -v[1], -v[2]];
}

/** Returns the Euclidean distance between two points. */
export function vec3Distance(a: Vector3, b: Vector3): number {
    return vec3Length(vec3Sub(a, b));
}

/** Type guard that checks whether a value is a `Vector3` tuple. */
export function typeIsVector3(value: unknown): value is Vector3 {
    return Array.isArray(value) && value.length === 3
        && typeIsNumber(value[0])
        && typeIsNumber(value[1])
        && typeIsNumber(value[2]);
}
