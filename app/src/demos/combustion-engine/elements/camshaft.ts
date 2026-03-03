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

export interface CamshaftState extends Shape3DState {
    shaftRadius: number;
    shaftLength: number;
    lobeBaseRadius: number;
    lobeLift: number;
    lobeWidth: number;
    lobeSegments: number;
    journalRadius: number;
    journalWidth: number;
    journalSegments: number;
    sprocketRadius: number;
    sprocketThickness: number;
    sprocketTeeth: number;
    boreSpacing: number;
    shaftSegments: number;
}

export class Camshaft extends Shape3D<CamshaftState> {

    public get shaftRadius() {
        return this.getStateValue('shaftRadius');
    }

    public set shaftRadius(value) {
        this.setStateValue('shaftRadius', value);
    }

    public get shaftLength() {
        return this.getStateValue('shaftLength');
    }

    public set shaftLength(value) {
        this.setStateValue('shaftLength', value);
    }

    public get lobeBaseRadius() {
        return this.getStateValue('lobeBaseRadius');
    }

    public set lobeBaseRadius(value) {
        this.setStateValue('lobeBaseRadius', value);
    }

    public get lobeLift() {
        return this.getStateValue('lobeLift');
    }

    public set lobeLift(value) {
        this.setStateValue('lobeLift', value);
    }

    public get lobeWidth() {
        return this.getStateValue('lobeWidth');
    }

    public set lobeWidth(value) {
        this.setStateValue('lobeWidth', value);
    }

    public get lobeSegments() {
        return this.getStateValue('lobeSegments');
    }

    public set lobeSegments(value) {
        this.setStateValue('lobeSegments', value);
    }

    public get journalRadius() {
        return this.getStateValue('journalRadius');
    }

    public set journalRadius(value) {
        this.setStateValue('journalRadius', value);
    }

    public get journalWidth() {
        return this.getStateValue('journalWidth');
    }

    public set journalWidth(value) {
        this.setStateValue('journalWidth', value);
    }

    public get journalSegments() {
        return this.getStateValue('journalSegments');
    }

    public set journalSegments(value) {
        this.setStateValue('journalSegments', value);
    }

    public get sprocketRadius() {
        return this.getStateValue('sprocketRadius');
    }

    public set sprocketRadius(value) {
        this.setStateValue('sprocketRadius', value);
    }

    public get sprocketThickness() {
        return this.getStateValue('sprocketThickness');
    }

    public set sprocketThickness(value) {
        this.setStateValue('sprocketThickness', value);
    }

    public get sprocketTeeth() {
        return this.getStateValue('sprocketTeeth');
    }

    public set sprocketTeeth(value) {
        this.setStateValue('sprocketTeeth', value);
    }

    public get boreSpacing() {
        return this.getStateValue('boreSpacing');
    }

    public set boreSpacing(value) {
        this.setStateValue('boreSpacing', value);
    }

    public get shaftSegments() {
        return this.getStateValue('shaftSegments');
    }

    public set shaftSegments(value) {
        this.setStateValue('shaftSegments', value);
    }

    constructor(options: Shape3DOptions<CamshaftState>) {
        super('camshaft', {
            shaftRadius: 0.025,
            shaftLength: 1.3,
            lobeBaseRadius: 0.03,
            lobeLift: 0.02,
            lobeWidth: 0.025,
            lobeSegments: 32,
            journalRadius: 0.032,
            journalWidth: 0.02,
            journalSegments: 24,
            sprocketRadius: 0.06,
            sprocketThickness: 0.015,
            sprocketTeeth: 24,
            boreSpacing: 0.28,
            shaftSegments: 24,
            ...options,
        });
    }

    private camLobeProfile(angle: number): number {
        const baseR = this.lobeBaseRadius;
        const lift = this.lobeLift;

        // Smooth lobe profile: base circle + raised nose
        const nosePeak = 0;
        const noseWidth = Math.PI * 0.35;
        let diff = angle - nosePeak;

        // Normalize to [-PI, PI]
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        if (Math.abs(diff) < noseWidth) {
            const tt = Math.abs(diff) / noseWidth;
            const smooth = 1 - tt * tt * (3 - 2 * tt);
            return baseR + lift * smooth;
        }

        return baseR;
    }

