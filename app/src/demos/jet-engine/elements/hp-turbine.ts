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

export interface HPTurbineState extends Shape3DState {
    radius: number;
    length: number;
    bladeCount: number;
    bladeHeight: number;
    segments: number;
}

export class HPTurbine extends Shape3D<HPTurbineState> {

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

    constructor(options: Shape3DOptions<HPTurbineState>) {
        super('hp-turbine', {
            radius: 0.35,
            length: 0.2,
            bladeCount: 16,
            bladeHeight: 0.1,
            segments: 20,
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

        // Front & back caps
        for (let i = 0; i < segs; i++) {
            const a1 = (i / segs) * Math.PI * 2;
            const a2 = ((i + 1) / segs) * Math.PI * 2;

            faces.push({
                vertices: [
                    [0, 0, halfL],
                    [Math.cos(a1) * r, Math.sin(a1) * r, halfL],
                    [Math.cos(a2) * r, Math.sin(a2) * r, halfL],
                ],
                normal: [0, 0, 1],
            });

            faces.push({
                vertices: [
                    [0, 0, -halfL],
                    [Math.cos(a2) * r, Math.sin(a2) * r, -halfL],
                    [Math.cos(a1) * r, Math.sin(a1) * r, -halfL],
                ],
                normal: [0, 0, -1],
            });
        }

        // Internal blade ring (disc-like fins at center)
        const bh = this.bladeHeight;
        const bInner = r - bh;
        const bz = 0;

        for (let b = 0; b < this.bladeCount; b++) {
            const angle = (b / this.bladeCount) * Math.PI * 2;
            const nextAngle = ((b + 0.3) / this.bladeCount) * Math.PI * 2;

            const c0 = Math.cos(angle);
            const s0 = Math.sin(angle);
            const c1 = Math.cos(nextAngle);
            const s1 = Math.sin(nextAngle);

            const inner0: Vector3 = [c0 * bInner, s0 * bInner, bz];
            const outer0: Vector3 = [c0 * r, s0 * r, bz];
            const inner1: Vector3 = [c1 * bInner, s1 * bInner, bz];
            const outer1: Vector3 = [c1 * r, s1 * r, bz];

            faces.push({ vertices: [inner0, outer0, outer1, inner1] });
        }

        return faces;
    }

}

export function createHPTurbine(...options: ConstructorParameters<typeof HPTurbine>) {
    return new HPTurbine(...options);
}
