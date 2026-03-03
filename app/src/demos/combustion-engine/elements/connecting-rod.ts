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

export interface ConnectingRodState extends Shape3DState {
    length: number;
    smallEndRadius: number;
    bigEndRadius: number;
    smallEndWidth: number;
    bigEndWidth: number;
    beamWidth: number;
    beamDepth: number;
    flangeThickness: number;
    webThickness: number;
    boltBossRadius: number;
    segments: number;
}

export class ConnectingRod extends Shape3D<ConnectingRodState> {

    public get length() {
        return this.getStateValue('length');
    }

    public set length(value) {
        this.setStateValue('length', value);
    }

    public get smallEndRadius() {
        return this.getStateValue('smallEndRadius');
    }

    public set smallEndRadius(value) {
        this.setStateValue('smallEndRadius', value);
    }

    public get bigEndRadius() {
        return this.getStateValue('bigEndRadius');
    }

    public set bigEndRadius(value) {
        this.setStateValue('bigEndRadius', value);
    }

    public get smallEndWidth() {
        return this.getStateValue('smallEndWidth');
    }

    public set smallEndWidth(value) {
        this.setStateValue('smallEndWidth', value);
    }

    public get bigEndWidth() {
        return this.getStateValue('bigEndWidth');
    }

    public set bigEndWidth(value) {
        this.setStateValue('bigEndWidth', value);
    }

    public get beamWidth() {
        return this.getStateValue('beamWidth');
    }

    public set beamWidth(value) {
        this.setStateValue('beamWidth', value);
    }

    public get beamDepth() {
        return this.getStateValue('beamDepth');
    }

    public set beamDepth(value) {
        this.setStateValue('beamDepth', value);
    }

    public get flangeThickness() {
        return this.getStateValue('flangeThickness');
    }

    public set flangeThickness(value) {
        this.setStateValue('flangeThickness', value);
    }

    public get webThickness() {
        return this.getStateValue('webThickness');
    }

    public set webThickness(value) {
        this.setStateValue('webThickness', value);
    }

    public get boltBossRadius() {
        return this.getStateValue('boltBossRadius');
    }

    public set boltBossRadius(value) {
        this.setStateValue('boltBossRadius', value);
    }

    public get segments() {
        return this.getStateValue('segments');
    }

    public set segments(value) {
        this.setStateValue('segments', value);
    }

    constructor(options: Shape3DOptions<ConnectingRodState>) {
        super('connecting-rod', {
            length: 0.4,
            smallEndRadius: 0.025,
            bigEndRadius: 0.045,
            smallEndWidth: 0.06,
            bigEndWidth: 0.08,
            beamWidth: 0.025,
            beamDepth: 0.04,
            flangeThickness: 0.008,
            webThickness: 0.006,
            boltBossRadius: 0.01,
            segments: 24,
            ...options,
        });
    }

    private ring(cx: number, cy: number, innerR: number, outerR: number, z1: number, z2: number, segs: number): Face3D[] {
        const faces: Face3D[] = [];

        for (let i = 0; i < segs; i++) {
            const a1 = (i / segs) * Math.PI * 2;
            const a2 = ((i + 1) / segs) * Math.PI * 2;
            const c1 = Math.cos(a1);
            const s1 = Math.sin(a1);
            const c2 = Math.cos(a2);
            const s2 = Math.sin(a2);

            const oi1: Vector3 = [cx + c1 * outerR, cy + s1 * outerR, z1];
            const oi2: Vector3 = [cx + c2 * outerR, cy + s2 * outerR, z1];
            const oo1: Vector3 = [cx + c1 * outerR, cy + s1 * outerR, z2];
            const oo2: Vector3 = [cx + c2 * outerR, cy + s2 * outerR, z2];

            // Outer surface
            faces.push({ vertices: [oi1, oi2, oo2, oo1] });

            // Inner surface
            const ii1: Vector3 = [cx + c1 * innerR, cy + s1 * innerR, z1];
            const ii2: Vector3 = [cx + c2 * innerR, cy + s2 * innerR, z1];
            const io1: Vector3 = [cx + c1 * innerR, cy + s1 * innerR, z2];
            const io2: Vector3 = [cx + c2 * innerR, cy + s2 * innerR, z2];

            faces.push({ vertices: [io1, io2, ii2, ii1] });

            // Front annular cap
            faces.push({
                vertices: [ii1, ii2, oi2, oi1],
                normal: [0, 0, 1],
            });

            // Back annular cap
            faces.push({
                vertices: [oo1, oo2, io2, io1],
                normal: [0, 0, -1],
            });
        }

        return faces;
    }

