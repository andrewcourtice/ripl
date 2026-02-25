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

export interface FanCaseState extends Shape3DState {
    radius: number;
    length: number;
    thickness: number;
    segments: number;
}

export class FanCase extends Shape3D<FanCaseState> {

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

    public get thickness() {
        return this.getStateValue('thickness');
    }

    public set thickness(value) {
        this.setStateValue('thickness', value);
    }

    public get segments() {
        return this.getStateValue('segments');
    }

    public set segments(value) {
        this.setStateValue('segments', value);
    }

    constructor(options: Shape3DOptions<FanCaseState>) {
        super('fan-case', {
            radius: 0.85,
            length: 0.3,
            thickness: 0.04,
            segments: 24,
            ...options,
        });
    }

    protected computeFaces(): Face3D[] {
        const faces: Face3D[] = [];
        const segs = this.segments;
        const rOuter = this.radius;
        const rInner = this.radius - this.thickness;
        const halfL = this.length / 2;

        for (let i = 0; i < segs; i++) {
            const a1 = (i / segs) * Math.PI * 2;
            const a2 = ((i + 1) / segs) * Math.PI * 2;

            const c1 = Math.cos(a1);
            const s1 = Math.sin(a1);
            const c2 = Math.cos(a2);
            const s2 = Math.sin(a2);

            // Outer surface
            const of1: Vector3 = [c1 * rOuter, s1 * rOuter, halfL];
            const of2: Vector3 = [c2 * rOuter, s2 * rOuter, halfL];
            const ob1: Vector3 = [c1 * rOuter, s1 * rOuter, -halfL];
            const ob2: Vector3 = [c2 * rOuter, s2 * rOuter, -halfL];

            faces.push({ vertices: [of1, of2, ob2, ob1] });

            // Inner surface
            const if1: Vector3 = [c1 * rInner, s1 * rInner, halfL];
            const if2: Vector3 = [c2 * rInner, s2 * rInner, halfL];
            const ib1: Vector3 = [c1 * rInner, s1 * rInner, -halfL];
            const ib2: Vector3 = [c2 * rInner, s2 * rInner, -halfL];

            faces.push({ vertices: [ib1, ib2, if2, if1] });

            // Front ring
            faces.push({
                vertices: [if1, if2, of2, of1],
                normal: [0, 0, 1],
            });

            // Back ring
            faces.push({
                vertices: [ob1, ob2, ib2, ib1],
                normal: [0, 0, -1],
            });
        }

        return faces;
    }

}

export function createFanCase(...options: ConstructorParameters<typeof FanCase>) {
    return new FanCase(...options);
}
