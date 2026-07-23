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
            segments: 36,
            ...options,
        });
    }

    protected computeFaces(): Face3D[] {
        const faces: Face3D[] = [];
        const segs = this.segments;
        const rOuter = this.radius;
        const rInner = this.radius - this.thickness;
        const halfL = this.length / 2;
        const lipBulge = this.thickness * 1.2;
        const lipDepth = this.length * 0.2;
        const axialRings = 4;

        for (let i = 0; i < segs; i++) {
            const a1 = (i / segs) * Math.PI * 2;
            const a2 = ((i + 1) / segs) * Math.PI * 2;

            const c1 = Math.cos(a1);
            const s1 = Math.sin(a1);
            const c2 = Math.cos(a2);
            const s2 = Math.sin(a2);

            // Outer surface with axial rings and inlet lip bulge
            for (let r = 0; r < axialRings; r++) {
                const t1 = r / axialRings;
                const t2 = (r + 1) / axialRings;
                const z1 = halfL - t1 * this.length;
                const z2 = halfL - t2 * this.length;

                // Lip bulge on the first ring
                const lipFactor1 = t1 < (lipDepth / this.length) ? Math.cos(t1 / (lipDepth / this.length) * Math.PI / 2) : 0;
                const lipFactor2 = t2 < (lipDepth / this.length) ? Math.cos(t2 / (lipDepth / this.length) * Math.PI / 2) : 0;
                const ro1 = rOuter + lipBulge * lipFactor1;
                const ro2 = rOuter + lipBulge * lipFactor2;

                const of1: Vector3 = [c1 * ro1, s1 * ro1, z1];
                const of2: Vector3 = [c2 * ro1, s2 * ro1, z1];
                const ob1: Vector3 = [c1 * ro2, s1 * ro2, z2];
                const ob2: Vector3 = [c2 * ro2, s2 * ro2, z2];

                faces.push({ vertices: [of1, of2, ob2, ob1] });
            }

            // Inner surface with axial rings and inlet lip
            for (let r = 0; r < axialRings; r++) {
                const t1 = r / axialRings;
                const t2 = (r + 1) / axialRings;
                const z1 = halfL - t1 * this.length;
                const z2 = halfL - t2 * this.length;

                const lipFactor1 = t1 < (lipDepth / this.length) ? Math.cos(t1 / (lipDepth / this.length) * Math.PI / 2) : 0;
                const lipFactor2 = t2 < (lipDepth / this.length) ? Math.cos(t2 / (lipDepth / this.length) * Math.PI / 2) : 0;
                const ri1 = rInner - lipBulge * 0.5 * lipFactor1;
                const ri2 = rInner - lipBulge * 0.5 * lipFactor2;

                const if1: Vector3 = [c1 * ri1, s1 * ri1, z1];
                const if2: Vector3 = [c2 * ri1, s2 * ri1, z1];
                const ib1: Vector3 = [c1 * ri2, s1 * ri2, z2];
                const ib2: Vector3 = [c2 * ri2, s2 * ri2, z2];

                faces.push({ vertices: [ib1, ib2, if2, if1] });
            }

            // Front ring (with lip radii)
            const roFront = rOuter + lipBulge;
            const riFront = rInner - lipBulge * 0.5;

            faces.push({
                vertices: [
                    [c1 * riFront, s1 * riFront, halfL],
                    [c2 * riFront, s2 * riFront, halfL],
                    [c2 * roFront, s2 * roFront, halfL],
                    [c1 * roFront, s1 * roFront, halfL],
                ],
                normal: [0, 0, 1],
            });

            // Back ring
            faces.push({
                vertices: [
                    [c1 * rOuter, s1 * rOuter, -halfL],
                    [c2 * rOuter, s2 * rOuter, -halfL],
                    [c2 * rInner, s2 * rInner, -halfL],
                    [c1 * rInner, s1 * rInner, -halfL],
                ],
                normal: [0, 0, -1],
            });
        }

        return faces;
    }

}

export function createFanCase(...options: ConstructorParameters<typeof FanCase>) {
    return new FanCase(...options);
}
