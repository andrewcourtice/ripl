import {
    Shape2D,
} from '../core';

import type {
    BaseElementState,
    Shape2DOptions,
} from '../core';

import type {
    Context,
    ContextPath,
} from '../context';

import {
    Box,
} from '../math';

/** State interface for a path element, defining bounding position and dimensions. */
export interface PathState extends BaseElementState {
    /** The x-coordinate of the path's bounding box top-left corner. */
    x: number;
    /** The y-coordinate of the path's bounding box top-left corner. */
    y: number;
    /** The width of the path's bounding box. */
    width: number;
    /** The height of the path's bounding box. */
    height: number;
}

/** A callback that draws custom geometry onto a `ContextPath` using the element's state. */
export type PathRenderer = (path: ContextPath, state: PathState) => void;

/** A general-purpose shape rendered by a user-supplied path renderer callback. */
export class Path extends Shape2D<PathState> {

    private _pathRenderer?: PathRenderer;

    /** The x-coordinate of the path's bounding box top-left corner. */
    public get x() {
        return this.getStateValue('x');
    }

    public set x(value) {
        this.setStateValue('x', value);
    }

    /** The y-coordinate of the path's bounding box top-left corner. */
    public get y() {
        return this.getStateValue('y');
    }

    public set y(value) {
        this.setStateValue('y', value);
    }

    /** The width of the path's bounding box. */
    public get width() {
        return this.getStateValue('width');
    }

    public set width(value) {
        this.setStateValue('width', value);
    }

    /** The height of the path's bounding box. */
    public get height() {
        return this.getStateValue('height');
    }

    public set height(value) {
        this.setStateValue('height', value);
    }

    constructor(options: Shape2DOptions<PathState> & { pathRenderer?: PathRenderer }) {
        const {
            pathRenderer,
            ...shapeOptions
        } = options;

        super('path', shapeOptions);

        this._pathRenderer = pathRenderer;
    }

    /** Replaces the current path renderer callback. */
    public setPathRenderer(renderer: PathRenderer) {
        this._pathRenderer = renderer;
    }

    /** @internal Local-space bounding box of the path. */
    public _getLocalBoundingBox(): Box {
        return new Box(
            this.y,
            this.x,
            this.y + (this.height || 0),
            this.x + (this.width || 0)
        );
    }

    /** Renders the path to the provided {@link Context} using its path renderer callback. */
    public render(context: Context) {
        return super.render(context, path => {
            this._pathRenderer?.(path, {
                x: this.x,
                y: this.y,
                width: this.width,
                height: this.height,
            } as PathState);
        });
    }

}

/** Factory function that creates a new `Path` instance. */
export function createPath(...options: ConstructorParameters<typeof Path>) {
    return new Path(...options);
}

/** Type guard that checks whether a value is a `Path` instance. */
export function elementIsPath(value: unknown): value is Path {
    return value instanceof Path;
}
