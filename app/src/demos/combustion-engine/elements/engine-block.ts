import {
    Shape3D,
} from '@ripl/3d';

import type {
    Face3D,
    Shape3DOptions,
    Shape3DState,
} from '@ripl/3d';

export interface EngineBlockState extends Shape3DState {
    blockWidth: number;
    blockHeight: number;
    blockDepth: number;
    wallThickness: number;
    boreRadius: number;
    boreSpacing: number;
    boreSegments: number;
    ribCount: number;
    ribHeight: number;
    ribThickness: number;
    flangeWidth: number;
    flangeThickness: number;
    bearingCapRadius: number;
    bearingCapSegments: number;
}

export class EngineBlock extends Shape3D<EngineBlockState> {

    public get blockWidth() {
        return this.getStateValue('blockWidth');
    }

    public set blockWidth(value) {
        this.setStateValue('blockWidth', value);
    }

    public get blockHeight() {
        return this.getStateValue('blockHeight');
    }

    public set blockHeight(value) {
        this.setStateValue('blockHeight', value);
    }

    public get blockDepth() {
        return this.getStateValue('blockDepth');
    }

    public set blockDepth(value) {
        this.setStateValue('blockDepth', value);
    }

    public get wallThickness() {
        return this.getStateValue('wallThickness');
    }

    public set wallThickness(value) {
        this.setStateValue('wallThickness', value);
    }

    public get boreRadius() {
        return this.getStateValue('boreRadius');
    }

    public set boreRadius(value) {
        this.setStateValue('boreRadius', value);
    }

    public get boreSpacing() {
        return this.getStateValue('boreSpacing');
    }

    public set boreSpacing(value) {
        this.setStateValue('boreSpacing', value);
    }

    public get boreSegments() {
        return this.getStateValue('boreSegments');
    }

    public set boreSegments(value) {
        this.setStateValue('boreSegments', value);
    }

    public get ribCount() {
        return this.getStateValue('ribCount');
    }

    public set ribCount(value) {
        this.setStateValue('ribCount', value);
    }

    public get ribHeight() {
        return this.getStateValue('ribHeight');
    }

    public set ribHeight(value) {
        this.setStateValue('ribHeight', value);
    }

    public get ribThickness() {
        return this.getStateValue('ribThickness');
    }

    public set ribThickness(value) {
        this.setStateValue('ribThickness', value);
    }

    public get flangeWidth() {
        return this.getStateValue('flangeWidth');
    }

    public set flangeWidth(value) {
        this.setStateValue('flangeWidth', value);
    }

    public get flangeThickness() {
        return this.getStateValue('flangeThickness');
    }

    public set flangeThickness(value) {
        this.setStateValue('flangeThickness', value);
    }

    public get bearingCapRadius() {
        return this.getStateValue('bearingCapRadius');
    }

    public set bearingCapRadius(value) {
        this.setStateValue('bearingCapRadius', value);
    }

    public get bearingCapSegments() {
        return this.getStateValue('bearingCapSegments');
    }

    public set bearingCapSegments(value) {
        this.setStateValue('bearingCapSegments', value);
    }

    constructor(options: Shape3DOptions<EngineBlockState>) {
        super('engine-block', {
            blockWidth: 0.35,
            blockHeight: 0.55,
            blockDepth: 1.2,
            wallThickness: 0.025,
            boreRadius: 0.13,
            boreSpacing: 0.28,
            boreSegments: 32,
            ribCount: 3,
            ribHeight: 0.015,
            ribThickness: 0.008,
            flangeWidth: 0.04,
            flangeThickness: 0.015,
            bearingCapRadius: 0.09,
            bearingCapSegments: 24,
            ...options,
        });
    }

    private box(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): Face3D[] {
        return [
            // Front
            {
                vertices: [[x1, y1, z2], [x2, y1, z2], [x2, y2, z2], [x1, y2, z2]],
                normal: [0, 0, 1],
            },
            // Back
            {
                vertices: [[x2, y1, z1], [x1, y1, z1], [x1, y2, z1], [x2, y2, z1]],
                normal: [0, 0, -1],
            },
            // Top
            {
                vertices: [[x1, y2, z1], [x1, y2, z2], [x2, y2, z2], [x2, y2, z1]],
                normal: [0, 1, 0],
            },
            // Bottom
            {
                vertices: [[x1, y1, z2], [x1, y1, z1], [x2, y1, z1], [x2, y1, z2]],
                normal: [0, -1, 0],
            },
            // Right
            {
                vertices: [[x2, y1, z1], [x2, y1, z2], [x2, y2, z2], [x2, y2, z1]],
                normal: [1, 0, 0],
            },
            // Left
            {
                vertices: [[x1, y1, z2], [x1, y1, z1], [x1, y2, z1], [x1, y2, z2]],
                normal: [-1, 0, 0],
            },
        ];
    }

