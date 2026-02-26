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
            segments: 32,
            ...options,
        });
    }

    protected computeFaces(): Face3D[] {
        const faces: Face3D[] = [];
        const segs = this.segments;
        const halfL = this.length / 2;
        const axialRings = 4;
        const chevronCount = 12;
        const chevronDepth = 0.04;

        // Multi-ring cone surface
        for (let ring = 0; ring < axialRings; ring++) {
            const t1 = ring / axialRings;
            const t2 = (ring + 1) / axialRings;

            const r1 = this.radiusFront + (this.radiusBack - this.radiusFront) * t1;
            const r2 = this.radiusFront + (this.radiusBack - this.radiusFront) * t2;
            const z1 = halfL - t1 * this.length;
            const z2 = halfL - t2 * this.length;

            for (let i = 0; i < segs; i++) {
                const a1 = (i / segs) * Math.PI * 2;
                const a2 = ((i + 1) / segs) * Math.PI * 2;

                const c1 = Math.cos(a1);
                const s1 = Math.sin(a1);
                const c2 = Math.cos(a2);
                const s2 = Math.sin(a2);

                const f1: Vector3 = [c1 * r1, s1 * r1, z1];
                const f2: Vector3 = [c2 * r1, s2 * r1, z1];
                const b1: Vector3 = [c1 * r2, s1 * r2, z2];
                const b2: Vector3 = [c2 * r2, s2 * r2, z2];

                faces.push({ vertices: [f1, f2, b2, b1] });
            }
        }

        // Front cap
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

        // Chevron serrations at trailing edge
        for (let ch = 0; ch < chevronCount; ch++) {
            const aMid = ((ch + 0.5) / chevronCount) * Math.PI * 2;
            const aLeft = (ch / chevronCount) * Math.PI * 2;
            const aRight = ((ch + 1) / chevronCount) * Math.PI * 2;

            const cM = Math.cos(aMid);
            const sM = Math.sin(aMid);
            const cL = Math.cos(aLeft);
            const sL = Math.sin(aLeft);
            const cR = Math.cos(aRight);
            const sR = Math.sin(aRight);

            // Tip of chevron extends further back
            const tipZ = -halfL - chevronDepth;
            const rTip = rB * 0.92;

            const baseL: Vector3 = [cL * rB, sL * rB, -halfL];
            const baseR: Vector3 = [cR * rB, sR * rB, -halfL];
            const tip: Vector3 = [cM * rTip, sM * rTip, tipZ];

            // Outer face of chevron
            faces.push({ vertices: [baseL, baseR, tip] });

            // Inner face of chevron
            faces.push({ vertices: [tip, baseR, baseL] });
        }

        return faces;
    }

}

export function createExhaustNozzle(...options: ConstructorParameters<typeof ExhaustNozzle>) {
    return new ExhaustNozzle(...options);
}
