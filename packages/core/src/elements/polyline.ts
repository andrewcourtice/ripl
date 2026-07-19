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

import type {
    Point,
} from '../math';

import {
    Box,
} from '../math';

import {
    numberExtent,
} from '@ripl/utilities';

import type {
    PolylineRenderer,
    PolylineRenderFunc,
} from './polyline-renderers';

import {
    resolvePolylineRenderer,
} from './polyline-renderers';

export * from './polyline-renderers';

export interface PolylineState extends BaseElementState {
    /** The ordered points that make up the polyline. */
    points: Point[];
    /** The curve interpolation algorithm, or custom render function, used to draw the polyline. */
    renderer?: PolylineRenderer | PolylineRenderFunc;
}

/** A multi-point line shape supporting various curve interpolation algorithms. */
export class Polyline extends Shape2D<PolylineState> {

    /** The ordered points that make up the polyline. */
    public get points() {
        return this.getStateValue('points');
    }

    public set points(value) {
        this.setStateValue('points', value);
    }

    /** The curve interpolation algorithm, or custom render function, used to draw the polyline. */
    public get renderer() {
        return this.getStateValue('renderer');
    }

    public set renderer(value) {
        this.setStateValue('renderer', value);
    }

    constructor(options: Shape2DOptions<PolylineState>) {
        super('polyline', options);
    }

    /** @internal Local-space bounding box of the polyline. */
    public _getLocalBoundingBox(): Box {
        const [left, right] = numberExtent(this.points, point => point[0]);
        const [top, bottom] = numberExtent(this.points, point => point[1]);

        return new Box(
            top,
            left,
            bottom,
            right
        );
    }

    /** Renders the polyline to the provided {@link Context} using its resolved curve renderer. */
    public render(context: Context) {
        const renderer = resolvePolylineRenderer(this.renderer);

        return super.render(context, path => renderer(context, path, this.points));
    }

}

/** Factory function that creates a new `Polyline` instance. */
export function createPolyline(...options: ConstructorParameters<typeof Polyline>) {
    return new Polyline(...options);
}

/** Type guard that checks whether a value is a `Polyline` instance. */
export function elementIsPolyline(value: unknown): value is Polyline {
    return value instanceof Polyline;
}
