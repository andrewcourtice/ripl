import {
    Shape3D,
} from '../core/shape';

import type {
    Face3D,
    Shape3DOptions,
    Shape3DState,
} from '../core/shape';

import type {
    Vector3,
} from '../math/vector';

/** State interface for a cone, defining radius, height, and segment count. */
export interface ConeState extends Shape3DState {
    radius: number;
    height: number;
    segments: number;
}

/** A 3D cone shape with configurable radius, height, and segment resolution. */
export class Cone extends Shape3D<ConeState> {

    public get radius() {
        return this.getStateValue('radius');
    }

    public set radius(value) {
        this.setStateValue('radius', value);
    }

    public get height() {
        return this.getStateValue('height');
    }

    public set height(value) {
        this.setStateValue('height', value);
    }

    public get segments() {
        return this.getStateValue('segments');
    }

    public set segments(value) {
        this.setStateValue('segments', value);
    }

    constructor(options: Shape3DOptions<ConeState>) {
        super('cone', {
            segments: 16,
            ...options,
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
            const a1 = (seg / segments) * Math.PI * 2;
            const a2 = ((seg + 1) / segments) * Math.PI * 2;

            const baseA: Vector3 = [Math.cos(a1) * radius, -halfH, Math.sin(a1) * radius];
            const baseB: Vector3 = [Math.cos(a2) * radius, -halfH, Math.sin(a2) * radius];

            // Side triangle
            faces.push({
                vertices: [apex, baseB, baseA],
            });

            // Base cap
            faces.push({
                vertices: [baseCenter, baseA, baseB],
                normal: [0, -1, 0],
            });
        }

        return faces;
    }

}

/** Factory function that creates a new `Cone` instance. */
export function createCone(...options: ConstructorParameters<typeof Cone>) {
    return new Cone(...options);
}

/** Type guard that checks whether a value is a `Cone` instance. */
export function elementIsCone(value: unknown): value is Cone {
    return value instanceof Cone;
}
