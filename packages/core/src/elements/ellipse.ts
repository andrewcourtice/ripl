import {
    Shape2D,
} from '../core';

import type {
    BaseElementState,
    Shape2DOptions,
} from '../core';

import type {
    Context,
} from '../context';

import {
    Box,
} from '../math';

/** State interface for an ellipse element, defining center, radii, rotation, and angle range. */
export interface EllipseState extends BaseElementState {
    /** The x-coordinate of the ellipse's center. */
    cx: number;
    /** The y-coordinate of the ellipse's center. */
    cy: number;
    /** The horizontal radius of the ellipse. */
    radiusX: number;
    /** The vertical radius of the ellipse. */
    radiusY: number;
    /** The rotation of the ellipse, in radians. */
    rotation: number;
    /** The start angle of the ellipse's arc, in radians. */
    startAngle: number;
    /** The end angle of the ellipse's arc, in radians. */
    endAngle: number;
}

/** An ellipse shape rendered at a center point with separate x/y radii, rotation, and angle range. */
export class Ellipse extends Shape2D<EllipseState> {

    /** The x-coordinate of the ellipse's center. */
    public get cx() {
        return this.getStateValue('cx');
    }

    public set cx(value) {
        this.setStateValue('cx', value);
    }

    /** The y-coordinate of the ellipse's center. */
    public get cy() {
        return this.getStateValue('cy');
    }

    public set cy(value) {
        this.setStateValue('cy', value);
    }

    /** The horizontal radius of the ellipse. */
    public get radiusX() {
        return this.getStateValue('radiusX');
    }

    public set radiusX(value) {
        this.setStateValue('radiusX', value);
    }

    /** The vertical radius of the ellipse. */
    public get radiusY() {
        return this.getStateValue('radiusY');
    }

    public set radiusY(value) {
        this.setStateValue('radiusY', value);
    }

    /** The rotation of the ellipse, in radians. */
    public get rotation() {
        return this.getStateValue('rotation');
    }

    public set rotation(value) {
        this.setStateValue('rotation', value);
    }

    /** The start angle of the ellipse's arc, in radians. */
    public get startAngle() {
        return this.getStateValue('startAngle');
    }

    public set startAngle(value) {
        this.setStateValue('startAngle', value);
    }

    /** The end angle of the ellipse's arc, in radians. */
    public get endAngle() {
        return this.getStateValue('endAngle');
    }

    public set endAngle(value) {
        this.setStateValue('endAngle', value);
    }

    constructor(options: Shape2DOptions<EllipseState>) {
        super('ellipse', options);
    }

    /** Returns the axis-aligned bounding box of the ellipse. */
    public getBoundingBox(): Box {
        return new Box(
            this.cy - this.radiusY,
            this.cx - this.radiusX,
            this.cy + this.radiusY,
            this.cx + this.radiusX
        );
    }

    /** Renders the ellipse to the provided {@link Context}. */
    public render(context: Context) {
        return super.render(context, path => {
            path.ellipse(
                this.cx,
                this.cy,
                this.radiusX,
                this.radiusY,
                this.rotation,
                this.startAngle,
                this.endAngle
            );
        });
    }

}

/** Factory function that creates a new `Ellipse` instance. */
export function createEllipse(...options: ConstructorParameters<typeof Ellipse>) {
    return new Ellipse(...options);
}

/** Type guard that checks whether a value is an `Ellipse` instance. */
export function elementIsEllipse(value: unknown): value is Ellipse {
    return value instanceof Ellipse;
}