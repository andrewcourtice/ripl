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

export interface CylinderHeadState extends Shape3DState {
    headWidth: number;
    headHeight: number;
    headDepth: number;
    chamberRadius: number;
    chamberDepth: number;
    chamberSegments: number;
    portRadius: number;
    portLength: number;
    portAngle: number;
    portSegments: number;
    boreSpacing: number;
    railHeight: number;
    railWidth: number;
}

export class CylinderHead extends Shape3D<CylinderHeadState> {

    public get headWidth() {
        return this.getStateValue('headWidth');
    }

    public set headWidth(value) {
        this.setStateValue('headWidth', value);
    }

    public get headHeight() {
        return this.getStateValue('headHeight');
    }

    public set headHeight(value) {
        this.setStateValue('headHeight', value);
    }

    public get headDepth() {
        return this.getStateValue('headDepth');
    }

    public set headDepth(value) {
        this.setStateValue('headDepth', value);
    }

    public get chamberRadius() {
        return this.getStateValue('chamberRadius');
    }

    public set chamberRadius(value) {
        this.setStateValue('chamberRadius', value);
    }

    public get chamberDepth() {
        return this.getStateValue('chamberDepth');
    }

    public set chamberDepth(value) {
        this.setStateValue('chamberDepth', value);
    }

    public get chamberSegments() {
        return this.getStateValue('chamberSegments');
    }

    public set chamberSegments(value) {
        this.setStateValue('chamberSegments', value);
    }

    public get portRadius() {
        return this.getStateValue('portRadius');
    }

    public set portRadius(value) {
        this.setStateValue('portRadius', value);
    }

    public get portLength() {
        return this.getStateValue('portLength');
    }

    public set portLength(value) {
        this.setStateValue('portLength', value);
    }

    public get portAngle() {
        return this.getStateValue('portAngle');
    }

    public set portAngle(value) {
        this.setStateValue('portAngle', value);
    }

    public get portSegments() {
        return this.getStateValue('portSegments');
    }

    public set portSegments(value) {
        this.setStateValue('portSegments', value);
    }

    public get boreSpacing() {
        return this.getStateValue('boreSpacing');
    }

    public set boreSpacing(value) {
        this.setStateValue('boreSpacing', value);
    }

    public get railHeight() {
        return this.getStateValue('railHeight');
    }

    public set railHeight(value) {
        this.setStateValue('railHeight', value);
    }

    public get railWidth() {
        return this.getStateValue('railWidth');
    }

    public set railWidth(value) {
        this.setStateValue('railWidth', value);
    }

    constructor(options: Shape3DOptions<CylinderHeadState>) {
        super('cylinder-head', {
            headWidth: 0.38,
            headHeight: 0.12,
            headDepth: 1.25,
            chamberRadius: 0.1,
            chamberDepth: 0.03,
            chamberSegments: 12,
            portRadius: 0.025,
            portLength: 0.08,
            portAngle: Math.PI / 6,
            portSegments: 10,
            boreSpacing: 0.28,
            railHeight: 0.02,
            railWidth: 0.015,
            ...options,
        });
    }

    private box(x1: number, y1: number, z1: number, x2: number, y2: number, z2: number): Face3D[] {
        return [
            {
                vertices: [[x1, y1, z2], [x2, y1, z2], [x2, y2, z2], [x1, y2, z2]],
                normal: [0, 0, 1],
            },
            {
                vertices: [[x2, y1, z1], [x1, y1, z1], [x1, y2, z1], [x2, y2, z1]],
                normal: [0, 0, -1],
            },
            {
                vertices: [[x1, y2, z1], [x1, y2, z2], [x2, y2, z2], [x2, y2, z1]],
                normal: [0, 1, 0],
            },
            {
                vertices: [[x1, y1, z2], [x1, y1, z1], [x2, y1, z1], [x2, y1, z2]],
                normal: [0, -1, 0],
            },
            {
                vertices: [[x2, y1, z1], [x2, y1, z2], [x2, y2, z2], [x2, y2, z1]],
                normal: [1, 0, 0],
            },
            {
                vertices: [[x1, y1, z2], [x1, y1, z1], [x1, y2, z1], [x1, y2, z2]],
                normal: [-1, 0, 0],
            },
        ];
    }

