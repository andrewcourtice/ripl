import {
    Shape3D,
} from '../core/shape';

import type {
    Face3D,
    Shape3DOptions,
    Shape3DState,
} from '../core/shape';

import {
    vec3Normalize,
} from '../math/vector';

import {
    TAU,
} from '@ripl/core';

import type {
    Vector2,
} from '../math/vector2';

import type {
    Vector3,
} from '../math/vector';

import {
    interpolateNumber,
} from '@ripl/core';

/** State interface for a cylinder, defining top/bottom radii, height, and segment count. */
export interface CylinderState extends Shape3DState {
    /** The radius of the top cap, in world units. A value of `0` produces a cone-like point. */
    radiusTop: number;
    /** The radius of the bottom cap, in world units. A value of `0` produces a cone-like point. */
    radiusBottom: number;
    /** The height of the cylinder along the Y axis, in world units. */
    height: number;
    /** The number of segments around the circumference. Defaults to `16`. */
    segments: number;
}

/** A 3D cylinder shape with independent top and bottom radii for truncated cones. */
export class Cylinder extends Shape3D<CylinderState> {

    /** The radius of the top cap, in world units. */
    public get radiusTop() {
        return this.getStateValue('radiusTop');
    }

    public set radiusTop(value) {
        this.setStateValue('radiusTop', value);
    }

    /** The radius of the bottom cap, in world units. */
    public get radiusBottom() {
        return this.getStateValue('radiusBottom');
    }

    public set radiusBottom(value) {
        this.setStateValue('radiusBottom', value);
    }

    /** The height of the cylinder along the Y axis, in world units. */
    public get height() {
        return this.getStateValue('height');
    }

    public set height(value) {
        this.setStateValue('height', value);
    }

    /** The number of segments around the circumference. */
    public get segments() {
        return this.getStateValue('segments');
    }

    public set segments(value) {
        this.setStateValue('segments', value);
    }

    constructor(options: Shape3DOptions<CylinderState>) {
        const {
            interpolators,
            ...rest
        } = options;

        super('cylinder', {
            segments: 16,
            ...rest,
            interpolators: {
                height: interpolateNumber,
                radiusBottom: interpolateNumber,
                radiusTop: interpolateNumber,
                segments: interpolateNumber,
                ...interpolators,
            },
        });
    }

    protected computeFaces(): Face3D[] {
        const faces: Face3D[] = [];
        const segments = this.segments;
        const halfH = this.height / 2;
        const rTop = this.radiusTop;
        const rBot = this.radiusBottom;

        const topCenter: Vector3 = [0, halfH, 0];
        const botCenter: Vector3 = [0, -halfH, 0];

        for (let seg = 0; seg < segments; seg++) {
            const a1 = (seg / segments) * TAU;
            const a2 = ((seg + 1) / segments) * TAU;

            const topA: Vector3 = [Math.cos(a1) * rTop, halfH, Math.sin(a1) * rTop];
            const topB: Vector3 = [Math.cos(a2) * rTop, halfH, Math.sin(a2) * rTop];
            const botA: Vector3 = [Math.cos(a1) * rBot, -halfH, Math.sin(a1) * rBot];
            const botB: Vector3 = [Math.cos(a2) * rBot, -halfH, Math.sin(a2) * rBot];

            // Side face
            const normalA = sideNormal(a1, rTop, rBot, this.height);
            const normalB = sideNormal(a2, rTop, rBot, this.height);

            const uTop = seg / segments;
            const uBot = (seg + 1) / segments;

            faces.push({
                vertices: [topA, topB, botB, botA],
                normals: [normalA, normalB, normalB, normalA],
                uvs: [
                    [uTop, 1],
                    [uBot, 1],
                    [uBot, 0],
                    [uTop, 0],
                ],
            });

            // Top cap
            if (rTop > 0) {
                faces.push({
                    vertices: [topCenter, topA, topB],
                    normal: [0, 1, 0],
                    uvs: [capUV(0, 0), capUV(Math.cos(a1), Math.sin(a1)), capUV(Math.cos(a2), Math.sin(a2))],
                });
            }

            // Bottom cap
            if (rBot > 0) {
                faces.push({
                    vertices: [botCenter, botB, botA],
                    normal: [0, -1, 0],
                    uvs: [capUV(0, 0), capUV(Math.cos(a2), Math.sin(a2)), capUV(Math.cos(a1), Math.sin(a1))],
                });
            }
        }

        return faces;
    }

}

// A cap samples the texture as a disc inscribed in the unit square, matching three.js.
function capUV(x: number, y: number): Vector2 {
    return [x * 0.5 + 0.5, y * 0.5 + 0.5];
}

// The side of a tapered cylinder is a cone frustum, so its normal tilts by the slope of the taper
// rather than pointing straight out — a radial normal would light a cone-like cylinder as a tube.
function sideNormal(angle: number, radiusTop: number, radiusBottom: number, height: number): Vector3 {
    const slope = (radiusBottom - radiusTop) / (height || 1);

    return vec3Normalize([Math.cos(angle), slope, Math.sin(angle)]);
}

/** Factory function that creates a new `Cylinder` instance. */
export function createCylinder(...options: ConstructorParameters<typeof Cylinder>) {
    return new Cylinder(...options);
}

/** Type guard that checks whether a value is a `Cylinder` instance. */
export function elementIsCylinder(value: unknown): value is Cylinder {
    return value instanceof Cylinder;
}