    protected computeFaces(): Face3D[] {
        const faces: Face3D[] = [];
        const segs = this.segments;
        const len = this.length;
        const ser = this.smallEndRadius;
        const ber = this.bigEndRadius;
        const sew = this.smallEndWidth;
        const bew = this.bigEndWidth;
        const bw = this.beamWidth;
        const ft = this.flangeThickness;
        const wt = this.webThickness;
        const bbr = this.boltBossRadius;

        const halfSew = sew / 2;
        const halfBew = bew / 2;

        // Small end ring (top, at y = length/2)
        const smallY = len / 2;
        const smallInnerR = ser * 0.6;
        faces.push(...this.ring(0, smallY, smallInnerR, ser, halfSew, -halfSew, segs));

        // Big end ring (bottom, at y = -length/2)
        const bigY = -len / 2;
        const bigInnerR = ber * 0.6;
        faces.push(...this.ring(0, bigY, bigInnerR, ber, halfBew, -halfBew, segs));

        // I-beam connecting shaft between small and big ends
        // Cross section: top flange, web, bottom flange
        const beamStations = 8;
        const halfBW = bw / 2;
        const halfWT = wt / 2;

        for (let st = 0; st < beamStations; st++) {
            const t1 = st / beamStations;
            const t2 = (st + 1) / beamStations;
            const y1 = smallY - ser - t1 * (len - ser - ber);
            const y2 = smallY - ser - t2 * (len - ser - ber);

            // Interpolate width for taper
            const zw1 = halfSew + (halfBew - halfSew) * t1;
            const zw2 = halfSew + (halfBew - halfSew) * t2;

            // Front flange (top of I)
            faces.push({
                vertices: [
                    [-halfBW, y1, zw1],
                    [halfBW, y1, zw1],
                    [halfBW, y2, zw2],
                    [-halfBW, y2, zw2],
                ],
                normal: [0, 0, 1],
            });

            // Back flange (top of I)
            faces.push({
                vertices: [
                    [-halfBW, y2, zw2 - ft],
                    [halfBW, y2, zw2 - ft],
                    [halfBW, y1, zw1 - ft],
                    [-halfBW, y1, zw1 - ft],
                ],
                normal: [0, 0, -1],
            });

            // Front flange (bottom of I)
            faces.push({
                vertices: [
                    [-halfBW, y1, -zw1 + ft],
                    [halfBW, y1, -zw1 + ft],
                    [halfBW, y2, -zw2 + ft],
                    [-halfBW, y2, -zw2 + ft],
                ],
                normal: [0, 0, 1],
            });

            // Back flange (bottom of I)
            faces.push({
                vertices: [
                    [-halfBW, y2, -zw2],
                    [halfBW, y2, -zw2],
                    [halfBW, y1, -zw1],
                    [-halfBW, y1, -zw1],
                ],
                normal: [0, 0, -1],
            });

            // Web center
            faces.push({
                vertices: [
                    [halfBW, y1, halfWT],
                    [halfBW, y2, halfWT],
                    [halfBW, y2, -halfWT],
                    [halfBW, y1, -halfWT],
                ],
                normal: [1, 0, 0],
            });

            faces.push({
                vertices: [
                    [-halfBW, y1, -halfWT],
                    [-halfBW, y2, -halfWT],
                    [-halfBW, y2, halfWT],
                    [-halfBW, y1, halfWT],
                ],
                normal: [-1, 0, 0],
            });

            // Top surface of top flange
            faces.push({
                vertices: [
                    [-halfBW, y1, zw1],
                    [-halfBW, y2, zw2],
                    [halfBW, y2, zw2],
                    [halfBW, y1, zw1],
                ],
            });

            // Bottom surface of bottom flange
            faces.push({
                vertices: [
                    [halfBW, y1, -zw1],
                    [halfBW, y2, -zw2],
                    [-halfBW, y2, -zw2],
                    [-halfBW, y1, -zw1],
                ],
            });
        }

        // Bolt bosses on big end
        const boltSegs = 12;
        const boltOffset = ber * 0.85;

        for (const side of [-1, 1]) {
            const bx = side * boltOffset;
            const by = bigY;

            for (let i = 0; i < boltSegs; i++) {
                const a1 = (i / boltSegs) * Math.PI * 2;
                const a2 = ((i + 1) / boltSegs) * Math.PI * 2;
                const c1 = Math.cos(a1);
                const s1 = Math.sin(a1);
                const c2 = Math.cos(a2);
                const s2 = Math.sin(a2);

                const bossLen = bew * 0.3;

                faces.push({
                    vertices: [
                        [bx + c1 * bbr, by + s1 * bbr, halfBew],
                        [bx + c2 * bbr, by + s2 * bbr, halfBew],
                        [bx + c2 * bbr, by + s2 * bbr, halfBew + bossLen],
                        [bx + c1 * bbr, by + s1 * bbr, halfBew + bossLen],
                    ],
                });

                // Boss cap
                faces.push({
                    vertices: [
                        [bx, by, halfBew + bossLen],
                        [bx + c1 * bbr, by + s1 * bbr, halfBew + bossLen],
                        [bx + c2 * bbr, by + s2 * bbr, halfBew + bossLen],
                    ],
                    normal: [0, 0, 1],
                });
            }
        }

        return faces;
    }

}

export function createConnectingRod(...options: ConstructorParameters<typeof ConnectingRod>) {
    return new ConnectingRod(...options);
}

export function elementIsConnectingRod(value: unknown): value is ConnectingRod {
    return value instanceof ConnectingRod;
}
