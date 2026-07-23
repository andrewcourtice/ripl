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
    cylinderZ,
} from './geometry';

export interface CrankshaftState extends Shape3DState {
    /** Radius of the main journal (the rotation axis). */
    mainRadius: number;
    /** Radius of the offset crank pin the connecting rod rides on. */
    pinRadius: number;
    /** Offset of the crank pin from the main axis (the crank throw). */
    throw: number;
    /** Total length of the shaft along Z. */
    width: number;
    /** Number of segments used to tessellate the cylinders. */
    segments: number;
}

/** A basic single-throw crankshaft: a main journal, an offset crank pin, two webs and a counterweight. */
export class Crankshaft extends Shape3D<CrankshaftState> {

    public get mainRadius() {
        return this.getStateValue('mainRadius');
    }

    public set mainRadius(value) {
        this.setStateValue('mainRadius', value);
    }

    public get pinRadius() {
        return this.getStateValue('pinRadius');
    }

    public set pinRadius(value) {
        this.setStateValue('pinRadius', value);
    }

    public get throw() {
        return this.getStateValue('throw');
    }

    public set throw(value) {
        this.setStateValue('throw', value);
    }

    public get width() {
        return this.getStateValue('width');
    }

    public set width(value) {
        this.setStateValue('width', value);
    }

    public get segments() {
        return this.getStateValue('segments');
    }

    public set segments(value) {
        this.setStateValue('segments', value);
    }

    constructor(options?: Shape3DOptions<CrankshaftState>) {
        super('crankshaft', {
            mainRadius: 0.035,
            pinRadius: 0.03,
            throw: 0.15,
            width: 0.5,
            segments: 20,
            ...options,
        });
    }

    protected computeFaces(): Face3D[] {
        const faces: Face3D[] = [];
        const main = this.mainRadius;
        const pin = this.pinRadius;
        const thr = this.throw;
        const halfWidth = this.width / 2;
        const segs = this.segments;

        const pinHalf = this.width * 0.18;
        const webHalf = main * 1.4;
        const webThickness = main;

        // Main journal along Z — the axis the whole crank rotates about. The pin is offset along +X
        // so that a `rotationZ` of θ places it at (cos θ · throw, sin θ · throw), matching the
        // slider-crank kinematics the demo drives the rod and piston with.
        faces.push(...cylinderZ(0, 0, main, -halfWidth, halfWidth, segs));

        // Offset crank pin (the connecting rod's big end rides here).
        faces.push(...cylinderZ(thr, 0, pin, -pinHalf, pinHalf, segs));

        for (const centerZ of [-pinHalf, pinHalf]) {
            const zNear = centerZ - webThickness / 2;
            const zFar = centerZ + webThickness / 2;

            // Web plate connecting the main journal to the crank pin.
            faces.push(...box(-main, -webHalf, zNear, thr, webHalf, zFar));

            // Counterweight on the opposite side of the axis for visual balance.
            faces.push(...box(-thr - pin, -webHalf * 1.3, zNear, -main, webHalf * 1.3, zFar));
        }

        return faces;
    }

}

/** Creates a {@link Crankshaft} element. */
export function createCrankshaft(...options: ConstructorParameters<typeof Crankshaft>) {
    return new Crankshaft(...options);
}

/** Type guard for {@link Crankshaft} elements. */
export function elementIsCrankshaft(value: unknown): value is Crankshaft {
    return value instanceof Crankshaft;
}
