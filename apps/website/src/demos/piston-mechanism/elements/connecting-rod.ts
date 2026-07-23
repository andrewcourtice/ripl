import {
    Shape3D,
} from '@ripl/3d';

import type {
    Face3D,
    Shape3DOptions,
    Shape3DState,
} from '@ripl/3d';

import {
    box,
    ringZ,
} from './geometry';

export interface ConnectingRodState extends Shape3DState {
    /** Distance between the small-end and big-end centers. */
    length: number;
    /** Outer radius of the small end (wrist-pin end). */
    smallEndRadius: number;
    /** Outer radius of the big end (crank-pin end). */
    bigEndRadius: number;
    /** Thickness of the rod along Z. */
    width: number;
    /** Width of the connecting beam along X. */
    beamWidth: number;
    /** Number of segments used to tessellate the end rings. */
    segments: number;
}

/** A basic connecting rod: a small-end ring, a big-end ring and a beam joining them along Y. */
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

    public get width() {
        return this.getStateValue('width');
    }

    public set width(value) {
        this.setStateValue('width', value);
    }

    public get beamWidth() {
        return this.getStateValue('beamWidth');
    }

    public set beamWidth(value) {
        this.setStateValue('beamWidth', value);
    }

    public get segments() {
        return this.getStateValue('segments');
    }

    public set segments(value) {
        this.setStateValue('segments', value);
    }

    constructor(options?: Shape3DOptions<ConnectingRodState>) {
        super('connecting-rod', {
            length: 0.4,
            smallEndRadius: 0.03,
            bigEndRadius: 0.05,
            width: 0.05,
            beamWidth: 0.03,
            segments: 18,
            ...options,
        });
    }

    protected computeFaces(): Face3D[] {
        const faces: Face3D[] = [];
        const halfLength = this.length / 2;
        const smallR = this.smallEndRadius;
        const bigR = this.bigEndRadius;
        const halfWidth = this.width / 2;
        const halfBeam = this.beamWidth / 2;
        const beamDepth = this.width * 0.6;
        const segs = this.segments;

        // Small end (top, +Y): rides the piston's wrist pin.
        faces.push(...ringZ(0, halfLength, smallR * 0.55, smallR, -halfWidth, halfWidth, segs));

        // Big end (bottom, -Y): rides the crank pin.
        faces.push(...ringZ(0, -halfLength, bigR * 0.6, bigR, -halfWidth, halfWidth, segs));

        // Beam joining the two ends.
        faces.push(...box(
            -halfBeam,
            -halfLength + bigR * 0.5,
            -beamDepth / 2,
            halfBeam,
            halfLength - smallR * 0.5,
            beamDepth / 2
        ));

        return faces;
    }

}

/** Creates a {@link ConnectingRod} element. */
export function createConnectingRod(...options: ConstructorParameters<typeof ConnectingRod>) {
    return new ConnectingRod(...options);
}

/** Type guard for {@link ConnectingRod} elements. */
export function elementIsConnectingRod(value: unknown): value is ConnectingRod {
    return value instanceof ConnectingRod;
}
