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

export interface FanState extends Shape3DState {
    hubRadius: number;
    bladeRadius: number;
    bladeCount: number;
    bladeWidth: number;
    bladeDepth: number;
}

export class Fan extends Shape3D<FanState> {

    public get hubRadius() {
        return this.getStateValue('hubRadius');
    }

    public set hubRadius(value) {
        this.setStateValue('hubRadius', value);
    }

    public get bladeRadius() {
        return this.getStateValue('bladeRadius');
    }

    public set bladeRadius(value) {
        this.setStateValue('bladeRadius', value);
    }

    public get bladeCount() {
        return this.getStateValue('bladeCount');
    }

    public set bladeCount(value) {
        this.setStateValue('bladeCount', value);
    }

    public get bladeWidth() {
        return this.getStateValue('bladeWidth');
    }

    public set bladeWidth(value) {
        this.setStateValue('bladeWidth', value);
    }

    public get bladeDepth() {
        return this.getStateValue('bladeDepth');
    }

    public set bladeDepth(value) {
        this.setStateValue('bladeDepth', value);
    }

    constructor(options: Shape3DOptions<FanState>) {
        super('fan', {
            hubRadius: 0.15,
            bladeRadius: 0.8,
            bladeCount: 18,
            bladeWidth: 0.18,
            bladeDepth: 0.06,
            ...options,
        });
    }

    protected computeFaces(): Face3D[] {
        const faces: Face3D[] = [];
        const count = this.bladeCount;
        const hubR = this.hubRadius;
        const bladeR = this.bladeRadius;
        const bw = this.bladeWidth;
        const bd = this.bladeDepth;
        const bladeThickness = 0.012;
        const spanDivisions = 4;

        // Hub disc (front & back)
        const hubSegs = 32;
        for (let i = 0; i < hubSegs; i++) {
            const a1 = (i / hubSegs) * Math.PI * 2;
            const a2 = ((i + 1) / hubSegs) * Math.PI * 2;

            const hf1: Vector3 = [Math.cos(a1) * hubR, Math.sin(a1) * hubR, bd / 2];
            const hf2: Vector3 = [Math.cos(a2) * hubR, Math.sin(a2) * hubR, bd / 2];
            const hb1: Vector3 = [Math.cos(a1) * hubR, Math.sin(a1) * hubR, -bd / 2];
            const hb2: Vector3 = [Math.cos(a2) * hubR, Math.sin(a2) * hubR, -bd / 2];

            // Front cap
            faces.push({
                vertices: [[0, 0, bd / 2], hf1, hf2],
                normal: [0, 0, 1],
            });

            // Back cap
            faces.push({
                vertices: [[0, 0, -bd / 2], hb2, hb1],
                normal: [0, 0, -1],
            });

            // Hub rim
            faces.push({
                vertices: [hf1, hb1, hb2, hf2],
            });
        }

        // Blades with spanwise subdivision and thickness
        for (let b = 0; b < count; b++) {
            const angle = (b / count) * Math.PI * 2;
            const twist = 0.3;

            for (let s = 0; s < spanDivisions; s++) {
                const t1 = s / spanDivisions;
                const t2 = (s + 1) / spanDivisions;

                const r1 = hubR + (bladeR - hubR) * t1;
                const r2 = hubR + (bladeR - hubR) * t2;
                const w1 = bw * (1 - t1 * 0.4);
                const w2 = bw * (1 - t2 * 0.4);
                const z1 = bd / 2 - t1 * (bd);
                const z2 = bd / 2 - t2 * (bd);
                const tw1 = twist * t1;
                const tw2 = twist * t2;
                const halfThick = bladeThickness / 2;

                const ca1 = Math.cos(angle + tw1);
                const sa1 = Math.sin(angle + tw1);
                const ca2 = Math.cos(angle + tw2);
                const sa2 = Math.sin(angle + tw2);

                // Front surface (top)
                const f1L: Vector3 = [ca1 * r1 - sa1 * w1 / 2, sa1 * r1 + ca1 * w1 / 2, z1 + halfThick];
                const f1R: Vector3 = [ca1 * r1 + sa1 * w1 / 2, sa1 * r1 - ca1 * w1 / 2, z1 + halfThick];
                const f2L: Vector3 = [ca2 * r2 - sa2 * w2 / 2, sa2 * r2 + ca2 * w2 / 2, z2 + halfThick];
                const f2R: Vector3 = [ca2 * r2 + sa2 * w2 / 2, sa2 * r2 - ca2 * w2 / 2, z2 + halfThick];

                // Back surface (bottom)
                const b1L: Vector3 = [ca1 * r1 - sa1 * w1 / 2, sa1 * r1 + ca1 * w1 / 2, z1 - halfThick];
                const b1R: Vector3 = [ca1 * r1 + sa1 * w1 / 2, sa1 * r1 - ca1 * w1 / 2, z1 - halfThick];
                const b2L: Vector3 = [ca2 * r2 - sa2 * w2 / 2, sa2 * r2 + ca2 * w2 / 2, z2 - halfThick];
                const b2R: Vector3 = [ca2 * r2 + sa2 * w2 / 2, sa2 * r2 - ca2 * w2 / 2, z2 - halfThick];

                // Front face
                faces.push({ vertices: [f1L, f1R, f2R, f2L] });

                // Back face
                faces.push({ vertices: [b2L, b2R, b1R, b1L] });

                // Leading edge
                faces.push({ vertices: [f1L, f2L, b2L, b1L] });

                // Trailing edge
                faces.push({ vertices: [f2R, f1R, b1R, b2R] });

                // Tip cap (on outermost strip)
                if (s === spanDivisions - 1) {
                    faces.push({ vertices: [f2L, f2R, b2R, b2L] });
                }

                // Root cap (on innermost strip)
                if (s === 0) {
                    faces.push({ vertices: [f1R, f1L, b1L, b1R] });
                }
            }
        }

        return faces;
    }

}

export function createFan(...options: ConstructorParameters<typeof Fan>) {
    return new Fan(...options);
}
