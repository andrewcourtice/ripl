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
    getThetaPoint,
} from '../math';

import {
    typeIsNil,
} from '@ripl/utilities';

/** State interface for an arc element, defining center, angles, radii, pad angle, and border radius. */
export interface ArcState extends BaseElementState {
    /** The x-coordinate of the arc's center. */
    cx: number;
    /** The y-coordinate of the arc's center. */
    cy: number;
    /** The start angle of the arc, in radians. */
    startAngle: number;
    /** The end angle of the arc, in radians. */
    endAngle: number;
    /** The outer radius of the arc. */
    radius: number;
    /** The inner radius of the arc, producing an annular sector when set. */
    innerRadius?: number;
    /** The angular padding between the arc and its neighbors, in radians. */
    padAngle?: number;
    /** The corner radius applied to the arc's corners. */
    borderRadius?: number;
}

/** An arc or annular sector shape supporting inner radius and pad angle. */
export class Arc extends Shape2D<ArcState> {

    /** The x-coordinate of the arc's center. */
    public get cx() {
        return this.getStateValue('cx');
    }

    public set cx(value) {
        this.setStateValue('cx', value);
    }

    /** The y-coordinate of the arc's center. */
    public get cy() {
        return this.getStateValue('cy');
    }

    public set cy(value) {
        this.setStateValue('cy', value);
    }

    /** The start angle of the arc, in radians. */
    public get startAngle() {
        return this.getStateValue('startAngle');
    }

    public set startAngle(value) {
        this.setStateValue('startAngle', value);
    }

    /** The end angle of the arc, in radians. */
    public get endAngle() {
        return this.getStateValue('endAngle');
    }

    public set endAngle(value) {
        this.setStateValue('endAngle', value);
    }

    /** The outer radius of the arc. */
    public get radius() {
        return this.getStateValue('radius');
    }

    public set radius(value) {
        this.setStateValue('radius', value);
    }

    /** The inner radius of the arc, producing an annular sector when set. */
    public get innerRadius() {
        return this.getStateValue('innerRadius');
    }

    public set innerRadius(value) {
        this.setStateValue('innerRadius', value);
    }

    /** The angular padding between the arc and its neighbors, in radians. */
    public get padAngle() {
        return this.getStateValue('padAngle');
    }

    public set padAngle(value) {
        this.setStateValue('padAngle', value);
    }

    /** The corner radius applied to the arc's corners. */
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

    /** @internal Local-space bounding box of the arc. */
    public _getLocalBoundingBox(): Box {
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
                Math.min(cy, outerY1, outerY2),
                Math.min(cx, outerX1, outerX2),
                Math.max(cy, outerY1, outerY2),
                Math.max(cx, outerX1, outerX2)
            );
        }

        const [innerX1, innerY1] = getThetaPoint(startAngle, innerRadius, cx, cy);
        const [innerX2, innerY2] = getThetaPoint(endAngle, innerRadius, cx, cy);

        return new Box(
            Math.min(innerY1, innerY2, outerY1, outerY2),
            Math.min(innerX1, innerX2, outerX1, outerX2),
            Math.max(innerY1, innerY2, outerY1, outerY2),
            Math.max(innerX1, innerX2, outerX1, outerX2)
        );
    }

    /** Renders the arc to the provided {@link Context}. */
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