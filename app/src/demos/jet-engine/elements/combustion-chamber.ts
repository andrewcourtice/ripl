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

export interface CombustionChamberState extends Shape3DState {
    radiusFront: number;
    radiusBack: number;
    radiusBulge: number;
    length: number;
    segments: number;
    rings: number;
}

export class CombustionChamber extends Shape3D<CombustionChamberState> {

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

    public get radiusBulge() {
        return this.getStateValue('radiusBulge');
    }

    public set radiusBulge(value) {
        this.setStateValue('radiusBulge', value);
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

    public get rings() {
        return this.getStateValue('rings');
    }

    public set rings(value) {
        this.setStateValue('rings', value);
    }

    constructor(options: Shape3DOptions<CombustionChamberState>) {
        super('combustion-chamber', {
            radiusFront: 0.35,
            radiusBack: 0.35,
            radiusBulge: 0.48,
            length: 0.45,
            segments: 32,
            rings: 12,
            ...options,
        });
    }

    private radiusAt(t: number): number {
        // Barrel profile: bulge in the middle using a sine curve
        const endRadius = t < 0.5 ? this.radiusFront : this.radiusBack;
        const blend = Math.sin(t * Math.PI);
        return endRadius + (this.radiusBulge - endRadius) * blend;
    }

    protected computeFaces(): Face3D[] {
        const faces: Face3D[] = [];
        const segs = this.segments;
        const rings = this.rings;
        const halfL = this.length / 2;
        const injectorCount = 10;
        const injectorRadius = 0.02;
        const injectorHeight = 0.025;
        const injectorSegs = 6;

        for (let r = 0; r < rings; r++) {
            const t1 = r / rings;
            const t2 = (r + 1) / rings;

            const r1 = this.radiusAt(t1);
            const r2 = this.radiusAt(t2);
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

        // Fuel injector bosses around the front ring
        const injZ = halfL - this.length * 0.15;
        const injBaseR = this.radiusAt(0.15);

        for (let n = 0; n < injectorCount; n++) {
            const angle = (n / injectorCount) * Math.PI * 2;
            const ca = Math.cos(angle);
            const sa = Math.sin(angle);

            // Each boss is a small hexagonal prism protruding radially
            for (let s = 0; s < injectorSegs; s++) {
                const la1 = (s / injectorSegs) * Math.PI * 2;
                const la2 = ((s + 1) / injectorSegs) * Math.PI * 2;

                // Local offsets perpendicular to radial direction
                const perp1Y = Math.cos(la1) * injectorRadius;
                const perp1Z = Math.sin(la1) * injectorRadius;
                const perp2Y = Math.cos(la2) * injectorRadius;
                const perp2Z = Math.sin(la2) * injectorRadius;

                // Inner vertices (at surface)
                const i1: Vector3 = [ca * injBaseR + (-sa) * perp1Y, sa * injBaseR + ca * perp1Y, injZ + perp1Z];
                const i2: Vector3 = [ca * injBaseR + (-sa) * perp2Y, sa * injBaseR + ca * perp2Y, injZ + perp2Z];

                // Outer vertices (protruding)
                const o1: Vector3 = [ca * (injBaseR + injectorHeight) + (-sa) * perp1Y, sa * (injBaseR + injectorHeight) + ca * perp1Y, injZ + perp1Z];
                const o2: Vector3 = [ca * (injBaseR + injectorHeight) + (-sa) * perp2Y, sa * (injBaseR + injectorHeight) + ca * perp2Y, injZ + perp2Z];

                faces.push({ vertices: [i1, i2, o2, o1] });
            }

            // Boss cap
            const capVerts: Vector3[] = [];
            for (let s = 0; s < injectorSegs; s++) {
                const la = (s / injectorSegs) * Math.PI * 2;
                const py = Math.cos(la) * injectorRadius;
                const pz = Math.sin(la) * injectorRadius;
                capVerts.push([ca * (injBaseR + injectorHeight) + (-sa) * py, sa * (injBaseR + injectorHeight) + ca * py, injZ + pz]);
            }

            faces.push({ vertices: capVerts });
        }

        return faces;
    }

}

export function createCombustionChamber(...options: ConstructorParameters<typeof CombustionChamber>) {
    return new CombustionChamber(...options);
}
