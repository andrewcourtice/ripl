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

export interface ExhaustNozzleState extends Shape3DState {
    radiusFront: number;
    radiusBack: number;
    length: number;
    segments: number;
}

export class ExhaustNozzle extends Shape3D<ExhaustNozzleState> {

    public get radiusFront() {
        return this.getStateValue('radiusFront');
    }

    public set radiusFront(value) {
        this.setStateValue('radiusFront', value);
    }

    public get radiusBack() {
        return this.getStateValue('radiusBack');
    }

    public set radiusBack(value) {
        this.setStateValue('radiusBack', value);
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

    constructor(options: Shape3DOptions<ExhaustNozzleState>) {
        super('exhaust-nozzle', {
            radiusFront: 0.4,
            radiusBack: 0.25,
            length: 0.4,
            segments: 20,
            ...options,
        });
    }

    protected computeFaces(): Face3D[] {
        const faces: Face3D[] = [];
        const segs = this.segments;
        const halfL = this.length / 2;

        for (let i = 0; i < segs; i++) {
            const a1 = (i / segs) * Math.PI * 2;
            const a2 = ((i + 1) / segs) * Math.PI * 2;

            const c1 = Math.cos(a1);
            const s1 = Math.sin(a1);
            const c2 = Math.cos(a2);
            const s2 = Math.sin(a2);

            const rF = this.radiusFront;
            const rB = this.radiusBack;

            const f1: Vector3 = [c1 * rF, s1 * rF, halfL];
            const f2: Vector3 = [c2 * rF, s2 * rF, halfL];
            const b1: Vector3 = [c1 * rB, s1 * rB, -halfL];
            const b2: Vector3 = [c2 * rB, s2 * rB, -halfL];

            faces.push({ vertices: [f1, f2, b2, b1] });
        }

        // Front cap (annular — open center would be realistic, but we cap it for hit-testing)
        const rF = this.radiusFront;
        for (let i = 0; i < segs; i++) {
            const a1 = (i / segs) * Math.PI * 2;
            const a2 = ((i + 1) / segs) * Math.PI * 2;

            faces.push({
                vertices: [
                    [0, 0, halfL],
                    [Math.cos(a1) * rF, Math.sin(a1) * rF, halfL],
                    [Math.cos(a2) * rF, Math.sin(a2) * rF, halfL],
                ],
                normal: [0, 0, 1],
            });
        }

        // Back cap
        const rB = this.radiusBack;
        for (let i = 0; i < segs; i++) {
            const a1 = (i / segs) * Math.PI * 2;
            const a2 = ((i + 1) / segs) * Math.PI * 2;

            faces.push({
                vertices: [
                    [0, 0, -halfL],
                    [Math.cos(a2) * rB, Math.sin(a2) * rB, -halfL],
                    [Math.cos(a1) * rB, Math.sin(a1) * rB, -halfL],
                ],
                normal: [0, 0, -1],
            });
        }

        return faces;
    }

}

export function createExhaustNozzle(...options: ConstructorParameters<typeof ExhaustNozzle>) {
    return new ExhaustNozzle(...options);
}
