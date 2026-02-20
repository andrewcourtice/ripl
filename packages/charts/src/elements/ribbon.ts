import type {
    Context,
} from '@ripl/core';

import {
    BaseElementState,
    Box,
    getThetaPoint,
    max,
    min,
    Shape,
    ShapeOptions,
} from '@ripl/core';

export interface RibbonState extends BaseElementState {
    cx: number;
    cy: number;
    radius: number;
    sourceStart: number;
    sourceEnd: number;
    targetStart: number;
    targetEnd: number;
}

export class Ribbon extends Shape<RibbonState> {

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

    public get radius() {
        return this.getStateValue('radius');
    }

    public set radius(value) {
        this.setStateValue('radius', value);
    }

    public get sourceStart() {
        return this.getStateValue('sourceStart');
    }

    public set sourceStart(value) {
        this.setStateValue('sourceStart', value);
    }

    public get sourceEnd() {
        return this.getStateValue('sourceEnd');
    }

    public set sourceEnd(value) {
        this.setStateValue('sourceEnd', value);
    }

    public get targetStart() {
        return this.getStateValue('targetStart');
    }

    public set targetStart(value) {
        this.setStateValue('targetStart', value);
    }

    public get targetEnd() {
        return this.getStateValue('targetEnd');
    }

    public set targetEnd(value) {
        this.setStateValue('targetEnd', value);
    }

    constructor(options: ShapeOptions<RibbonState>) {
        super('ribbon', options);
    }

    public getBoundingBox(): Box {
        const {
            cx,
            cy,
            radius,
            sourceStart,
            sourceEnd,
            targetStart,
            targetEnd,
        } = this;

        const [sx1, sy1] = getThetaPoint(sourceStart, radius, cx, cy);
        const [sx2, sy2] = getThetaPoint(sourceEnd, radius, cx, cy);
        const [tx1, ty1] = getThetaPoint(targetStart, radius, cx, cy);
        const [tx2, ty2] = getThetaPoint(targetEnd, radius, cx, cy);

        return new Box(
            min(sy1, sy2, ty1, ty2, cy),
            min(sx1, sx2, tx1, tx2, cx),
            max(sy1, sy2, ty1, ty2, cy),
            max(sx1, sx2, tx1, tx2, cx)
        );
    }

    public render(context: Context) {
        const {
            cx,
            cy,
            radius,
            sourceStart,
            sourceEnd,
            targetStart,
            targetEnd,
        } = this;

        return super.render(context, path => {
            path.moveTo(
                cx + radius * Math.cos(sourceStart),
                cy + radius * Math.sin(sourceStart)
            );

            path.arc(cx, cy, radius, sourceStart, sourceEnd);

            path.quadraticCurveTo(
                cx, cy,
                cx + radius * Math.cos(targetStart),
                cy + radius * Math.sin(targetStart)
            );

            path.arc(cx, cy, radius, targetStart, targetEnd);

            path.quadraticCurveTo(
                cx, cy,
                cx + radius * Math.cos(sourceStart),
                cy + radius * Math.sin(sourceStart)
            );

            path.closePath();
        });
    }

}

export function createRibbon(...options: ConstructorParameters<typeof Ribbon>) {
    return new Ribbon(...options);
}

export function elementIsRibbon(value: unknown): value is Ribbon {
    return value instanceof Ribbon;
}
