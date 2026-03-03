import {
    Shape3D,
} from '@ripl/3d';

import type {
    Face3D,
    Shape3DOptions,
    Shape3DState,
} from '@ripl/3d';

export interface ValveState extends Shape3DState {
    headRadius: number;
    headThickness: number;
    seatAngle: number;
    seatDepth: number;
    stemRadius: number;
    stemLength: number;
    springRadius: number;
    springWireRadius: number;
    springCoils: number;
    springSweepSteps: number;
    springCrossSteps: number;
    headSegments: number;
    stemSegments: number;
}

export class Valve extends Shape3D<ValveState> {

    public get headRadius() {
        return this.getStateValue('headRadius');
    }

    public set headRadius(value) {
        this.setStateValue('headRadius', value);
    }

    public get headThickness() {
        return this.getStateValue('headThickness');
    }

    public set headThickness(value) {
        this.setStateValue('headThickness', value);
    }

    public get seatAngle() {
        return this.getStateValue('seatAngle');
    }

    public set seatAngle(value) {
        this.setStateValue('seatAngle', value);
    }

    public get seatDepth() {
        return this.getStateValue('seatDepth');
    }

    public set seatDepth(value) {
        this.setStateValue('seatDepth', value);
    }

    public get stemRadius() {
        return this.getStateValue('stemRadius');
    }

    public set stemRadius(value) {
        this.setStateValue('stemRadius', value);
    }

    public get stemLength() {
        return this.getStateValue('stemLength');
    }

    public set stemLength(value) {
        this.setStateValue('stemLength', value);
    }

    public get springRadius() {
        return this.getStateValue('springRadius');
    }

    public set springRadius(value) {
        this.setStateValue('springRadius', value);
    }

    public get springWireRadius() {
        return this.getStateValue('springWireRadius');
    }

    public set springWireRadius(value) {
        this.setStateValue('springWireRadius', value);
    }

    public get springCoils() {
        return this.getStateValue('springCoils');
    }

    public set springCoils(value) {
        this.setStateValue('springCoils', value);
    }

    public get springSweepSteps() {
        return this.getStateValue('springSweepSteps');
    }

    public set springSweepSteps(value) {
        this.setStateValue('springSweepSteps', value);
    }

    public get springCrossSteps() {
        return this.getStateValue('springCrossSteps');
    }

    public set springCrossSteps(value) {
        this.setStateValue('springCrossSteps', value);
    }

    public get headSegments() {
        return this.getStateValue('headSegments');
    }

    public set headSegments(value) {
        this.setStateValue('headSegments', value);
    }

    public get stemSegments() {
        return this.getStateValue('stemSegments');
    }

    public set stemSegments(value) {
        this.setStateValue('stemSegments', value);
    }

    constructor(options: Shape3DOptions<ValveState>) {
        super('valve', {
            headRadius: 0.022,
            headThickness: 0.004,
            seatAngle: Math.PI / 4,
            seatDepth: 0.008,
            stemRadius: 0.004,
            stemLength: 0.1,
            springRadius: 0.015,
            springWireRadius: 0.002,
            springCoils: 6,
            springSweepSteps: 12,
            springCrossSteps: 8,
            headSegments: 24,
            stemSegments: 12,
            ...options,
        });
    }

