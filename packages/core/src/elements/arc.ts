import {
    BaseElementState,
    Context,
    Shape,
    ShapeOptions,
} from '../core';

import {
    Box,
    getThetaPoint,
    max,
    min,
} from '../math';

import {
    typeIsNil,
} from '@ripl/utilities';

export interface ArcState extends BaseElementState {
    cx: number;
    cy: number;
    startAngle: number;
    endAngle: number;
    radius: number;
    innerRadius?: number;
    padAngle?: number;
    borderRadius?: number;
}

export function elementIsArc(value: unknown): value is Arc {
    return value instanceof Arc;
}

export function createArc(...options: ConstructorParameters<typeof Arc>) {
    return new Arc(...options);
}

export class Arc extends Shape<ArcState> {

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

    public get radius() {
        return this.getStateValue('radius');
    }

    public set radius(value) {
        this.setStateValue('radius', value);
    }

    public get innerRadius() {
        return this.getStateValue('innerRadius');
    }

    public set innerRadius(value) {
        this.setStateValue('innerRadius', value);
    }

    public get padAngle() {
        return this.getStateValue('padAngle');
    }

    public set padAngle(value) {
        this.setStateValue('padAngle', value);
    }

    public get borderRadius() {
        return this.getStateValue('borderRadius');
    }

    public set borderRadius(value) {
        this.setStateValue('borderRadius', value);
    }

    public get centroid() {
        const {
            cx,
            cy,
            radius,
            startAngle,
            endAngle,
            innerRadius = 0,
        } = this;

        const angle = (startAngle + endAngle) / 2;
        const distance = innerRadius + (radius - innerRadius) / 2;

        return getThetaPoint(angle, distance, cx, cy);
    }

    constructor(options: ShapeOptions<ArcState>) {
        super('arc', options);
    }

    public getBoundingBox() {
        const {
            cx,
            cy,
            radius,
            innerRadius,
            startAngle,
            endAngle,
        } = this;

        const [outerX1, outerY1] = getThetaPoint(startAngle, radius, cx, cy);
        const [outerX2, outerY2] = getThetaPoint(endAngle, radius, cx, cy);

        if (typeIsNil(innerRadius)) {
            return new Box(
                min(cy, outerY1, outerY2),
                min(cx, outerX1, outerX2),
                max(cy, outerY1, outerY2),
                max(cx, outerX1, outerX2)
            );
        }

        const [innerX1, innerY1] = getThetaPoint(startAngle, innerRadius, cx, cy);
        const [innerX2, innerY2] = getThetaPoint(endAngle, innerRadius, cx, cy);

        return new Box(
            min(innerY1, innerY2, outerY1, outerY2),
            min(innerX1, innerX2, outerX1, outerX2),
            max(innerY1, innerY2, outerY1, outerY2),
            max(innerX1, innerX2, outerX1, outerX2)
        );
    }

    public render(context: Context) {
        let {
            cx,
            cy,
            radius,
            innerRadius,
            startAngle,
            endAngle,
            padAngle,
        } = this;

        return super.render(context, path => {
            if (padAngle) {
                const offset = padAngle / 2;

                startAngle = Math.min(startAngle + offset, endAngle);
                endAngle = Math.max(endAngle - offset, startAngle);
            }

            if (typeIsNil(innerRadius)) {
                return path.arc(cx, cy, radius, startAngle, endAngle);
            }

            const [x1, y1] = getThetaPoint(startAngle, radius, cx, cy);
            const [x2, y2] = getThetaPoint(endAngle, innerRadius, cx, cy);

            path.moveTo(x1, y1);
            path.arc(cx, cy, radius, startAngle, endAngle);
            path.lineTo(x2, y2);
            path.arc(cx, cy, innerRadius, endAngle, startAngle, true);
            path.lineTo(x1, y1);
            path.closePath();
        });
    }

}