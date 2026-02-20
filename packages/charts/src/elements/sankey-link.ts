import type {
    Context,
} from '@ripl/core';

import {
    BaseElementState,
    Box,
    max,
    min,
    Shape,
    ShapeOptions,
} from '@ripl/core';

export interface SankeyLinkState extends BaseElementState {
    sx: number;
    sy: number;
    tx: number;
    ty: number;
}

export class SankeyLinkPath extends Shape<SankeyLinkState> {

    public get sx() {
        return this.getStateValue('sx');
    }

    public set sx(value) {
        this.setStateValue('sx', value);
    }

    public get sy() {
        return this.getStateValue('sy');
    }

    public set sy(value) {
        this.setStateValue('sy', value);
    }

    public get tx() {
        return this.getStateValue('tx');
    }

    public set tx(value) {
        this.setStateValue('tx', value);
    }

    public get ty() {
        return this.getStateValue('ty');
    }

    public set ty(value) {
        this.setStateValue('ty', value);
    }

    constructor(options: ShapeOptions<SankeyLinkState>) {
        super('sankey-link', {
            autoFill: false,
            ...options,
        });
    }

    public getBoundingBox(): Box {
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

export function createSankeyLink(...options: ConstructorParameters<typeof SankeyLinkPath>) {
    return new SankeyLinkPath(...options);
}

export function elementIsSankeyLink(value: unknown): value is SankeyLinkPath {
    return value instanceof SankeyLinkPath;
}
