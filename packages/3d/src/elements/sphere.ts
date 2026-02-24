import {
    Shape3D,
} from '../core/shape3d';

import type {
    Face3D,
    Shape3DOptions,
    Shape3DState,
} from '../core/shape3d';

import type {
    Vector3,
} from '../math/vector';

export interface SphereState extends Shape3DState {
    radius: number;
    segments: number;
    rings: number;
}

export class Sphere extends Shape3D<SphereState> {

    public get radius() {
        return this.getStateValue('radius');
    }

    public set radius(value) {
        this.setStateValue('radius', value);
    }

    public get segments() {
        return this.getStateValue('segments');
    }

    public set segments(value) {
        this.setStateValue('segments', value);
    }

    public get rings() {
        return this.getStateValue('rings');
    }

    public set rings(value) {
        this.setStateValue('rings', value);
    }

    constructor(options: Shape3DOptions<SphereState>) {
        super('sphere', {
            segments: 16,
            rings: 12,
            ...options,
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
                const theta1 = (seg / segments) * Math.PI * 2;
                const theta2 = ((seg + 1) / segments) * Math.PI * 2;

                const p00 = sphereVertex(radius, phi1, theta1);
                const p10 = sphereVertex(radius, phi1, theta2);
                const p01 = sphereVertex(radius, phi2, theta1);
                const p11 = sphereVertex(radius, phi2, theta2);

                if (ring === 0) {
                    faces.push({
                        vertices: [p00, p11, p01],
                    });
                } else if (ring === rings - 1) {
                    faces.push({
                        vertices: [p00, p10, p11],
                    });
                } else {
                    faces.push({
                        vertices: [p00, p10, p11, p01],
                    });
                }
            }
        }

        return faces;
    }

}

function sphereVertex(radius: number, phi: number, theta: number): Vector3 {
    return [
        radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta),
    ];
}

export function createSphere(...options: ConstructorParameters<typeof Sphere>) {
    return new Sphere(...options);
}

export function elementIsSphere(value: unknown): value is Sphere {
    return value instanceof Sphere;
}
