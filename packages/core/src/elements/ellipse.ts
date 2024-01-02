import {
    BaseElementState,
    Context,
    Shape,
    ShapeOptions,
} from '../core';

import {
    Box,
} from '../math';

export interface EllipseState extends BaseElementState {
    cx: number;
    cy: number;
    radiusX: number;
    radiusY: number;
    rotation: number;
    startAngle: number;
    endAngle: number;
}

export function elementIsEllipse(value: unknown): value is Ellipse {
    return value instanceof Ellipse;
}

export function createEllipse(...options: ConstructorParameters<typeof Ellipse>) {
    return new Ellipse(...options);
}

export class Ellipse extends Shape<EllipseState> {

    public get cx() {
        return this.getStateValue('cx');
    }

    public set cx(value) {
        this.setStateValue('cx', value);
    }

    public get cy() {
        return this.getStateValue('cy');
    }

    public set cy(value) {
        this.setStateValue('cy', value);
    }

    public get radiusX() {
        return this.getStateValue('radiusX');
    }

    public set radiusX(value) {
        this.setStateValue('radiusX', value);
    }

    public get radiusY() {
        return this.getStateValue('radiusY');
    }

    public set radiusY(value) {
        this.setStateValue('radiusY', value);
    }

    public get rotation() {
        return this.getStateValue('rotation');
    }

    public set rotation(value) {
        this.setStateValue('rotation', value);
    }

    public get startAngle() {
        return this.getStateValue('startAngle');
    }

    public set startAngle(value) {
        this.setStateValue('startAngle', value);
    }

    public get endAngle() {
        return this.getStateValue('endAngle');
    }

    public set endAngle(value) {
        this.setStateValue('endAngle', value);
    }

    constructor(options: ShapeOptions<EllipseState>) {
        super('ellipse', options);
    }

    public getBoundingBox(): Box {
        return new Box(
            this.cy - this.radiusY,
            this.cx - this.radiusX,
            this.cy + this.radiusY,
            this.cx + this.radiusX
        );
    }

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