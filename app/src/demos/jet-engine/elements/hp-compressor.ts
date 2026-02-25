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

export interface HPCompressorState extends Shape3DState {
    radiusFront: number;
    radiusBack: number;
    length: number;
    stages: number;
    segments: number;
}

export class HPCompressor extends Shape3D<HPCompressorState> {

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

    public get stages() {
        return this.getStateValue('stages');
    }

    public set stages(value) {
        this.setStateValue('stages', value);
    }

    public get segments() {
        return this.getStateValue('segments');
    }

    public set segments(value) {
        this.setStateValue('segments', value);
    }

    constructor(options: Shape3DOptions<HPCompressorState>) {
        super('hp-compressor', {
            radiusFront: 0.45,
            radiusBack: 0.35,
            length: 0.4,
            stages: 5,
            segments: 20,
            ...options,
        });
    }

    protected computeFaces(): Face3D[] {
        const faces: Face3D[] = [];
        const segs = this.segments;
        const stages = this.stages;
        const halfL = this.length / 2;

        for (let st = 0; st < stages; st++) {
            const t1 = st / stages;
            const t2 = (st + 1) / stages;

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

        return faces;
    }

}

export function createHPCompressor(...options: ConstructorParameters<typeof HPCompressor>) {
    return new HPCompressor(...options);
}
