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

export interface CentralShaftState extends Shape3DState {
    radius: number;
    length: number;
    segments: number;
}

export class CentralShaft extends Shape3D<CentralShaftState> {

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

    public get segments() {
        return this.getStateValue('segments');
    }

    public set segments(value) {
        this.setStateValue('segments', value);
    }

    constructor(options: Shape3DOptions<CentralShaftState>) {
        super('central-shaft', {
            radius: 0.06,
            length: 3.0,
            segments: 12,
            ...options,
        });
    }

    protected computeFaces(): Face3D[] {
        const faces: Face3D[] = [];
        const segs = this.segments;
        const halfL = this.length / 2;
        const r = this.radius;

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

        // Front cap
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
        }

        // Back cap
        for (let i = 0; i < segs; i++) {
            const a1 = (i / segs) * Math.PI * 2;
            const a2 = ((i + 1) / segs) * Math.PI * 2;

            faces.push({
                vertices: [
                    [0, 0, -halfL],
                    [Math.cos(a2) * r, Math.sin(a2) * r, -halfL],
                    [Math.cos(a1) * r, Math.sin(a1) * r, -halfL],
                ],
                normal: [0, 0, -1],
            });
        }

        return faces;
    }

}

export function createCentralShaft(...options: ConstructorParameters<typeof CentralShaft>) {
    return new CentralShaft(...options);
}
