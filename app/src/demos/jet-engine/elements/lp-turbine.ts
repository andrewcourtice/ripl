import {
    Shape3D,
} from '@ripl/3d';

import type {
    Face3D,
    Shape3DOptions,
    Shape3DState,
} from '@ripl/3d';

import type {
    Vector3,
} from '@ripl/3d';

export interface LPTurbineState extends Shape3DState {
    radius: number;
    length: number;
    bladeCount: number;
    bladeHeight: number;
    segments: number;
}

export class LPTurbine extends Shape3D<LPTurbineState> {

    public get radius() {
        return this.getStateValue('radius');
    }

    public set radius(value) {
        this.setStateValue('radius', value);
    }

    public get length() {
        return this.getStateValue('length');
    }

    public set length(value) {
        this.setStateValue('length', value);
    }

    public get bladeCount() {
        return this.getStateValue('bladeCount');
    }

    public set bladeCount(value) {
        this.setStateValue('bladeCount', value);
    }

    public get bladeHeight() {
        return this.getStateValue('bladeHeight');
    }

    public set bladeHeight(value) {
        this.setStateValue('bladeHeight', value);
    }

    public get segments() {
        return this.getStateValue('segments');
    }

    public set segments(value) {
        this.setStateValue('segments', value);
    }

    constructor(options: Shape3DOptions<LPTurbineState>) {
        super('lp-turbine', {
            radius: 0.4,
            length: 0.25,
            bladeCount: 20,
            bladeHeight: 0.12,
            segments: 32,
            ...options,
        });
    }

    protected computeFaces(): Face3D[] {
        const faces: Face3D[] = [];
        const segs = this.segments;
        const halfL = this.length / 2;
        const r = this.radius;

        // Outer cylinder
        for (let i = 0; i < segs; i++) {
            const a1 = (i / segs) * Math.PI * 2;
            const a2 = ((i + 1) / segs) * Math.PI * 2;

            const c1 = Math.cos(a1);
            const s1 = Math.sin(a1);
            const c2 = Math.cos(a2);
            const s2 = Math.sin(a2);

            const f1: Vector3 = [c1 * r, s1 * r, halfL];
            const f2: Vector3 = [c2 * r, s2 * r, halfL];
            const b1: Vector3 = [c1 * r, s1 * r, -halfL];
            const b2: Vector3 = [c2 * r, s2 * r, -halfL];

            faces.push({ vertices: [f1, f2, b2, b1] });
        }

        // Front & back caps (annular — hub to outer)
        const bh = this.bladeHeight;
        const bInner = r - bh;

        for (let i = 0; i < segs; i++) {
            const a1 = (i / segs) * Math.PI * 2;
            const a2 = ((i + 1) / segs) * Math.PI * 2;
            const c1 = Math.cos(a1);
            const s1 = Math.sin(a1);
            const c2 = Math.cos(a2);
            const s2 = Math.sin(a2);

            // Front annular cap
            faces.push({
                vertices: [
                    [c1 * bInner, s1 * bInner, halfL],
                    [c2 * bInner, s2 * bInner, halfL],
                    [c2 * r, s2 * r, halfL],
                    [c1 * r, s1 * r, halfL],
                ],
                normal: [0, 0, 1],
            });

            // Back annular cap
            faces.push({
                vertices: [
                    [c1 * r, s1 * r, -halfL],
                    [c2 * r, s2 * r, -halfL],
                    [c2 * bInner, s2 * bInner, -halfL],
                    [c1 * bInner, s1 * bInner, -halfL],
                ],
                normal: [0, 0, -1],
            });
        }

        // Inner hub cylinder
        for (let i = 0; i < segs; i++) {
            const a1 = (i / segs) * Math.PI * 2;
            const a2 = ((i + 1) / segs) * Math.PI * 2;
            const c1 = Math.cos(a1);
            const s1 = Math.sin(a1);
            const c2 = Math.cos(a2);
            const s2 = Math.sin(a2);

            faces.push({
                vertices: [
                    [c1 * bInner, s1 * bInner, -halfL],
                    [c2 * bInner, s2 * bInner, -halfL],
                    [c2 * bInner, s2 * bInner, halfL],
                    [c1 * bInner, s1 * bInner, halfL],
                ],
            });
        }

        // 3D turbine blades spanning the full length
        const bladeThickness = 0.008;

        for (let b = 0; b < this.bladeCount; b++) {
            const angle = (b / this.bladeCount) * Math.PI * 2;
            const nextAngle = ((b + 0.35) / this.bladeCount) * Math.PI * 2;

            const c0 = Math.cos(angle);
            const s0 = Math.sin(angle);
            const c1 = Math.cos(nextAngle);
            const s1 = Math.sin(nextAngle);

            const halfBT = bladeThickness / 2;

            // Front face of blade
            const ff1: Vector3 = [c0 * bInner, s0 * bInner, halfBT];
            const ff2: Vector3 = [c0 * r, s0 * r, halfBT];
            const ff3: Vector3 = [c1 * r, s1 * r, halfBT];
            const ff4: Vector3 = [c1 * bInner, s1 * bInner, halfBT];
            faces.push({ vertices: [ff1, ff2, ff3, ff4] });

            // Back face of blade
            const bf1: Vector3 = [c0 * bInner, s0 * bInner, -halfBT];
            const bf2: Vector3 = [c0 * r, s0 * r, -halfBT];
            const bf3: Vector3 = [c1 * r, s1 * r, -halfBT];
            const bf4: Vector3 = [c1 * bInner, s1 * bInner, -halfBT];
            faces.push({ vertices: [bf4, bf3, bf2, bf1] });

            // Leading edge
            faces.push({ vertices: [ff1, bf1, bf2, ff2] });

            // Trailing edge
            faces.push({ vertices: [ff3, bf3, bf4, ff4] });

            // Tip edge (outer rim)
            faces.push({ vertices: [ff2, bf2, bf3, ff3] });
        }

        return faces;
    }

}

export function createLPTurbine(...options: ConstructorParameters<typeof LPTurbine>) {
    return new LPTurbine(...options);
}
