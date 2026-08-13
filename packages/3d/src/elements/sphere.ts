import {
    Shape3D,
} from '../core/shape';

import type {
    Face3D,
    Shape3DOptions,
    Shape3DState,
} from '../core/shape';

import {
    vec3Scale,
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

/** State interface for a sphere, defining radius, longitudinal segments, and latitudinal rings. */
export interface SphereState extends Shape3DState {
    /** The radius of the sphere, in world units. */
    radius: number;
    /** The number of longitudinal segments around the sphere. Defaults to `16`. */
    segments: number;
    /** The number of latitudinal rings from pole to pole. Defaults to `12`. */
    rings: number;
}

/** A 3D sphere shape tessellated with configurable segments and rings. */
export class Sphere extends Shape3D<SphereState> {

    /** The radius of the sphere, in world units. */
    public get radius() {
        return this.getStateValue('radius');
    }

    public set radius(value) {
        this.setStateValue('radius', value);
    }

    /** The number of longitudinal segments around the sphere. */
    public get segments() {
        return this.getStateValue('segments');
    }

    public set segments(value) {
        this.setStateValue('segments', value);
    }

    /** The number of latitudinal rings from pole to pole. */
    public get rings() {
        return this.getStateValue('rings');
    }

    public set rings(value) {
        this.setStateValue('rings', value);
    }

    constructor(options: Shape3DOptions<SphereState>) {
        const {
            interpolators,
            ...rest
        } = options;

        super('sphere', {
            segments: 16,
            rings: 12,
            ...rest,
            interpolators: {
                radius: interpolateNumber,
                rings: interpolateNumber,
                segments: interpolateNumber,
                ...interpolators,
            },
        });
    }

    protected computeFaces(): Face3D[] {
        const faces: Face3D[] = [];
        const segments = this.segments;
        const rings = this.rings;
        const radius = this.radius;

        for (let ring = 0; ring < rings; ring++) {
            const phi1 = (ring / rings) * Math.PI;
            const phi2 = ((ring + 1) / rings) * Math.PI;

            for (let seg = 0; seg < segments; seg++) {
                const theta1 = (seg / segments) * TAU;
                const theta2 = ((seg + 1) / segments) * TAU;

                const p00 = sphereVertex(radius, phi1, theta1);
                const p10 = sphereVertex(radius, phi1, theta2);
                const p01 = sphereVertex(radius, phi2, theta1);
                const p11 = sphereVertex(radius, phi2, theta2);

                const u1 = seg / segments;
                const u2 = (seg + 1) / segments;
                const v1 = 1 - ring / rings;
                const v2 = 1 - (ring + 1) / rings;

                const uv00: Vector2 = [u1, v1];
                const uv10: Vector2 = [u2, v1];
                const uv01: Vector2 = [u1, v2];
                const uv11: Vector2 = [u2, v2];

                if (ring === 0) {
                    faces.push(sphereFace([p00, p11, p01], radius, [uv00, uv11, uv01]));
                } else if (ring === rings - 1) {
                    faces.push(sphereFace([p00, p10, p11], radius, [uv00, uv10, uv11]));
                } else {
                    faces.push(sphereFace([p00, p10, p11, p01], radius, [uv00, uv10, uv11, uv01]));
                }
            }
        }

        return faces;
    }

}

// Every point on a sphere centred at the origin has its position as its outward normal, so the
// smooth normals come free rather than needing an averaging pass over adjacent faces.
function sphereFace(vertices: Vector3[], radius: number, uvs: Vector2[]): Face3D {
    return {
        vertices,
        normals: vertices.map(vertex => vec3Scale(vertex, 1 / (radius || 1))),
        uvs,
    };
}

function sphereVertex(radius: number, phi: number, theta: number): Vector3 {
    return [
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta),
    ];
}

/** Factory function that creates a new `Sphere` instance. */
export function createSphere(...options: ConstructorParameters<typeof Sphere>) {
    return new Sphere(...options);
}

/** Type guard that checks whether a value is a `Sphere` instance. */
export function elementIsSphere(value: unknown): value is Sphere {
    return value instanceof Sphere;
}