    protected computeFaces(): Face3D[] {
        const faces: Face3D[] = [];
        const hr = this.headRadius;
        const ht = this.headThickness;
        const sd = this.seatDepth;
        const stR = this.stemRadius;
        const stL = this.stemLength;
        const spR = this.springRadius;
        const spWR = this.springWireRadius;
        const spCoils = this.springCoils;
        const spSweep = this.springSweepSteps;
        const spCross = this.springCrossSteps;
        const hSegs = this.headSegments;
        const stSegs = this.stemSegments;

        // Valve head — tulip shape
        // Top face (flat disc)
        for (let i = 0; i < hSegs; i++) {
            const a1 = (i / hSegs) * Math.PI * 2;
            const a2 = ((i + 1) / hSegs) * Math.PI * 2;

            faces.push({
                vertices: [
                    [0, 0, 0],
                    [Math.cos(a1) * hr, 0, Math.sin(a1) * hr],
                    [Math.cos(a2) * hr, 0, Math.sin(a2) * hr],
                ],
                normal: [0, 1, 0],
            });
        }

        // Head rim (thin cylinder)
        for (let i = 0; i < hSegs; i++) {
            const a1 = (i / hSegs) * Math.PI * 2;
            const a2 = ((i + 1) / hSegs) * Math.PI * 2;
            const c1 = Math.cos(a1);
            const s1 = Math.sin(a1);
            const c2 = Math.cos(a2);
            const s2 = Math.sin(a2);

            faces.push({
                vertices: [
                    [c1 * hr, 0, s1 * hr],
                    [c2 * hr, 0, s2 * hr],
                    [c2 * hr, -ht, s2 * hr],
                    [c1 * hr, -ht, s1 * hr],
                ],
            });
        }

        // Conical seat taper (from head rim down to stem)
        const seatRows = 8;
        const seatTopR = hr;
        const seatBotR = stR * 1.5;
        const seatTopY = -ht;
        const seatBotY = -ht - sd;

        for (let row = 0; row < seatRows; row++) {
            const t1 = row / seatRows;
            const t2 = (row + 1) / seatRows;
            const r1 = seatTopR + (seatBotR - seatTopR) * t1;
            const r2 = seatTopR + (seatBotR - seatTopR) * t2;
            const y1 = seatTopY + (seatBotY - seatTopY) * t1;
            const y2 = seatTopY + (seatBotY - seatTopY) * t2;

            for (let i = 0; i < hSegs; i++) {
                const a1 = (i / hSegs) * Math.PI * 2;
                const a2 = ((i + 1) / hSegs) * Math.PI * 2;
                const c1 = Math.cos(a1);
                const s1 = Math.sin(a1);
                const c2 = Math.cos(a2);
                const s2 = Math.sin(a2);

                faces.push({
                    vertices: [
                        [c1 * r1, y1, s1 * r1],
                        [c2 * r1, y1, s2 * r1],
                        [c2 * r2, y2, s2 * r2],
                        [c1 * r2, y2, s1 * r2],
                    ],
                });
            }
        }

        // Stem (long thin cylinder)
        const stemTopY = seatBotY;
        const stemBotY = stemTopY - stL;

        for (let i = 0; i < stSegs; i++) {
            const a1 = (i / stSegs) * Math.PI * 2;
            const a2 = ((i + 1) / stSegs) * Math.PI * 2;
            const c1 = Math.cos(a1);
            const s1 = Math.sin(a1);
            const c2 = Math.cos(a2);
            const s2 = Math.sin(a2);

            faces.push({
                vertices: [
                    [c1 * stR, stemTopY, s1 * stR],
                    [c2 * stR, stemTopY, s2 * stR],
                    [c2 * stR, stemBotY, s2 * stR],
                    [c1 * stR, stemBotY, s1 * stR],
                ],
            });
        }

        // Stem bottom cap
        for (let i = 0; i < stSegs; i++) {
            const a1 = (i / stSegs) * Math.PI * 2;
            const a2 = ((i + 1) / stSegs) * Math.PI * 2;

            faces.push({
                vertices: [
                    [0, stemBotY, 0],
                    [Math.cos(a2) * stR, stemBotY, Math.sin(a2) * stR],
                    [Math.cos(a1) * stR, stemBotY, Math.sin(a1) * stR],
                ],
                normal: [0, -1, 0],
            });
        }

        // Keeper groove (thin notch near top of stem)
        const keeperY = stemTopY - stL * 0.1;
        const keeperH = 0.003;
        const keeperR = stR * 0.7;

        for (let i = 0; i < stSegs; i++) {
            const a1 = (i / stSegs) * Math.PI * 2;
            const a2 = ((i + 1) / stSegs) * Math.PI * 2;
            const c1 = Math.cos(a1);
            const s1 = Math.sin(a1);
            const c2 = Math.cos(a2);
            const s2 = Math.sin(a2);

            // Groove inner wall
            faces.push({
                vertices: [
                    [c1 * keeperR, keeperY, s1 * keeperR],
                    [c2 * keeperR, keeperY, s2 * keeperR],
                    [c2 * keeperR, keeperY - keeperH, s2 * keeperR],
                    [c1 * keeperR, keeperY - keeperH, s1 * keeperR],
                ],
            });
        }

        // Valve spring (helical coil)
        const springBaseY = -ht - sd * 0.3;
        const springTopY = stemBotY + stL * 0.15;
        const springHeight = springBaseY - springTopY;
        const totalSweep = spCoils * Math.PI * 2;
        const totalSweepSteps = spCoils * spSweep;

        for (let sw = 0; sw < totalSweepSteps; sw++) {
            const t1 = sw / totalSweepSteps;
            const t2 = (sw + 1) / totalSweepSteps;

            const angle1 = t1 * totalSweep;
            const angle2 = t2 * totalSweep;

            const cy1 = springBaseY - t1 * springHeight;
            const cy2 = springBaseY - t2 * springHeight;

            const cx1 = Math.cos(angle1) * spR;
            const cz1 = Math.sin(angle1) * spR;
            const cx2 = Math.cos(angle2) * spR;
            const cz2 = Math.sin(angle2) * spR;

            for (let cs = 0; cs < spCross; cs++) {
                const ca1 = (cs / spCross) * Math.PI * 2;
                const ca2 = ((cs + 1) / spCross) * Math.PI * 2;

                // Cross-section of wire at position 1
                const nx1 = Math.cos(angle1);
                const nz1 = Math.sin(angle1);
                const wx1a = cx1 + Math.cos(ca1) * spWR * nx1;
                const wy1a = cy1 + Math.sin(ca1) * spWR;
                const wz1a = cz1 + Math.cos(ca1) * spWR * nz1;
                const wx1b = cx1 + Math.cos(ca2) * spWR * nx1;
                const wy1b = cy1 + Math.sin(ca2) * spWR;
                const wz1b = cz1 + Math.cos(ca2) * spWR * nz1;

                // Cross-section of wire at position 2
                const nx2 = Math.cos(angle2);
                const nz2 = Math.sin(angle2);
                const wx2a = cx2 + Math.cos(ca1) * spWR * nx2;
                const wy2a = cy2 + Math.sin(ca1) * spWR;
                const wz2a = cz2 + Math.cos(ca1) * spWR * nz2;
                const wx2b = cx2 + Math.cos(ca2) * spWR * nx2;
                const wy2b = cy2 + Math.sin(ca2) * spWR;
                const wz2b = cz2 + Math.cos(ca2) * spWR * nz2;

                faces.push({
                    vertices: [
                        [wx1a, wy1a, wz1a],
                        [wx1b, wy1b, wz1b],
                        [wx2b, wy2b, wz2b],
                        [wx2a, wy2a, wz2a],
                    ],
                });
            }
        }

        return faces;
    }

}

export function createValve(...options: ConstructorParameters<typeof Valve>) {
    return new Valve(...options);
}

export function elementIsValve(value: unknown): value is Valve {
    return value instanceof Valve;
}
