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

export interface PistonState extends Shape3DState {
    crownRadius: number;
    crownThickness: number;
    skirtHeight: number;
    skirtTaper: number;
    ringCount: number;
    ringHeight: number;
    ringDepth: number;
    ringGap: number;
    wristPinRadius: number;
    wristPinLength: number;
    bossRadius: number;
    segments: number;
}

export class Piston extends Shape3D<PistonState> {

    public get crownRadius() {
        return this.getStateValue('crownRadius');
    }

    public set crownRadius(value) {
        this.setStateValue('crownRadius', value);
    }

    public get crownThickness() {
        return this.getStateValue('crownThickness');
    }

    public set crownThickness(value) {
        this.setStateValue('crownThickness', value);
    }

    public get skirtHeight() {
        return this.getStateValue('skirtHeight');
    }

    public set skirtHeight(value) {
        this.setStateValue('skirtHeight', value);
    }

    public get skirtTaper() {
        return this.getStateValue('skirtTaper');
    }

    public set skirtTaper(value) {
        this.setStateValue('skirtTaper', value);
    }

    public get ringCount() {
        return this.getStateValue('ringCount');
    }

    public set ringCount(value) {
        this.setStateValue('ringCount', value);
    }

    public get ringHeight() {
        return this.getStateValue('ringHeight');
    }

    public set ringHeight(value) {
        this.setStateValue('ringHeight', value);
    }

    public get ringDepth() {
        return this.getStateValue('ringDepth');
    }

    public set ringDepth(value) {
        this.setStateValue('ringDepth', value);
    }

    public get ringGap() {
        return this.getStateValue('ringGap');
    }

    public set ringGap(value) {
        this.setStateValue('ringGap', value);
    }

    public get wristPinRadius() {
        return this.getStateValue('wristPinRadius');
    }

    public set wristPinRadius(value) {
        this.setStateValue('wristPinRadius', value);
    }

    public get wristPinLength() {
        return this.getStateValue('wristPinLength');
    }

    public set wristPinLength(value) {
        this.setStateValue('wristPinLength', value);
    }

    public get bossRadius() {
        return this.getStateValue('bossRadius');
    }

    public set bossRadius(value) {
        this.setStateValue('bossRadius', value);
    }

    public get segments() {
        return this.getStateValue('segments');
    }

    public set segments(value) {
        this.setStateValue('segments', value);
    }

    constructor(options: Shape3DOptions<PistonState>) {
        super('piston', {
            crownRadius: 0.12,
            crownThickness: 0.03,
            skirtHeight: 0.12,
            skirtTaper: 0.005,
            ringCount: 3,
            ringHeight: 0.012,
            ringDepth: 0.008,
            ringGap: 0.008,
            wristPinRadius: 0.015,
            wristPinLength: 0.2,
            bossRadius: 0.03,
            segments: 24,
            ...options,
        });
    }

