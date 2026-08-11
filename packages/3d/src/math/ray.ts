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

/**
 * Intersects a ray with a triangle read straight out of a packed vertex buffer.
 *
 * The same Möller–Trumbore solve as {@link rayIntersectTriangle}, written against three flat offsets
 * and scalars. That version allocates five vectors per triangle, which a pointer move over a mesh of
 * a few thousand triangles turns into tens of thousands of short-lived objects; this one allocates
 * nothing, at the cost of reporting only the distance.
 *
 * @param ray - The ray to cast.
 * @param vertices - World-space vertex components, three floats per vertex.
 * @param offsetA - Index into `vertices` of the triangle's first vertex.
 * @param offsetB - Index into `vertices` of the triangle's second vertex.
 * @param offsetC - Index into `vertices` of the triangle's third vertex.
 * @returns The distance along the ray, or `-1` when the ray misses, is parallel, or would hit behind its origin.
 */
export function rayIntersectTriangleBuffer(
    ray: Ray,
    vertices: Float64Array,
    offsetA: number,
    offsetB: number,
    offsetC: number
): number {
    const origin = ray.origin;
    const direction = ray.direction;

    const ax = vertices[offsetA];
    const ay = vertices[offsetA + 1];
    const az = vertices[offsetA + 2];

    const e1x = vertices[offsetB] - ax;
    const e1y = vertices[offsetB + 1] - ay;
    const e1z = vertices[offsetB + 2] - az;

    const e2x = vertices[offsetC] - ax;
    const e2y = vertices[offsetC + 1] - ay;
    const e2z = vertices[offsetC + 2] - az;

    const px = direction[1] * e2z - direction[2] * e2y;
    const py = direction[2] * e2x - direction[0] * e2z;
    const pz = direction[0] * e2y - direction[1] * e2x;

    const det = e1x * px + e1y * py + e1z * pz;

    if (Math.abs(det) < PARALLEL_EPSILON) {
        return -1;
    }

    const invDet = 1 / det;
    const tx = origin[0] - ax;
    const ty = origin[1] - ay;
    const tz = origin[2] - az;

    const bary1 = (tx * px + ty * py + tz * pz) * invDet;

    if (bary1 < 0 || bary1 > 1) {
        return -1;
    }

    const qx = ty * e1z - tz * e1y;
    const qy = tz * e1x - tx * e1z;
    const qz = tx * e1y - ty * e1x;

    const bary2 = (direction[0] * qx + direction[1] * qy + direction[2] * qz) * invDet;

    if (bary2 < 0 || bary1 + bary2 > 1) {
        return -1;
    }

    const distance = (e2x * qx + e2y * qy + e2z * qz) * invDet;

    return distance < 0 ? -1 : distance;
}

/**
 * Tests a ray against an axis-aligned bounding box using the slab method.
 *
 * A conservative reject: it never misses a box the ray really meets, but an axis the ray runs
 * exactly along the face of may report a hit it does not have. That is the right trade for a
 * broad phase, whose only job is to keep whole meshes out of the triangle loop.
 *
 * @param ray - The ray to cast.
 * @param bounds - The box as `[minX, minY, minZ, maxX, maxY, maxZ]`.
 * @returns Whether the ray may meet the box.
 */
export function rayIntersectsBox(ray: Ray, bounds: ArrayLike<number>): boolean {
    const origin = ray.origin;
    const direction = ray.direction;

    let near = 0;
    let far = Infinity;

    for (let axis = 0; axis < 3; axis++) {
        const inverse = 1 / direction[axis];
        const first = (bounds[axis] - origin[axis]) * inverse;
        const second = (bounds[axis + 3] - origin[axis]) * inverse;

        near = Math.max(near, Math.min(first, second));
        far = Math.min(far, Math.max(first, second));

        if (far < near) {
            return false;
        }
    }

    return true;
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
