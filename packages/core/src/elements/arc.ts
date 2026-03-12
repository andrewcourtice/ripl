import type {
    Context,
} from '../context';

import {
    Shape2D,
} from '../core';

import type {
    BaseElementState,
    Shape2DOptions,
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

/** State interface for an arc element, defining center, angles, radii, pad angle, and border radius. */
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

/** An arc or annular sector shape supporting inner radius and pad angle. */
export class Arc extends Shape2D<ArcState> {

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

    constructor(options: Shape2DOptions<ArcState>) {
        super('arc', options);
    }

    /** Computes the centroid point of this arc, optionally with state overrides. */
    public getCentroid(alterations?: Partial<ArcState>) {
        const {
            cx,
            cy,
            radius,
            startAngle,
            endAngle,
            innerRadius = 0,
        } = {
            cx: this.cx,
            cy: this.cy,
            radius: this.radius,
            startAngle: this.startAngle,
            endAngle: this.endAngle,
            innerRadius: this.innerRadius,
            ...alterations,
        };

        const angle = (startAngle + endAngle) / 2;
        const distance = innerRadius + (radius - innerRadius) / 2;

        return getThetaPoint(angle, distance, cx, cy);
    }

    public getBoundingBox(): Box {
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

        radius = Math.max(0, radius);
        innerRadius = typeIsNil(innerRadius) ? innerRadius : Math.max(0, innerRadius);

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
        });
    }

}

/** Factory function that creates a new `Arc` instance. */
export function createArc(...options: ConstructorParameters<typeof Arc>) {
    return new Arc(...options);
}

/** Type guard that checks whether a value is an `Arc` instance. */
export function elementIsArc(value: unknown): value is Arc {
    return value instanceof Arc;
}