    protected computeFaces(): Face3D[] {
        const faces: Face3D[] = [];
        const sr = this.shaftRadius;
        const sl = this.shaftLength;
        const sSegs = this.shaftSegments;
        const lSegs = this.lobeSegments;
        const lw = this.lobeWidth;
        const jr = this.journalRadius;
        const jw = this.journalWidth;
        const jSegs = this.journalSegments;
        const bs = this.boreSpacing;

        const halfL = sl / 2;

        // Main shaft body
        for (let i = 0; i < sSegs; i++) {
            const a1 = (i / sSegs) * Math.PI * 2;
            const a2 = ((i + 1) / sSegs) * Math.PI * 2;
            const c1 = Math.cos(a1);
            const s1 = Math.sin(a1);
            const c2 = Math.cos(a2);
            const s2 = Math.sin(a2);

            faces.push({
                vertices: [
                    [c1 * sr, s1 * sr, halfL],
                    [c2 * sr, s2 * sr, halfL],
                    [c2 * sr, s2 * sr, -halfL],
                    [c1 * sr, s1 * sr, -halfL],
                ],
            });

            // Front cap
            faces.push({
                vertices: [
                    [0, 0, halfL],
                    [c1 * sr, s1 * sr, halfL],
                    [c2 * sr, s2 * sr, halfL],
                ],
                normal: [0, 0, 1],
            });

            // Back cap
            faces.push({
                vertices: [
                    [0, 0, -halfL],
                    [c2 * sr, s2 * sr, -halfL],
                    [c1 * sr, s1 * sr, -halfL],
                ],
                normal: [0, 0, -1],
            });
        }

        // Cam lobes: 8 total (2 per cylinder — intake + exhaust)
        // Intake and exhaust lobes are phased differently
        const intakePhases = [0, Math.PI, Math.PI, 0];
        const exhaustPhases = [Math.PI, 0, 0, Math.PI];

        for (let cyl = 0; cyl < 4; cyl++) {
            const lobeZ = -halfL + bs * 0.5 + cyl * bs + bs * 0.15;

            for (let lobeIdx = 0; lobeIdx < 2; lobeIdx++) {
                const phase = lobeIdx === 0 ? intakePhases[cyl] : exhaustPhases[cyl];
                const lobeOffset = lobeIdx === 0 ? -lw * 0.8 : lw * 0.8;
                const lobeCenter = lobeZ + lobeOffset;
                const halfLW = lw / 2;

                for (let i = 0; i < lSegs; i++) {
                    const a1 = (i / lSegs) * Math.PI * 2;
                    const a2 = ((i + 1) / lSegs) * Math.PI * 2;

                    const r1 = this.camLobeProfile(a1 + phase);
                    const r2 = this.camLobeProfile(a2 + phase);

                    const x1f = Math.cos(a1) * r1;
                    const y1f = Math.sin(a1) * r1;
                    const x2f = Math.cos(a2) * r2;
                    const y2f = Math.sin(a2) * r2;

                    // Lobe outer surface
                    faces.push({
                        vertices: [
                            [x1f, y1f, lobeCenter + halfLW],
                            [x2f, y2f, lobeCenter + halfLW],
                            [x2f, y2f, lobeCenter - halfLW],
                            [x1f, y1f, lobeCenter - halfLW],
                        ],
                    });

                    // Front face
                    faces.push({
                        vertices: [
                            [0, 0, lobeCenter + halfLW],
                            [x1f, y1f, lobeCenter + halfLW],
                            [x2f, y2f, lobeCenter + halfLW],
                        ],
                        normal: [0, 0, 1],
                    });

                    // Back face
                    faces.push({
                        vertices: [
                            [0, 0, lobeCenter - halfLW],
                            [x2f, y2f, lobeCenter - halfLW],
                            [x1f, y1f, lobeCenter - halfLW],
                        ],
                        normal: [0, 0, -1],
                    });
                }
            }
        }

        // Bearing journals (5, between and at ends of cylinder pairs)
        for (let jn = 0; jn < 5; jn++) {
            const journalZ = -halfL + bs * 0.15 + jn * bs;
            const halfJW = jw / 2;

            for (let i = 0; i < jSegs; i++) {
                const a1 = (i / jSegs) * Math.PI * 2;
                const a2 = ((i + 1) / jSegs) * Math.PI * 2;
                const c1 = Math.cos(a1);
                const s1 = Math.sin(a1);
                const c2 = Math.cos(a2);
                const s2 = Math.sin(a2);

                // Journal outer surface
                faces.push({
                    vertices: [
                        [c1 * jr, s1 * jr, journalZ + halfJW],
                        [c2 * jr, s2 * jr, journalZ + halfJW],
                        [c2 * jr, s2 * jr, journalZ - halfJW],
                        [c1 * jr, s1 * jr, journalZ - halfJW],
                    ],
                });

                // Front annular ring
                faces.push({
                    vertices: [
                        [c1 * sr, s1 * sr, journalZ + halfJW],
                        [c2 * sr, s2 * sr, journalZ + halfJW],
                        [c2 * jr, s2 * jr, journalZ + halfJW],
                        [c1 * jr, s1 * jr, journalZ + halfJW],
                    ],
                    normal: [0, 0, 1],
                });

                // Back annular ring
                faces.push({
                    vertices: [
                        [c1 * jr, s1 * jr, journalZ - halfJW],
                        [c2 * jr, s2 * jr, journalZ - halfJW],
                        [c2 * sr, s2 * sr, journalZ - halfJW],
                        [c1 * sr, s1 * sr, journalZ - halfJW],
                    ],
                    normal: [0, 0, -1],
                });
            }
        }

        // Drive sprocket at front end
        const spR = this.sprocketRadius;
        const spT = this.sprocketThickness;
        const teeth = this.sprocketTeeth;
        const spZ = halfL;
        const toothHeight = 0.008;

        for (let i = 0; i < teeth; i++) {
            const a1 = (i / teeth) * Math.PI * 2;
            const a2 = ((i + 0.3) / teeth) * Math.PI * 2;
            const a3 = ((i + 0.7) / teeth) * Math.PI * 2;
            const a4 = ((i + 1) / teeth) * Math.PI * 2;

            const outerR = spR + toothHeight;

            // Tooth profile (trapezoidal)
            const p1: Vector3 = [Math.cos(a1) * spR, Math.sin(a1) * spR, spZ + spT];
            const p2: Vector3 = [Math.cos(a2) * outerR, Math.sin(a2) * outerR, spZ + spT];
            const p3: Vector3 = [Math.cos(a3) * outerR, Math.sin(a3) * outerR, spZ + spT];
            const p4: Vector3 = [Math.cos(a4) * spR, Math.sin(a4) * spR, spZ + spT];

            // Front face
            faces.push({ vertices: [p1, p2, p3, p4] });

            // Back face
            const b1: Vector3 = [p1[0], p1[1], spZ];
            const b2: Vector3 = [p2[0], p2[1], spZ];
            const b3: Vector3 = [p3[0], p3[1], spZ];
            const b4: Vector3 = [p4[0], p4[1], spZ];
            faces.push({ vertices: [b4, b3, b2, b1] });

            // Outer edge
            faces.push({ vertices: [p2, p3, b3, b2] });

            // Side edges
            faces.push({ vertices: [p1, p2, b2, b1] });
            faces.push({ vertices: [p3, p4, b4, b3] });
        }

        return faces;
    }

}

export function createCamshaft(...options: ConstructorParameters<typeof Camshaft>) {
    return new Camshaft(...options);
}

export function elementIsCamshaft(value: unknown): value is Camshaft {
    return value instanceof Camshaft;
}