    protected computeFaces(): Face3D[] {
        const faces: Face3D[] = [];
        const hw = this.headWidth;
        const hh = this.headHeight;
        const hd = this.headDepth;
        const chR = this.chamberRadius;
        const chD = this.chamberDepth;
        const chSegs = this.chamberSegments;
        const pR = this.portRadius;
        const pL = this.portLength;
        const pA = this.portAngle;
        const pSegs = this.portSegments;
        const bs = this.boreSpacing;

        const halfW = hw / 2;
        const halfH = hh / 2;
        const halfD = hd / 2;

        // Main head body
        faces.push(...this.box(-halfW, -halfH, -halfD, halfW, halfH, halfD));

        // Combustion chamber recesses on bottom face (hemispherical domes)
        for (let cyl = 0; cyl < 4; cyl++) {
            const chZ = -halfD + bs * 0.5 + cyl * bs + bs * 0.15;
            const chY = -halfH;

            // Hemispherical dome using latitude/longitude grid
            const latSteps = 8;
            const lonSteps = chSegs;

            for (let lat = 0; lat < latSteps; lat++) {
                const phi1 = (lat / latSteps) * (Math.PI / 2);
                const phi2 = ((lat + 1) / latSteps) * (Math.PI / 2);

                for (let lon = 0; lon < lonSteps; lon++) {
                    const theta1 = (lon / lonSteps) * Math.PI * 2;
                    const theta2 = ((lon + 1) / lonSteps) * Math.PI * 2;

                    const r1 = chR * Math.cos(phi1);
                    const r2 = chR * Math.cos(phi2);
                    const y1 = chY - chD * Math.sin(phi1);
                    const y2 = chY - chD * Math.sin(phi2);

                    const p1: Vector3 = [Math.cos(theta1) * r1, y1, chZ + Math.sin(theta1) * r1];
                    const p2: Vector3 = [Math.cos(theta2) * r1, y1, chZ + Math.sin(theta2) * r1];
                    const p3: Vector3 = [Math.cos(theta2) * r2, y2, chZ + Math.sin(theta2) * r2];
                    const p4: Vector3 = [Math.cos(theta1) * r2, y2, chZ + Math.sin(theta1) * r2];

                    faces.push({ vertices: [p1, p2, p3, p4] });
                }
            }

            // Intake and exhaust ports (2 per cylinder)
            for (const side of [-1, 1]) {
                const portX = side * halfW;
                const portBaseY = -halfH + hh * 0.3;
                const sinA = Math.sin(pA);
                const cosA = Math.cos(pA);

                for (let i = 0; i < pSegs; i++) {
                    const a1 = (i / pSegs) * Math.PI * 2;
                    const a2 = ((i + 1) / pSegs) * Math.PI * 2;

                    // Port tube along angled direction
                    const dx1 = side * pL;
                    const dy1 = pL * sinA;

                    const bx1 = portX + Math.cos(a1) * pR * cosA;
                    const by1 = portBaseY + Math.sin(a1) * pR;
                    const bx2 = portX + Math.cos(a2) * pR * cosA;
                    const by2 = portBaseY + Math.sin(a2) * pR;

                    faces.push({
                        vertices: [
                            [bx1, by1, chZ + Math.sin(a1) * pR],
                            [bx2, by2, chZ + Math.sin(a2) * pR],
                            [bx2 + dx1, by2 + dy1, chZ + Math.sin(a2) * pR],
                            [bx1 + dx1, by1 + dy1, chZ + Math.sin(a1) * pR],
                        ],
                    });
                }

                // Valve guide boss (small cylinder on underside)
                const guideSegs = 12;
                const guideR = pR * 0.4;
                const guideLen = 0.02;
                const guideX = side * halfW * 0.3;

                for (let i = 0; i < guideSegs; i++) {
                    const a1 = (i / guideSegs) * Math.PI * 2;
                    const a2 = ((i + 1) / guideSegs) * Math.PI * 2;
                    const c1 = Math.cos(a1);
                    const s1 = Math.sin(a1);
                    const c2 = Math.cos(a2);
                    const s2 = Math.sin(a2);

                    faces.push({
                        vertices: [
                            [guideX + c1 * guideR, -halfH, chZ + s1 * guideR],
                            [guideX + c2 * guideR, -halfH, chZ + s2 * guideR],
                            [guideX + c2 * guideR, -halfH - guideLen, chZ + s2 * guideR],
                            [guideX + c1 * guideR, -halfH - guideLen, chZ + s1 * guideR],
                        ],
                    });
                }
            }
        }

        // Top rocker cover rail (raised rectangular rim)
        const rh = this.railHeight;
        const rw = this.railWidth;

        // Front rail
        faces.push(...this.box(-halfW, halfH, halfD - rw, halfW, halfH + rh, halfD));
        // Back rail
        faces.push(...this.box(-halfW, halfH, -halfD, halfW, halfH + rh, -halfD + rw));
        // Left rail
        faces.push(...this.box(-halfW, halfH, -halfD + rw, -halfW + rw, halfH + rh, halfD - rw));
        // Right rail
        faces.push(...this.box(halfW - rw, halfH, -halfD + rw, halfW, halfH + rh, halfD - rw));

        return faces;
    }

}

export function createCylinderHead(...options: ConstructorParameters<typeof CylinderHead>) {
    return new CylinderHead(...options);
}

export function elementIsCylinderHead(value: unknown): value is CylinderHead {
    return value instanceof CylinderHead;
}
