import {
    vec3Normalize,
} from '@ripl/3d';

import type {
    Face3D,
    ParametricSurface,
    Vector3,
} from '@ripl/3d';

import {
    TAU,
} from '@ripl/core';

/**
 * A control polygon for a cubic Bézier curve in the profile (radius, height) plane.
 *
 * A teapot is a body of revolution with two tubes stuck to it, so every part below is either a
 * profile spun around the Y axis or a circle swept along a curve.
 */
export type ProfileCurve = [Vector2D, Vector2D, Vector2D, Vector2D];

/** A point in the profile plane: distance from the axis, and height. */
export type Vector2D = [radius: number, height: number];

/** The parts a teapot is assembled from, each a separate surface. */
export type TeapotPart = 'body' | 'lid' | 'knob' | 'spout' | 'handle';

/**
 * The body profile, from the base to the rim.
 *
 * Two cubic segments: the bowl swelling out from the foot, then the shoulder drawing back in.
 */
const BODY_PROFILE: ProfileCurve[] = [
    [[0.75, 0], [1.35, 0.05], [1.5, 0.7], [1.5, 1.05]],
    [[1.5, 1.05], [1.5, 1.4], [1.1, 1.5], [0.95, 1.55]],
];

/** The lid profile, from its outer lip up to where the knob meets it. */
const LID_PROFILE: ProfileCurve[] = [
    [[1.02, 1.55], [1.02, 1.62], [0.72, 1.68], [0.5, 1.72]],
    [[0.5, 1.72], [0.32, 1.75], [0.22, 1.76], [0.16, 1.78]],
];

/** The knob profile, a small flattened sphere on top of the lid. */
const KNOB_PROFILE: ProfileCurve[] = [
    [[0.16, 1.78], [0.3, 1.82], [0.3, 2], [0.16, 2.02]],
    [[0.16, 2.02], [0.08, 2.03], [0.04, 2.04], [0, 2.04]],
];

/** The centre line of the spout, from where it leaves the body to its tip. */
const SPOUT_PATH: Vector3[] = [
    [1.3, 0.55, 0],
    [2.1, 0.6, 0],
    [2.35, 1.35, 0],
    [2.5, 1.6, 0],
];

/** The spout's radius at each end, tapering towards the tip. */
const SPOUT_RADII: [number, number] = [0.34, 0.14];

/** The centre line of the handle, an arc reaching back from the body. */
const HANDLE_PATH: Vector3[] = [
    [-1.35, 1.25, 0],
    [-2.3, 1.3, 0],
    [-2.4, 0.35, 0],
    [-1.35, 0.4, 0],
];

/** The handle's radius at each end. */
const HANDLE_RADII: [number, number] = [0.14, 0.14];

function bezier1D(points: number[], t: number): number {
    const inv = 1 - t;

    return points[0] * inv * inv * inv
        + points[1] * 3 * inv * inv * t
        + points[2] * 3 * inv * t * t
        + points[3] * t * t * t;
}

function samplePiecewise(segments: ProfileCurve[], t: number): Vector2D {
    const scaled = Math.min(t, 1) * segments.length;
    const index = Math.min(Math.floor(scaled), segments.length - 1);
    const local = scaled - index;
    const segment = segments[index];

    return [
        bezier1D(segment.map(point => point[0]), local),
        bezier1D(segment.map(point => point[1]), local),
    ];
}

function samplePath(points: Vector3[], t: number): Vector3 {
    return [
        bezier1D(points.map(point => point[0]), t),
        bezier1D(points.map(point => point[1]), t),
        bezier1D(points.map(point => point[2]), t),
    ];
}

/**
 * Builds the surface of revolution for a profile curve.
 *
 * @param segments - The profile, sampled from bottom to top.
 * @returns A surface where `u` runs around the axis and `v` runs up the profile.
 */
export function createRevolution(segments: ProfileCurve[]): ParametricSurface {
    return (u, v) => {
        const [radius, height] = samplePiecewise(segments, v);
        const angle = u * TAU;

        return [Math.cos(angle) * radius, height, Math.sin(angle) * radius];
    };
}

/**
 * Builds the surface of a circular tube swept along a curve.
 *
 * The tube's frame is built from the path tangent against a fixed up vector, which is stable for
 * the gently curving paths a spout and handle follow.
 *
 * @param path - The tube's centre line, as a cubic Bézier control polygon.
 * @param radii - The radius at the start and end of the path.
 * @returns A surface where `u` runs along the path and `v` runs around the tube.
 */
export function createTube(path: Vector3[], radii: [number, number]): ParametricSurface {
    const step = 1e-3;

    return (u, v) => {
        const centre = samplePath(path, u);
        const ahead = samplePath(path, Math.min(1, u + step));
        const behind = samplePath(path, Math.max(0, u - step));
        const tangent = vec3Normalize([
            ahead[0] - behind[0],
            ahead[1] - behind[1],
            ahead[2] - behind[2],
        ]);

        // The paths lie in the XY plane, so Z is always perpendicular to the tangent.
        const side: Vector3 = [0, 0, 1];
        const normal = vec3Normalize([
            tangent[1] * side[2] - tangent[2] * side[1],
            tangent[2] * side[0] - tangent[0] * side[2],
            tangent[0] * side[1] - tangent[1] * side[0],
        ]);

        const radius = radii[0] + (radii[1] - radii[0]) * u;
        const angle = v * TAU;
        const cos = Math.cos(angle) * radius;
        const sin = Math.sin(angle) * radius;

        return [
            centre[0] + normal[0] * cos + side[0] * sin,
            centre[1] + normal[1] * cos + side[1] * sin,
            centre[2] + normal[2] * cos + side[2] * sin,
        ];
    };
}

/** The surface for each part of the teapot, keyed by part name. */
export const TEAPOT_SURFACES: Record<TeapotPart, ParametricSurface> = {
    body: createRevolution(BODY_PROFILE),
    lid: createRevolution(LID_PROFILE),
    knob: createRevolution(KNOB_PROFILE),
    spout: createTube(SPOUT_PATH, SPOUT_RADII),
    handle: createTube(HANDLE_PATH, HANDLE_RADII),
};

/** The order the parts are added to the scene, so hover cycling reads front to back. */
export const TEAPOT_PARTS: TeapotPart[] = ['body', 'lid', 'knob', 'spout', 'handle'];

/** A human-readable label for each part. */
export const TEAPOT_PART_LABELS: Record<TeapotPart, string> = {
    body: 'Body',
    lid: 'Lid',
    knob: 'Knob',
    spout: 'Spout',
    handle: 'Handle',
};

/** Marker type so the module's face helpers stay usable without importing from @ripl/3d. */
export type TeapotFace = Face3D;
