import {
    Shape3D,
} from '@ripl/3d';

import type {
    Face3D,
    Shape3DOptions,
    Shape3DState,
} from '@ripl/3d';

export interface ValveCoverState extends Shape3DState {
    coverWidth: number;
    coverHeight: number;
    coverDepth: number;
    archHeight: number;
    archDivisions: number;
    fillerCapRadius: number;
    fillerCapHeight: number;
    fillerCapSegments: number;
    sparkWellRadius: number;
    sparkWellHeight: number;
    sparkWellSegments: number;
    boreSpacing: number;
}

export class ValveCover extends Shape3D<ValveCoverState> {

    public get coverWidth() {
        return this.getStateValue('coverWidth');
    }

    public set coverWidth(value) {
        this.setStateValue('coverWidth', value);
    }

    public get coverHeight() {
        return this.getStateValue('coverHeight');
    }

    public set coverHeight(value) {
        this.setStateValue('coverHeight', value);
    }

    public get coverDepth() {
        return this.getStateValue('coverDepth');
    }

    public set coverDepth(value) {
        this.setStateValue('coverDepth', value);
    }

    public get archHeight() {
        return this.getStateValue('archHeight');
    }

    public set archHeight(value) {
        this.setStateValue('archHeight', value);
    }

    public get archDivisions() {
        return this.getStateValue('archDivisions');
    }

    public set archDivisions(value) {
        this.setStateValue('archDivisions', value);
    }

    public get fillerCapRadius() {
        return this.getStateValue('fillerCapRadius');
    }

    public set fillerCapRadius(value) {
        this.setStateValue('fillerCapRadius', value);
    }

    public get fillerCapHeight() {
        return this.getStateValue('fillerCapHeight');
    }

    public set fillerCapHeight(value) {
        this.setStateValue('fillerCapHeight', value);
    }

    public get fillerCapSegments() {
        return this.getStateValue('fillerCapSegments');
    }

    public set fillerCapSegments(value) {
        this.setStateValue('fillerCapSegments', value);
    }

    public get sparkWellRadius() {
        return this.getStateValue('sparkWellRadius');
    }

    public set sparkWellRadius(value) {
        this.setStateValue('sparkWellRadius', value);
    }

    public get sparkWellHeight() {
        return this.getStateValue('sparkWellHeight');
    }

    public set sparkWellHeight(value) {
        this.setStateValue('sparkWellHeight', value);
    }

    public get sparkWellSegments() {
        return this.getStateValue('sparkWellSegments');
    }

    public set sparkWellSegments(value) {
        this.setStateValue('sparkWellSegments', value);
    }

    public get boreSpacing() {
        return this.getStateValue('boreSpacing');
    }

    public set boreSpacing(value) {
        this.setStateValue('boreSpacing', value);
    }

    constructor(options: Shape3DOptions<ValveCoverState>) {
        super('valve-cover', {
            coverWidth: 0.36,
            coverHeight: 0.06,
            coverDepth: 1.22,
            archHeight: 0.025,
            archDivisions: 6,
            fillerCapRadius: 0.025,
            fillerCapHeight: 0.03,
            fillerCapSegments: 12,
            sparkWellRadius: 0.015,
            sparkWellHeight: 0.025,
            sparkWellSegments: 10,
            boreSpacing: 0.28,
            ...options,
        });
    }