    protected computeFaces(): Face3D[] {
        const faces: Face3D[] = [];
        const segs = this.segments;
        const cr = this.crownRadius;
        const ct = this.crownThickness;
        const sh = this.skirtHeight;
        const taper = this.skirtTaper;
        const rc = this.ringCount;
        const rh = this.ringHeight;
        const rd = this.ringDepth;
        const rg = this.ringGap;
        const wpr = this.wristPinRadius;
        const wpl = this.wristPinLength;
        const br = this.bossRadius;

        // Crown top disc with slight concave dish
        const dishDepth = 0.008;

        for (let i = 0; i < segs; i++) {
            const a1 = (i / segs) * Math.PI * 2;
            const a2 = ((i + 1) / segs) * Math.PI * 2;
            const c1 = Math.cos(a1);
            const s1 = Math.sin(a1);
            const c2 = Math.cos(a2);
            const s2 = Math.sin(a2);

            const dish1 = -dishDepth * (1 - (c1 * c1 + s1 * s1) * 0.3);
            const dish2 = -dishDepth * (1 - (c2 * c2 + s2 * s2) * 0.3);

            // Crown top face (slightly dished)
            faces.push({
                vertices: [
                    [0, ct / 2 + dishDepth * 0.5, 0],
                    [c1 * cr, ct / 2 + dish1, s1 * cr],
                    [c2 * cr, ct / 2 + dish2, s2 * cr],
                ],
                normal: [0, 1, 0],
            });

            // Crown bottom face
            faces.push({
                vertices: [
                    [0, ct / 2 - ct, 0],
                    [c2 * cr, ct / 2 - ct, s2 * cr],
                    [c1 * cr, ct / 2 - ct, s1 * cr],
                ],
                normal: [0, -1, 0],
            });

            // Crown outer wall
            faces.push({
                vertices: [
                    [c1 * cr, ct / 2, s1 * cr],
                    [c2 * cr, ct / 2, s2 * cr],
                    [c2 * cr, ct / 2 - ct, s2 * cr],
                    [c1 * cr, ct / 2 - ct, s1 * cr],
                ],
            });
        }

        // Ring lands - 3 circumferential grooves below crown
        let ringY = ct / 2 - ct;

        for (let ring = 0; ring < rc; ring++) {
            const landTop = ringY - rg;
            const grooveTop = landTop;
            const grooveBot = grooveTop - rh;
            const grooveR = cr - rd;

            for (let i = 0; i < segs; i++) {
                const a1 = (i / segs) * Math.PI * 2;
                const a2 = ((i + 1) / segs) * Math.PI * 2;
                const c1 = Math.cos(a1);
                const s1 = Math.sin(a1);
                const c2 = Math.cos(a2);
                const s2 = Math.sin(a2);

                // Land above groove (outer radius cylinder)
                faces.push({
                    vertices: [
                        [c1 * cr, ringY, s1 * cr],
                        [c2 * cr, ringY, s2 * cr],
                        [c2 * cr, grooveTop, s2 * cr],
                        [c1 * cr, grooveTop, s1 * cr],
                    ],
                });

                // Groove top annular face
                faces.push({
                    vertices: [
                        [c1 * cr, grooveTop, s1 * cr],
                        [c2 * cr, grooveTop, s2 * cr],
                        [c2 * grooveR, grooveTop, s2 * grooveR],
                        [c1 * grooveR, grooveTop, s1 * grooveR],
                    ],
                    normal: [0, 1, 0],
                });

                // Groove inner wall
                faces.push({
                    vertices: [
                        [c1 * grooveR, grooveTop, s1 * grooveR],
                        [c2 * grooveR, grooveTop, s2 * grooveR],
                        [c2 * grooveR, grooveBot, s2 * grooveR],
                        [c1 * grooveR, grooveBot, s1 * grooveR],
                    ],
                });

                // Groove bottom annular face
                faces.push({
                    vertices: [
                        [c1 * grooveR, grooveBot, s1 * grooveR],
                        [c2 * grooveR, grooveBot, s2 * grooveR],
                        [c2 * cr, grooveBot, s2 * cr],
                        [c1 * cr, grooveBot, s1 * cr],
                    ],
                    normal: [0, -1, 0],
                });
            }

            ringY = grooveBot;
        }

        // Skirt - barrel-profiled cylinder below rings
        const skirtTop = ringY;
        const skirtBot = skirtTop - sh;
        const skirtDivisions = 4;

        for (let row = 0; row < skirtDivisions; row++) {
            const t1 = row / skirtDivisions;
            const t2 = (row + 1) / skirtDivisions;
            const yy1 = skirtTop - t1 * sh;
            const yy2 = skirtTop - t2 * sh;
            const r1 = cr - taper * t1;
            const r2 = cr - taper * t2;

            for (let i = 0; i < segs; i++) {
                const a1 = (i / segs) * Math.PI * 2;
                const a2 = ((i + 1) / segs) * Math.PI * 2;
                const c1 = Math.cos(a1);
                const s1 = Math.sin(a1);
                const c2 = Math.cos(a2);
                const s2 = Math.sin(a2);

                faces.push({
                    vertices: [
                        [c1 * r1, yy1, s1 * r1],
                        [c2 * r1, yy1, s2 * r1],
                        [c2 * r2, yy2, s2 * r2],
                        [c1 * r2, yy2, s1 * r2],
                    ],
                });
            }
        }

        // Skirt bottom rim
        const skirtBotR = cr - taper;

        for (let i = 0; i < segs; i++) {
            const a1 = (i / segs) * Math.PI * 2;
            const a2 = ((i + 1) / segs) * Math.PI * 2;

            faces.push({
                vertices: [
                    [0, skirtBot, 0],
                    [Math.cos(a2) * skirtBotR, skirtBot, Math.sin(a2) * skirtBotR],
                    [Math.cos(a1) * skirtBotR, skirtBot, Math.sin(a1) * skirtBotR],
                ],
                normal: [0, -1, 0],
            });
        }

        // Wrist pin bosses (2 cylindrical protrusions inside skirt)
        const bossY = skirtTop - sh * 0.4;
        const bossSegs = 16;

        for (const side of [-1, 1]) {
            const bossZ = side * (cr * 0.5);

            for (let i = 0; i < bossSegs; i++) {
                const a1 = (i / bossSegs) * Math.PI * 2;
                const a2 = ((i + 1) / bossSegs) * Math.PI * 2;
                const c1 = Math.cos(a1);
                const s1 = Math.sin(a1);
                const c2 = Math.cos(a2);
                const s2 = Math.sin(a2);

                // Boss cylinder wall
                const bLen = br;
                const bx1A = c1 * br;
                const by1A = bossY + s1 * br;
                const bx2A = c2 * br;
                const by2A = bossY + s2 * br;

                faces.push({
                    vertices: [
                        [bx1A, by1A, bossZ],
                        [bx2A, by2A, bossZ],
                        [bx2A, by2A, bossZ + side * bLen],
                        [bx1A, by1A, bossZ + side * bLen],
                    ],
                });
            }
        }

        // Wrist pin cylinder
        const pinSegs = 16;
        const pinHalfL = wpl / 2;

        for (let i = 0; i < pinSegs; i++) {
            const a1 = (i / pinSegs) * Math.PI * 2;
            const a2 = ((i + 1) / pinSegs) * Math.PI * 2;
            const c1 = Math.cos(a1);
            const s1 = Math.sin(a1);
            const c2 = Math.cos(a2);
            const s2 = Math.sin(a2);
            const pinY = skirtTop - sh * 0.4;

            const f1: Vector3 = [c1 * wpr, pinY + s1 * wpr, -pinHalfL];
            const f2: Vector3 = [c2 * wpr, pinY + s2 * wpr, -pinHalfL];
            const b1: Vector3 = [c1 * wpr, pinY + s1 * wpr, pinHalfL];
            const b2: Vector3 = [c2 * wpr, pinY + s2 * wpr, pinHalfL];

            faces.push({ vertices: [f1, f2, b2, b1] });

            // End caps
            faces.push({
                vertices: [
                    [0, pinY, -pinHalfL],
                    f1,
                    f2,
                ],
                normal: [0, 0, -1],
            });

            faces.push({
                vertices: [
                    [0, pinY, pinHalfL],
                    b2,
                    b1,
                ],
                normal: [0, 0, 1],
            });
        }

        return faces;
    }

}

export function createPiston(...options: ConstructorParameters<typeof Piston>) {
    return new Piston(...options);
}

export function elementIsPiston(value: unknown): value is Piston {
    return value instanceof Piston;
}
