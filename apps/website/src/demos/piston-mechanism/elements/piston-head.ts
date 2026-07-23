import {
    Shape3D,
} from '@ripl/3d';

import type {
    Face3D,
    Shape3DOptions,
    Shape3DState,
} from '@ripl/3d';

import {
    cylinderY,
    cylinderZ,
} from './geometry';

export interface PistonHeadState extends Shape3DState {
    /** Radius of the piston bore. */
    radius: number;
    /** Height of the piston body along Y (crown + skirt). */
    height: number;
    /** Radius of the wrist pin that connects to the rod's small end. */
    pinRadius: number;
    /** Length of the wrist pin along Z (pokes out either side as a boss). */
    pinLength: number;
    /** Number of segments used to tessellate the cylinders. */
    segments: number;
}

/** A basic piston head: a capped cylinder body with a wrist pin through its lower half. */
export class PistonHead extends Shape3D<PistonHeadState> {

    public get radius() {
        return this.getStateValue('radius');
    }

    public set radius(value) {
        this.setStateValue('radius', value);
    }

    public get height() {
        return this.getStateValue('height');
    }

    public set height(value) {
        this.setStateValue('height', value);
    }

    public get pinRadius() {
        return this.getStateValue('pinRadius');
    }

    public set pinRadius(value) {
        this.setStateValue('pinRadius', value);
    }

    public get pinLength() {
        return this.getStateValue('pinLength');
    }

    public set pinLength(value) {
        this.setStateValue('pinLength', value);
    }

    public get segments() {
        return this.getStateValue('segments');
    }

    public set segments(value) {
        this.setStateValue('segments', value);
    }

    constructor(options?: Shape3DOptions<PistonHeadState>) {
        super('piston-head', {
            radius: 0.09,
            height: 0.14,
            pinRadius: 0.02,
            pinLength: 0.22,
            segments: 24,
            ...options,
        });
    }

    protected computeFaces(): Face3D[] {
        const halfHeight = this.height / 2;
        const segs = this.segments;

        return [
            // Piston body — a capped cylinder whose bore axis runs vertically (Y).
            ...cylinderY(0, 0, this.radius, -halfHeight, halfHeight, segs),
            // Wrist pin along Z at the body's centre, where the rod's small end attaches.
            ...cylinderZ(0, 0, this.pinRadius, -this.pinLength / 2, this.pinLength / 2, 12),
        ];
    }

}

/** Creates a {@link PistonHead} element. */
export function createPistonHead(...options: ConstructorParameters<typeof PistonHead>) {
    return new PistonHead(...options);
}

/** Type guard for {@link PistonHead} elements. */
export function elementIsPistonHead(value: unknown): value is PistonHead {
    return value instanceof PistonHead;
}
