import type {
    BaseElementState,
    Context,
    Shape2DOptions,
} from '@ripl/core';

import {
    Box,
    max,
    min,
    Shape2D,
} from '@ripl/core';

/** State interface for a Sankey link, defining source and target endpoint coordinates. */
export interface SankeyLinkState extends BaseElementState {
    /** Source endpoint x coordinate, in pixels. */
    sx: number;
    /** Source endpoint y coordinate, in pixels. */
    sy: number;
    /** Target endpoint x coordinate, in pixels. */
    tx: number;
    /** Target endpoint y coordinate, in pixels. */
    ty: number;
}

/** A curved Sankey link shape rendered as a cubic Bézier curve between source and target points. */
export class SankeyLinkPath extends Shape2D<SankeyLinkState> {

    /** Source endpoint x coordinate, in pixels. */
    public get sx() {
        return this.getStateValue('sx');
    }

    public set sx(value) {
        this.setStateValue('sx', value);
    }

    /** Source endpoint y coordinate, in pixels. */
    public get sy() {
        return this.getStateValue('sy');
    }

    public set sy(value) {
        this.setStateValue('sy', value);
    }

    /** Target endpoint x coordinate, in pixels. */
    public get tx() {
        return this.getStateValue('tx');
    }

    public set tx(value) {
        this.setStateValue('tx', value);
    }

    /** Target endpoint y coordinate, in pixels. */
    public get ty() {
        return this.getStateValue('ty');
    }

    public set ty(value) {
        this.setStateValue('ty', value);
    }

    constructor(options: Shape2DOptions<SankeyLinkState>) {
        super('sankey-link', {
            autoFill: false,
            ...options,
        });
    }

    public _getLocalBoundingBox(): Box {
        const {
            sx,
            sy,
            tx,
            ty,
        } = this;

        const midX = (sx + tx) / 2;

        return new Box(
            min(sy, ty),
            min(sx, midX, tx),
            max(sy, ty),
            max(sx, midX, tx)
        );
    }

    public render(context: Context) {
        const {
            sx,
            sy,
            tx,
            ty,
        } = this;

        const midX = (sx + tx) / 2;

        return super.render(context, path => {
            path.moveTo(sx, sy);
            path.bezierCurveTo(midX, sy, midX, ty, tx, ty);
        });
    }

}

/** Factory function that creates a new `SankeyLinkPath` instance. */
export function createSankeyLink(...options: ConstructorParameters<typeof SankeyLinkPath>) {
    return new SankeyLinkPath(...options);
}

/** Type guard that checks whether a value is a `SankeyLinkPath` instance. */
export function elementIsSankeyLink(value: unknown): value is SankeyLinkPath {
    return value instanceof SankeyLinkPath;
}
