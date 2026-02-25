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
            bladeCount: 12,
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

        // Hub disc (front & back)
        const hubSegs = 16;
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

        // Blades
        for (let b = 0; b < count; b++) {
            const angle = (b / count) * Math.PI * 2;
            const twist = 0.3;

            const cos0 = Math.cos(angle);
            const sin0 = Math.sin(angle);
            const cosT = Math.cos(angle + twist);
            const sinT = Math.sin(angle + twist);

            // Inner edge (at hub)
            const iL: Vector3 = [cos0 * hubR - sin0 * bw / 2, sin0 * hubR + cos0 * bw / 2, bd / 2];
            const iR: Vector3 = [cos0 * hubR + sin0 * bw / 2, sin0 * hubR - cos0 * bw / 2, bd / 2];

            // Outer edge (at blade tip, twisted)
            const oL: Vector3 = [cosT * bladeR - sinT * bw / 3, sinT * bladeR + cosT * bw / 3, -bd / 2];
            const oR: Vector3 = [cosT * bladeR + sinT * bw / 3, sinT * bladeR - cosT * bw / 3, -bd / 2];

            // Front face
            faces.push({
                vertices: [iL, iR, oR, oL],
            });

            // Back face
            faces.push({
                vertices: [oL, oR, iR, iL],
            });
        }

        return faces;
    }

}

export function createFan(...options: ConstructorParameters<typeof Fan>) {
    return new Fan(...options);
}
