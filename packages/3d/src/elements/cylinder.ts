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

/** State interface for a cylinder, defining top/bottom radii, height, and segment count. */
export interface CylinderState extends Shape3DState {
    radiusTop: number;
    radiusBottom: number;
    height: number;
    segments: number;
}

/** A 3D cylinder shape with independent top and bottom radii for truncated cones. */
export class Cylinder extends Shape3D<CylinderState> {

    public get radiusTop() {
        return this.getStateValue('radiusTop');
    }

    public set radiusTop(value) {
        this.setStateValue('radiusTop', value);
    }

    public get radiusBottom() {
        return this.getStateValue('radiusBottom');
    }

    public set radiusBottom(value) {
        this.setStateValue('radiusBottom', value);
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

    constructor(options: Shape3DOptions<CylinderState>) {
        super('cylinder', {
            segments: 16,
            ...options,
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
            const a1 = (seg / segments) * Math.PI * 2;
            const a2 = ((seg + 1) / segments) * Math.PI * 2;

            const topA: Vector3 = [Math.cos(a1) * rTop, halfH, Math.sin(a1) * rTop];
            const topB: Vector3 = [Math.cos(a2) * rTop, halfH, Math.sin(a2) * rTop];
            const botA: Vector3 = [Math.cos(a1) * rBot, -halfH, Math.sin(a1) * rBot];
            const botB: Vector3 = [Math.cos(a2) * rBot, -halfH, Math.sin(a2) * rBot];

            // Side face
            faces.push({
                vertices: [topA, topB, botB, botA],
            });

            // Top cap
            if (rTop > 0) {
                faces.push({
                    vertices: [topCenter, topA, topB],
                    normal: [0, 1, 0],
                });
            }

            // Bottom cap
            if (rBot > 0) {
                faces.push({
                    vertices: [botCenter, botB, botA],
                    normal: [0, -1, 0],
                });
            }
        }

        return faces;
    }

}

/** Factory function that creates a new `Cylinder` instance. */
export function createCylinder(...options: ConstructorParameters<typeof Cylinder>) {
    return new Cylinder(...options);
}

/** Type guard that checks whether a value is a `Cylinder` instance. */
export function elementIsCylinder(value: unknown): value is Cylinder {
    return value instanceof Cylinder;
}
