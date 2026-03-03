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

export interface CrankshaftState extends Shape3DState {
    mainJournalRadius: number;
    mainJournalLength: number;
    crankPinRadius: number;
    crankPinLength: number;
    throwRadius: number;
    webWidth: number;
    webThickness: number;
    counterweightRadius: number;
    counterweightThickness: number;
    snoutLength: number;
    snoutRadius: number;
    flangeRadius: number;
    flangeThickness: number;
    segments: number;
}

const CRANK_PHASES = [0, Math.PI, Math.PI, 0];
const NUM_CYLINDERS = 4;
const NUM_MAIN_JOURNALS = 5;

export class Crankshaft extends Shape3D<CrankshaftState> {

    public get mainJournalRadius() {
        return this.getStateValue('mainJournalRadius');
    }

    public set mainJournalRadius(value) {
        this.setStateValue('mainJournalRadius', value);
    }

    public get mainJournalLength() {
        return this.getStateValue('mainJournalLength');
    }

    public set mainJournalLength(value) {
        this.setStateValue('mainJournalLength', value);
    }

    public get crankPinRadius() {
        return this.getStateValue('crankPinRadius');
    }

    public set crankPinRadius(value) {
        this.setStateValue('crankPinRadius', value);
    }

    public get crankPinLength() {
        return this.getStateValue('crankPinLength');
    }

    public set crankPinLength(value) {
        this.setStateValue('crankPinLength', value);
    }

    public get throwRadius() {
        return this.getStateValue('throwRadius');
    }

    public set throwRadius(value) {
        this.setStateValue('throwRadius', value);
    }

    public get webWidth() {
        return this.getStateValue('webWidth');
    }

    public set webWidth(value) {
        this.setStateValue('webWidth', value);
    }

    public get webThickness() {
        return this.getStateValue('webThickness');
    }

    public set webThickness(value) {
        this.setStateValue('webThickness', value);
    }

    public get counterweightRadius() {
        return this.getStateValue('counterweightRadius');
    }

    public set counterweightRadius(value) {
        this.setStateValue('counterweightRadius', value);
    }

    public get counterweightThickness() {
        return this.getStateValue('counterweightThickness');
    }

    public set counterweightThickness(value) {
        this.setStateValue('counterweightThickness', value);
    }

    public get snoutLength() {
        return this.getStateValue('snoutLength');
    }

    public set snoutLength(value) {
        this.setStateValue('snoutLength', value);
    }

    public get snoutRadius() {
        return this.getStateValue('snoutRadius');
    }

    public set snoutRadius(value) {
        this.setStateValue('snoutRadius', value);
    }

    public get flangeRadius() {
        return this.getStateValue('flangeRadius');
    }

    public set flangeRadius(value) {
        this.setStateValue('flangeRadius', value);
    }

    public get flangeThickness() {
        return this.getStateValue('flangeThickness');
    }

    public set flangeThickness(value) {
        this.setStateValue('flangeThickness', value);
    }

    public get segments() {
        return this.getStateValue('segments');
    }

    public set segments(value) {
        this.setStateValue('segments', value);
    }

    constructor(options: Shape3DOptions<CrankshaftState>) {
        super('crankshaft', {
            mainJournalRadius: 0.08,
            mainJournalLength: 0.12,
            crankPinRadius: 0.06,
            crankPinLength: 0.18,
            throwRadius: 0.15,
            webWidth: 0.04,
            webThickness: 0.22,
            counterweightRadius: 0.2,
            counterweightThickness: 0.04,
            snoutLength: 0.15,
            snoutRadius: 0.05,
            flangeRadius: 0.18,
            flangeThickness: 0.04,
            segments: 24,
            ...options,
        });
    }

