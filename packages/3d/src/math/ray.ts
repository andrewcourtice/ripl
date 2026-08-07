import {
    vec3Add,
    vec3Cross,
    vec3Dot,
    vec3Normalize,
    vec3Scale,
    vec3Sub,
} from './vector';

import type {
    Vector3,
} from './vector';

/** Below this the ray is parallel to the triangle plane and the barycentric solve is unstable. */
const PARALLEL_EPSILON = 1e-12;

/** A half-line in world space, used for picking and intersection queries. */
export interface Ray {
    /** The point the ray starts from. */
    origin: Vector3;
    /** The unit-length direction the ray travels in. */
    direction: Vector3;
}

/** Where a {@link Ray} met a triangle, in both distance and barycentric terms. */
export interface RayTriangleHit {
    /** Distance along the ray, in world units, at which the hit occurred. */
    distance: number;
    /** Barycentric weight of the triangle's second vertex. */
    weightB: number;
    /** Barycentric weight of the triangle's third vertex. */
    weightC: number;
    /** Whether the triangle was met from behind, relative to its counter-clockwise winding. */
    backFacing: boolean;
}

/** Creates a ray from an origin and a direction, normalising the direction. */
export function createRay(origin: Vector3, direction: Vector3): Ray {
    return {
        origin,
        direction: vec3Normalize(direction),
    };
}

/** Returns the point at `distance` along a ray. */
export function rayAt(ray: Ray, distance: number): Vector3 {
    return vec3Add(ray.origin, vec3Scale(ray.direction, distance));
}

/**
 * Intersects a ray with a triangle using the Möller–Trumbore algorithm.
 *
 * Both facings are reported rather than culled, because a `Shape3D`'s faces carry whatever winding
 * their author emitted and rejecting on it would silently miss geometry. Callers that want
 * front-facing hits only can filter on {@link RayTriangleHit.backFacing}.
 *
 * @param ray - The ray to cast.
 * @param a - The triangle's first vertex.
 * @param b - The triangle's second vertex.
 * @param c - The triangle's third vertex.
 * @returns The hit, or `null` when the ray misses, is parallel, or would hit behind its origin.
 */
export function rayIntersectTriangle(ray: Ray, a: Vector3, b: Vector3, c: Vector3): RayTriangleHit | null {
    const edge1 = vec3Sub(b, a);
    const edge2 = vec3Sub(c, a);
    const pvec = vec3Cross(ray.direction, edge2);
    const det = vec3Dot(edge1, pvec);

    if (Math.abs(det) < PARALLEL_EPSILON) {
        return null;
    }

    const invDet = 1 / det;
    const tvec = vec3Sub(ray.origin, a);
    const bary1 = vec3Dot(tvec, pvec) * invDet;

    if (bary1 < 0 || bary1 > 1) {
        return null;
    }

    const qvec = vec3Cross(tvec, edge1);
    const bary2 = vec3Dot(ray.direction, qvec) * invDet;

    if (bary2 < 0 || bary1 + bary2 > 1) {
        return null;
    }

    const distance = vec3Dot(edge2, qvec) * invDet;

    if (distance < 0) {
        return null;
    }

    return {
        distance,
        weightB: bary1,
        weightC: bary2,
        backFacing: det < 0,
    };
}

/** Reconstructs a point on a triangle from the barycentric weights of a {@link RayTriangleHit}. */
export function rayHitBarycentric<TValue extends Vector3 | [number, number]>(
    hit: RayTriangleHit,
    a: TValue,
    b: TValue,
    c: TValue
): TValue {
    const weightA = 1 - hit.weightB - hit.weightC;

    return a.map((value, index) => value * weightA + b[index] * hit.weightB + c[index] * hit.weightC) as TValue;
}
