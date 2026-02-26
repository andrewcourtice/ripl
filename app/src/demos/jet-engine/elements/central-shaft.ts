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
            segments: 24,
            ...options,
        });
    }

    protected computeFaces(): Face3D[] {
        const faces: Face3D[] = [];
        const segs = this.segments;
        const halfL = this.length / 2;
        const r = this.radius;
        const axialRings = 4;
        const collarCount = 3;
        const collarRadius = r * 1.8;
        const collarWidth = 0.03;

        // Shaft body with axial rings
        for (let ring = 0; ring < axialRings; ring++) {
            const t1 = ring / axialRings;
            const t2 = (ring + 1) / axialRings;
            const z1 = halfL - t1 * this.length;
            const z2 = halfL - t2 * this.length;

            for (let i = 0; i < segs; i++) {
                const a1 = (i / segs) * Math.PI * 2;
                const a2 = ((i + 1) / segs) * Math.PI * 2;

                const c1 = Math.cos(a1);
                const s1 = Math.sin(a1);
                const c2 = Math.cos(a2);
                const s2 = Math.sin(a2);

                const f1: Vector3 = [c1 * r, s1 * r, z1];
                const f2: Vector3 = [c2 * r, s2 * r, z1];
                const b1: Vector3 = [c1 * r, s1 * r, z2];
                const b2: Vector3 = [c2 * r, s2 * r, z2];

                faces.push({ vertices: [f1, f2, b2, b1] });
            }
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

        // Bearing collars — raised ring bumps along the shaft
        for (let c = 0; c < collarCount; c++) {
            const collarZ = halfL - this.length * ((c + 1) / (collarCount + 1));
            const halfCW = collarWidth / 2;

            for (let i = 0; i < segs; i++) {
                const a1 = (i / segs) * Math.PI * 2;
                const a2 = ((i + 1) / segs) * Math.PI * 2;

                const c1 = Math.cos(a1);
                const s1 = Math.sin(a1);
                const c2 = Math.cos(a2);
                const s2 = Math.sin(a2);

                // Outer collar surface
                const cf1: Vector3 = [c1 * collarRadius, s1 * collarRadius, collarZ + halfCW];
                const cf2: Vector3 = [c2 * collarRadius, s2 * collarRadius, collarZ + halfCW];
                const cb1: Vector3 = [c1 * collarRadius, s1 * collarRadius, collarZ - halfCW];
                const cb2: Vector3 = [c2 * collarRadius, s2 * collarRadius, collarZ - halfCW];

                faces.push({ vertices: [cf1, cf2, cb2, cb1] });

                // Front annular face
                faces.push({
                    vertices: [
                        [c1 * r, s1 * r, collarZ + halfCW],
                        [c2 * r, s2 * r, collarZ + halfCW],
                        [c2 * collarRadius, s2 * collarRadius, collarZ + halfCW],
                        [c1 * collarRadius, s1 * collarRadius, collarZ + halfCW],
                    ],
                    normal: [0, 0, 1],
                });

                // Back annular face
                faces.push({
                    vertices: [
                        [c1 * collarRadius, s1 * collarRadius, collarZ - halfCW],
                        [c2 * collarRadius, s2 * collarRadius, collarZ - halfCW],
                        [c2 * r, s2 * r, collarZ - halfCW],
                        [c1 * r, s1 * r, collarZ - halfCW],
                    ],
                    normal: [0, 0, -1],
                });
            }
        }

        return faces;
    }

}

export function createCentralShaft(...options: ConstructorParameters<typeof CentralShaft>) {
    return new CentralShaft(...options);
}