    private cylinderBody(cx: number, cy: number, z1: number, z2: number, radius: number, segs: number): Face3D[] {
        const faces: Face3D[] = [];

        for (let i = 0; i < segs; i++) {
            const a1 = (i / segs) * Math.PI * 2;
            const a2 = ((i + 1) / segs) * Math.PI * 2;
            const c1 = Math.cos(a1);
            const s1 = Math.sin(a1);
            const c2 = Math.cos(a2);
            const s2 = Math.sin(a2);

            const f1: Vector3 = [cx + c1 * radius, cy + s1 * radius, z1];
            const f2: Vector3 = [cx + c2 * radius, cy + s2 * radius, z1];
            const b1: Vector3 = [cx + c1 * radius, cy + s1 * radius, z2];
            const b2: Vector3 = [cx + c2 * radius, cy + s2 * radius, z2];

            faces.push({ vertices: [f1, f2, b2, b1] });
        }

        return faces;
    }

    private disc(cx: number, cy: number, zz: number, radius: number, segs: number, normalDir: number): Face3D[] {
        const faces: Face3D[] = [];
        const nz = normalDir > 0 ? 1 : -1;

        for (let i = 0; i < segs; i++) {
            const a1 = (i / segs) * Math.PI * 2;
            const a2 = ((i + 1) / segs) * Math.PI * 2;
            const p1: Vector3 = [cx + Math.cos(a1) * radius, cy + Math.sin(a1) * radius, zz];
            const p2: Vector3 = [cx + Math.cos(a2) * radius, cy + Math.sin(a2) * radius, zz];

            if (nz > 0) {
                faces.push({
                    vertices: [[cx, cy, zz], p1, p2],
                    normal: [0, 0, nz],
                });
            } else {
                faces.push({
                    vertices: [[cx, cy, zz], p2, p1],
                    normal: [0, 0, nz],
                });
            }
        }

        return faces;
    }

    private annularDisc(cx: number, cy: number, zz: number, innerR: number, outerR: number, segs: number, normalDir: number): Face3D[] {
        const faces: Face3D[] = [];
        const nz = normalDir > 0 ? 1 : -1;

        for (let i = 0; i < segs; i++) {
            const a1 = (i / segs) * Math.PI * 2;
            const a2 = ((i + 1) / segs) * Math.PI * 2;
            const c1 = Math.cos(a1);
            const s1 = Math.sin(a1);
            const c2 = Math.cos(a2);
            const s2 = Math.sin(a2);

            const inner1: Vector3 = [cx + c1 * innerR, cy + s1 * innerR, zz];
            const inner2: Vector3 = [cx + c2 * innerR, cy + s2 * innerR, zz];
            const outer1: Vector3 = [cx + c1 * outerR, cy + s1 * outerR, zz];
            const outer2: Vector3 = [cx + c2 * outerR, cy + s2 * outerR, zz];

            if (nz > 0) {
                faces.push({
                    vertices: [inner1, outer1, outer2, inner2],
                    normal: [0, 0, nz],
                });
            } else {
                faces.push({
                    vertices: [inner2, outer2, outer1, inner1],
                    normal: [0, 0, nz],
                });
            }
        }

        return faces;
    }

