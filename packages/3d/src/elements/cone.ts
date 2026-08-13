import {
    Shape3D,
} from '../core/shape';

import type {
    Face3D,
    Shape3DOptions,
    Shape3DState,
} from '../core/shape';

import {
    vec3Add,
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

/** State interface for a cone, defining radius, height, and segment count. */
export interface ConeState extends Shape3DState {
    /** The radius of the base, in world units. */
    radius: number;
    /** The height of the cone along the Y axis, in world units. */
    height: number;
    /** The number of segments around the base. Defaults to `16`. */
    segments: number;
}

/** A 3D cone shape with configurable radius, height, and segment resolution. */
export class Cone extends Shape3D<ConeState> {

    /** The radius of the base, in world units. */
    public get radius() {
        return this.getStateValue('radius');
    }

    public set radius(value) {
        this.setStateValue('radius', value);
    }

    /** The height of the cone along the Y axis, in world units. */
    public get height() {
        return this.getStateValue('height');
    }

    public set height(value) {
        this.setStateValue('height', value);
    }

    /** The number of segments around the base. */
    public get segments() {
        return this.getStateValue('segments');
    }

    public set segments(value) {
        this.setStateValue('segments', value);
    }

    constructor(options: Shape3DOptions<ConeState>) {
        const {
            interpolators,
            ...rest
        } = options;

        super('cone', {
            segments: 16,
            ...rest,
            interpolators: {
                height: interpolateNumber,
                radius: interpolateNumber,
                segments: interpolateNumber,
                ...interpolators,
            },
        });
    }

    protected computeFaces(): Face3D[] {
        const faces: Face3D[] = [];
        const segments = this.segments;
        const halfH = this.height / 2;
        const radius = this.radius;

        const apex: Vector3 = [0, halfH, 0];
        const baseCenter: Vector3 = [0, -halfH, 0];

        for (let seg = 0; seg < segments; seg++) {
            const a1 = (seg / segments) * TAU;
            const a2 = ((seg + 1) / segments) * TAU;

            const baseA: Vector3 = [Math.cos(a1) * radius, -halfH, Math.sin(a1) * radius];
            const baseB: Vector3 = [Math.cos(a2) * radius, -halfH, Math.sin(a2) * radius];

            // Side triangle
            const slope = radius / (this.height || 1);
            const normalA = vec3Normalize([Math.cos(a1), slope, Math.sin(a1)]);
            const normalB = vec3Normalize([Math.cos(a2), slope, Math.sin(a2)]);

            faces.push({
                vertices: [apex, baseB, baseA],
                normals: [vec3Normalize(vec3Add(normalA, normalB)), normalB, normalA],
                uvs: [
                    [(seg + 0.5) / segments, 1],
                    [(seg + 1) / segments, 0],
                    [seg / segments, 0],
                ],
            });

            // Base cap
            faces.push({
                vertices: [baseCenter, baseA, baseB],
                normal: [0, -1, 0],
                uvs: [capUV(0, 0), capUV(Math.cos(a1), Math.sin(a1)), capUV(Math.cos(a2), Math.sin(a2))],
            });
        }

        return faces;
    }

}

// A cap samples the texture as a disc inscribed in the unit square, matching three.js.
function capUV(x: number, y: number): Vector2 {
    return [x * 0.5 + 0.5, y * 0.5 + 0.5];
}

/** Factory function that creates a new `Cone` instance. */
export function createCone(...options: ConstructorParameters<typeof Cone>) {
    return new Cone(...options);
}

/** Type guard that checks whether a value is a `Cone` instance. */
export function elementIsCone(value: unknown): value is Cone {
    return value instanceof Cone;
}