    protected computeFaces(): Face3D[] {
        const faces: Face3D[] = [];
        const bw = this.blockWidth;
        const bh = this.blockHeight;
        const bd = this.blockDepth;
        const wt = this.wallThickness;
        const boreR = this.boreRadius;
        const boreSpacing = this.boreSpacing;
        const boreSegs = this.boreSegments;

        const halfW = bw / 2;
        const halfH = bh / 2;
        const halfD = bd / 2;

        // Outer walls (open top box)
        // Front wall
        faces.push(...this.box(-halfW, -halfH, halfD - wt, halfW, halfH, halfD));
        // Back wall
        faces.push(...this.box(-halfW, -halfH, -halfD, halfW, halfH, -halfD + wt));
        // Left wall
        faces.push(...this.box(-halfW, -halfH, -halfD + wt, -halfW + wt, halfH, halfD - wt));
        // Right wall
        faces.push(...this.box(halfW - wt, -halfH, -halfD + wt, halfW, halfH, halfD - wt));
        // Bottom wall
        faces.push(...this.box(-halfW, -halfH, -halfD, halfW, -halfH + wt, halfD));

        // Top deck surface (flat top with bore holes visible)
        // We draw the top surface as quads between bores and at edges
        const topY = halfH;

        // Cylinder bore walls (inside the block)
        for (let cyl = 0; cyl < 4; cyl++) {
            const boreZ = -halfD + boreSpacing * 0.5 + cyl * boreSpacing + boreSpacing * 0.15;

            for (let i = 0; i < boreSegs; i++) {
                const a1 = (i / boreSegs) * Math.PI * 2;
                const a2 = ((i + 1) / boreSegs) * Math.PI * 2;
                const c1 = Math.cos(a1);
                const s1 = Math.sin(a1);
                const c2 = Math.cos(a2);
                const s2 = Math.sin(a2);

                // Bore wall (from top to bottom)
                faces.push({
                    vertices: [
                        [c1 * boreR, topY, boreZ + s1 * boreR],
                        [c2 * boreR, topY, boreZ + s2 * boreR],
                        [c2 * boreR, -halfH + wt, boreZ + s2 * boreR],
                        [c1 * boreR, -halfH + wt, boreZ + s1 * boreR],
                    ],
                });

                // Top deck annular ring around bore
                const deckR = boreR + wt * 0.8;
                faces.push({
                    vertices: [
                        [c1 * boreR, topY, boreZ + s1 * boreR],
                        [c1 * deckR, topY, boreZ + s1 * deckR],
                        [c2 * deckR, topY, boreZ + s2 * deckR],
                        [c2 * boreR, topY, boreZ + s2 * boreR],
                    ],
                    normal: [0, 1, 0],
                });
            }
        }

        // Top deck fill (simplified as a large quad)
        faces.push({
            vertices: [
                [-halfW, topY, -halfD],
                [halfW, topY, -halfD],
                [halfW, topY, halfD],
                [-halfW, topY, halfD],
            ],
            normal: [0, 1, 0],
        });

        // Coolant jacket ribs on front and back exterior
        const ribH = this.ribHeight;
        const ribT = this.ribThickness;

        for (let ri = 0; ri < this.ribCount; ri++) {
            // Front side ribs
            faces.push(...this.box(
                -halfW + wt * 0.5, -halfH * 0.3, halfD,
                halfW - wt * 0.5, -halfH * 0.3 + ribT, halfD + ribH
            ));

            // Back side ribs
            faces.push(...this.box(
                -halfW + wt * 0.5, -halfH * 0.3, -halfD - ribH,
                halfW - wt * 0.5, -halfH * 0.3 + ribT, -halfD
            ));
        }

        // Oil pan flange at bottom
        const flW = this.flangeWidth;
        const flT = this.flangeThickness;
        faces.push(...this.box(
            -halfW - flW, -halfH - flT, -halfD - flW,
            halfW + flW, -halfH, halfD + flW
        ));

        // Main bearing cap saddles at bottom
        const bcr = this.bearingCapRadius;
        const bcSegs = this.bearingCapSegments;

        for (let cap = 0; cap < 5; cap++) {
            const capZ = -halfD + boreSpacing * 0.15 + cap * boreSpacing;
            const capY = -halfH + wt;
            const capWidth = 0.04;

            for (let i = 0; i < bcSegs; i++) {
                const a1 = Math.PI + (i / bcSegs) * Math.PI;
                const a2 = Math.PI + ((i + 1) / bcSegs) * Math.PI;
                const c1 = Math.cos(a1);
                const s1 = Math.sin(a1);
                const c2 = Math.cos(a2);
                const s2 = Math.sin(a2);

                faces.push({
                    vertices: [
                        [c1 * bcr, capY + s1 * bcr, capZ - capWidth],
                        [c2 * bcr, capY + s2 * bcr, capZ - capWidth],
                        [c2 * bcr, capY + s2 * bcr, capZ + capWidth],
                        [c1 * bcr, capY + s1 * bcr, capZ + capWidth],
                    ],
                });
            }
        }

        return faces;
    }

}

export function createEngineBlock(...options: ConstructorParameters<typeof EngineBlock>) {
    return new EngineBlock(...options);
}

export function elementIsEngineBlock(value: unknown): value is EngineBlock {
    return value instanceof EngineBlock;
}