    protected computeFaces(): Face3D[] {
        const faces: Face3D[] = [];
        const segs = this.segments;
        const mjr = this.mainJournalRadius;
        const mjl = this.mainJournalLength;
        const cpr = this.crankPinRadius;
        const cpl = this.crankPinLength;
        const tr = this.throwRadius;
        const ww = this.webWidth;
        const wt = this.webThickness;
        const cwr = this.counterweightRadius;
        const cwt = this.counterweightThickness;

        const totalLength = NUM_MAIN_JOURNALS * mjl + NUM_CYLINDERS * (cpl + ww * 2);
        const startZ = totalLength / 2;

        let zCursor = startZ;

        // Front snout
        const snoutZ1 = zCursor + this.snoutLength;
        const snoutZ2 = zCursor;
        faces.push(...this.cylinderBody(0, 0, snoutZ1, snoutZ2, this.snoutRadius, segs));
        faces.push(...this.disc(0, 0, snoutZ1, this.snoutRadius, segs, 1));

        for (let cyl = 0; cyl < NUM_CYLINDERS; cyl++) {
            // Main journal before this cylinder
            const mjZ1 = zCursor;
            const mjZ2 = zCursor - mjl;
            faces.push(...this.cylinderBody(0, 0, mjZ1, mjZ2, mjr, segs));
            faces.push(...this.disc(0, 0, mjZ1, mjr, segs, 1));
            faces.push(...this.disc(0, 0, mjZ2, mjr, segs, -1));
            zCursor = mjZ2;

            // Crank pin offset
            const phase = CRANK_PHASES[cyl];
            const pinCX = Math.cos(phase) * tr;
            const pinCY = Math.sin(phase) * tr;

            // Front web (main journal -> crank pin)
            const webFZ1 = zCursor;
            const webFZ2 = zCursor - ww;
            const halfWT = wt / 2;

            // Web as a thick plate connecting journal center to pin center
            const webFrontFace: Face3D = {
                vertices: [
                    [-halfWT, -mjr, webFZ1],
                    [halfWT, -mjr, webFZ1],
                    [pinCX + halfWT, pinCY + cpr, webFZ1],
                    [pinCX - halfWT, pinCY + cpr, webFZ1],
                ],
                normal: [0, 0, 1],
            };

            const webBackFace: Face3D = {
                vertices: [
                    [pinCX - halfWT, pinCY + cpr, webFZ2],
                    [pinCX + halfWT, pinCY + cpr, webFZ2],
                    [halfWT, -mjr, webFZ2],
                    [-halfWT, -mjr, webFZ2],
                ],
                normal: [0, 0, -1],
            };

            const webTop: Face3D = {
                vertices: [
                    [pinCX - halfWT, pinCY + cpr, webFZ1],
                    [pinCX + halfWT, pinCY + cpr, webFZ1],
                    [pinCX + halfWT, pinCY + cpr, webFZ2],
                    [pinCX - halfWT, pinCY + cpr, webFZ2],
                ],
            };

            const webBottom: Face3D = {
                vertices: [
                    [-halfWT, -mjr, webFZ2],
                    [halfWT, -mjr, webFZ2],
                    [halfWT, -mjr, webFZ1],
                    [-halfWT, -mjr, webFZ1],
                ],
            };

            const webLeft: Face3D = {
                vertices: [
                    [-halfWT, -mjr, webFZ1],
                    [pinCX - halfWT, pinCY + cpr, webFZ1],
                    [pinCX - halfWT, pinCY + cpr, webFZ2],
                    [-halfWT, -mjr, webFZ2],
                ],
            };

            const webRight: Face3D = {
                vertices: [
                    [halfWT, -mjr, webFZ2],
                    [pinCX + halfWT, pinCY + cpr, webFZ2],
                    [pinCX + halfWT, pinCY + cpr, webFZ1],
                    [halfWT, -mjr, webFZ1],
                ],
            };

            faces.push(webFrontFace, webBackFace, webTop, webBottom, webLeft, webRight);

            // Counterweight on opposite side of crank pin
            const cwSegs = 16;
            const cwHalfT = cwt / 2;

            for (let i = 0; i < cwSegs; i++) {
                const startAngle = phase + Math.PI - Math.PI * 0.4;
                const a1 = startAngle + (i / cwSegs) * Math.PI * 0.8;
                const a2 = startAngle + ((i + 1) / cwSegs) * Math.PI * 0.8;
                const ox1 = Math.cos(a1) * cwr;
                const oy1 = Math.sin(a1) * cwr;
                const ox2 = Math.cos(a2) * cwr;
                const oy2 = Math.sin(a2) * cwr;

                // Outer arc surface
                const cwZ1 = webFZ1 - (ww - cwHalfT) / 2;
                const cwZ2 = cwZ1 - cwt;

                faces.push({
                    vertices: [
                        [ox1, oy1, cwZ1],
                        [ox2, oy2, cwZ1],
                        [ox2, oy2, cwZ2],
                        [ox1, oy1, cwZ2],
                    ],
                });

                // Front cap
                faces.push({
                    vertices: [[0, 0, cwZ1], [ox1, oy1, cwZ1], [ox2, oy2, cwZ1]],
                    normal: [0, 0, 1],
                });

                // Back cap
                faces.push({
                    vertices: [[0, 0, cwZ2], [ox2, oy2, cwZ2], [ox1, oy1, cwZ2]],
                    normal: [0, 0, -1],
                });
            }

            zCursor = webFZ2;

            // Crank pin
            const cpZ1 = zCursor;
            const cpZ2 = zCursor - cpl;
            faces.push(...this.cylinderBody(pinCX, pinCY, cpZ1, cpZ2, cpr, segs));
            faces.push(...this.disc(pinCX, pinCY, cpZ1, cpr, segs, 1));
            faces.push(...this.disc(pinCX, pinCY, cpZ2, cpr, segs, -1));
            zCursor = cpZ2;

            // Rear web (crank pin -> next main journal)
            const webRZ1 = zCursor;
            const webRZ2 = zCursor - ww;

            faces.push({
                vertices: [
                    [pinCX - halfWT, pinCY + cpr, webRZ1],
                    [pinCX + halfWT, pinCY + cpr, webRZ1],
                    [halfWT, -mjr, webRZ1],
                    [-halfWT, -mjr, webRZ1],
                ],
                normal: [0, 0, 1],
            });

            faces.push({
                vertices: [
                    [-halfWT, -mjr, webRZ2],
                    [halfWT, -mjr, webRZ2],
                    [pinCX + halfWT, pinCY + cpr, webRZ2],
                    [pinCX - halfWT, pinCY + cpr, webRZ2],
                ],
                normal: [0, 0, -1],
            });

            faces.push({
                vertices: [
                    [pinCX - halfWT, pinCY + cpr, webRZ1],
                    [-halfWT, -mjr, webRZ1],
                    [-halfWT, -mjr, webRZ2],
                    [pinCX - halfWT, pinCY + cpr, webRZ2],
                ],
            });

            faces.push({
                vertices: [
                    [-halfWT, -mjr, webRZ1],
                    [halfWT, -mjr, webRZ1],
                    [halfWT, -mjr, webRZ2],
                    [-halfWT, -mjr, webRZ2],
                ],
            });

            faces.push({
                vertices: [
                    [halfWT, -mjr, webRZ1],
                    [pinCX + halfWT, pinCY + cpr, webRZ1],
                    [pinCX + halfWT, pinCY + cpr, webRZ2],
                    [halfWT, -mjr, webRZ2],
                ],
            });

            faces.push({
                vertices: [
                    [pinCX + halfWT, pinCY + cpr, webRZ1],
                    [pinCX - halfWT, pinCY + cpr, webRZ1],
                    [pinCX - halfWT, pinCY + cpr, webRZ2],
                    [pinCX + halfWT, pinCY + cpr, webRZ2],
                ],
            });

            zCursor = webRZ2;
        }

        // Final (5th) main journal
        const finalMjZ1 = zCursor;
        const finalMjZ2 = zCursor - mjl;
        faces.push(...this.cylinderBody(0, 0, finalMjZ1, finalMjZ2, mjr, segs));
        faces.push(...this.disc(0, 0, finalMjZ1, mjr, segs, 1));
        faces.push(...this.disc(0, 0, finalMjZ2, mjr, segs, -1));
        zCursor = finalMjZ2;

        // Flywheel flange
        const flZ1 = zCursor;
        const flZ2 = zCursor - this.flangeThickness;
        faces.push(...this.cylinderBody(0, 0, flZ1, flZ2, this.flangeRadius, segs));
        faces.push(...this.annularDisc(0, 0, flZ1, mjr, this.flangeRadius, segs, 1));
        faces.push(...this.disc(0, 0, flZ2, this.flangeRadius, segs, -1));

        return faces;
    }

}

export function createCrankshaft(...options: ConstructorParameters<typeof Crankshaft>) {
    return new Crankshaft(...options);
}

export function elementIsCrankshaft(value: unknown): value is Crankshaft {
    return value instanceof Crankshaft;
}