    protected computeFaces(): Face3D[] {
        const faces: Face3D[] = [];
        const cw = this.coverWidth;
        const ch = this.coverHeight;
        const cd = this.coverDepth;
        const ah = this.archHeight;
        const ad = this.archDivisions;
        const bs = this.boreSpacing;

        const halfW = cw / 2;
        const halfD = cd / 2;

        // Domed rectangular shell with arch
        // Generate arched top surface as subdivided quads
        const zSteps = ad * 2;

        for (let zi = 0; zi < zSteps; zi++) {
            const zt1 = zi / zSteps;
            const zt2 = (zi + 1) / zSteps;
            const z1 = -halfD + zt1 * cd;
            const z2 = -halfD + zt2 * cd;

            for (let xi = 0; xi < ad; xi++) {
                const xt1 = xi / ad;
                const xt2 = (xi + 1) / ad;
                const x1 = -halfW + xt1 * cw;
                const x2 = -halfW + xt2 * cw;

                // Arch profile: parabolic bump
                const xm1 = (xt1 - 0.5) * 2;
                const xm2 = (xt2 - 0.5) * 2;
                const archY1 = ch + ah * (1 - xm1 * xm1);
                const archY2 = ch + ah * (1 - xm2 * xm2);

                // Top surface quad
                faces.push({
                    vertices: [
                        [x1, archY1, z1],
                        [x2, archY2, z1],
                        [x2, archY2, z2],
                        [x1, archY1, z2],
                    ],
                    normal: [0, 1, 0],
                });
            }
        }

        // Side walls
        for (let zi = 0; zi < zSteps; zi++) {
            const zt1 = zi / zSteps;
            const zt2 = (zi + 1) / zSteps;
            const z1 = -halfD + zt1 * cd;
            const z2 = -halfD + zt2 * cd;

            // Left wall
            faces.push({
                vertices: [
                    [-halfW, 0, z1],
                    [-halfW, 0, z2],
                    [-halfW, ch + ah * (1 - 1), z2],
                    [-halfW, ch + ah * (1 - 1), z1],
                ],
                normal: [-1, 0, 0],
            });

            // Right wall
            faces.push({
                vertices: [
                    [halfW, ch + ah * (1 - 1), z1],
                    [halfW, ch + ah * (1 - 1), z2],
                    [halfW, 0, z2],
                    [halfW, 0, z1],
                ],
                normal: [1, 0, 0],
            });
        }

        // Front wall
        for (let xi = 0; xi < ad; xi++) {
            const xt1 = xi / ad;
            const xt2 = (xi + 1) / ad;
            const x1 = -halfW + xt1 * cw;
            const x2 = -halfW + xt2 * cw;
            const xm1 = (xt1 - 0.5) * 2;
            const xm2 = (xt2 - 0.5) * 2;
            const archY1 = ch + ah * (1 - xm1 * xm1);
            const archY2 = ch + ah * (1 - xm2 * xm2);

            faces.push({
                vertices: [
                    [x1, 0, halfD],
                    [x2, 0, halfD],
                    [x2, archY2, halfD],
                    [x1, archY1, halfD],
                ],
                normal: [0, 0, 1],
            });
        }

        // Back wall
        for (let xi = 0; xi < ad; xi++) {
            const xt1 = xi / ad;
            const xt2 = (xi + 1) / ad;
            const x1 = -halfW + xt1 * cw;
            const x2 = -halfW + xt2 * cw;
            const xm1 = (xt1 - 0.5) * 2;
            const xm2 = (xt2 - 0.5) * 2;
            const archY1 = ch + ah * (1 - xm1 * xm1);
            const archY2 = ch + ah * (1 - xm2 * xm2);

            faces.push({
                vertices: [
                    [x2, 0, -halfD],
                    [x1, 0, -halfD],
                    [x1, archY1, -halfD],
                    [x2, archY2, -halfD],
                ],
                normal: [0, 0, -1],
            });
        }

        // Bottom face
        faces.push({
            vertices: [
                [-halfW, 0, halfD],
                [-halfW, 0, -halfD],
                [halfW, 0, -halfD],
                [halfW, 0, halfD],
            ],
            normal: [0, -1, 0],
        });

        // Oil filler cap (cylinder at front end)
        const fcr = this.fillerCapRadius;
        const fch = this.fillerCapHeight;
        const fcSegs = this.fillerCapSegments;
        const fcZ = halfD * 0.7;
        const fcBaseY = ch + ah;

        for (let i = 0; i < fcSegs; i++) {
            const a1 = (i / fcSegs) * Math.PI * 2;
            const a2 = ((i + 1) / fcSegs) * Math.PI * 2;
            const c1 = Math.cos(a1);
            const s1 = Math.sin(a1);
            const c2 = Math.cos(a2);
            const s2 = Math.sin(a2);

            // Cylinder wall
            faces.push({
                vertices: [
                    [c1 * fcr, fcBaseY, fcZ + s1 * fcr],
                    [c2 * fcr, fcBaseY, fcZ + s2 * fcr],
                    [c2 * fcr, fcBaseY + fch, fcZ + s2 * fcr],
                    [c1 * fcr, fcBaseY + fch, fcZ + s1 * fcr],
                ],
            });

            // Top cap
            faces.push({
                vertices: [
                    [0, fcBaseY + fch, fcZ],
                    [c1 * fcr, fcBaseY + fch, fcZ + s1 * fcr],
                    [c2 * fcr, fcBaseY + fch, fcZ + s2 * fcr],
                ],
                normal: [0, 1, 0],
            });
        }

        // Spark plug tube wells (4 raised cylindrical bosses)
        const swr = this.sparkWellRadius;
        const swh = this.sparkWellHeight;
        const swSegs = this.sparkWellSegments;

        for (let cyl = 0; cyl < 4; cyl++) {
            const wellZ = -halfD + bs * 0.5 + cyl * bs + bs * 0.15;
            const wellBaseY = ch + ah * 0.5;

            for (let i = 0; i < swSegs; i++) {
                const a1 = (i / swSegs) * Math.PI * 2;
                const a2 = ((i + 1) / swSegs) * Math.PI * 2;
                const c1 = Math.cos(a1);
                const s1 = Math.sin(a1);
                const c2 = Math.cos(a2);
                const s2 = Math.sin(a2);

                faces.push({
                    vertices: [
                        [c1 * swr, wellBaseY, wellZ + s1 * swr],
                        [c2 * swr, wellBaseY, wellZ + s2 * swr],
                        [c2 * swr, wellBaseY + swh, wellZ + s2 * swr],
                        [c1 * swr, wellBaseY + swh, wellZ + s1 * swr],
                    ],
                });

                // Well top ring
                faces.push({
                    vertices: [
                        [0, wellBaseY + swh, wellZ],
                        [c1 * swr, wellBaseY + swh, wellZ + s1 * swr],
                        [c2 * swr, wellBaseY + swh, wellZ + s2 * swr],
                    ],
                    normal: [0, 1, 0],
                });
            }
        }

        return faces;
    }

}

export function createValveCover(...options: ConstructorParameters<typeof ValveCover>) {
    return new ValveCover(...options);
}

export function elementIsValveCover(value: unknown): value is ValveCover {
    return value instanceof ValveCover;
}
