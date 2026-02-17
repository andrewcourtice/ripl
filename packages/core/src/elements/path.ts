import type {
    Context,
    ContextPath,
} from '../context';

import {
    BaseElementState,
    Shape,
    ShapeOptions,
} from '../core';

import {
    Box,
} from '../math';

export interface PathState extends BaseElementState {
    x: number;
    y: number;
    width: number;
    height: number;
}

export type PathRenderer = (path: ContextPath, state: PathState) => void;

export class Path extends Shape<PathState> {

    private pathRenderer?: PathRenderer;

    public get x() {
        return this.getStateValue('x');
    }

    public set x(value) {
        this.setStateValue('x', value);
    }

    public get y() {
        return this.getStateValue('y');
    }

    public set y(value) {
        this.setStateValue('y', value);
    }

    public get width() {
        return this.getStateValue('width');
    }

    public set width(value) {
        this.setStateValue('width', value);
    }

    public get height() {
        return this.getStateValue('height');
    }

    public set height(value) {
        this.setStateValue('height', value);
    }

    constructor(options: ShapeOptions<PathState> & { pathRenderer?: PathRenderer }) {
        const {
            pathRenderer,
            ...shapeOptions
        } = options;

        super('path', shapeOptions);

        this.pathRenderer = pathRenderer;
    }

    public setPathRenderer(renderer: PathRenderer) {
        this.pathRenderer = renderer;
    }

    public getBoundingBox(): Box {
        return new Box(
            this.y,
            this.x,
            this.y + (this.height || 0),
            this.x + (this.width || 0)
        );
    }

    public render(context: Context) {
        return super.render(context, path => {
            this.pathRenderer?.(path, {
                x: this.x,
                y: this.y,
                width: this.width,
                height: this.height,
            } as PathState);
        });
    }

}

export function createPath(...options: ConstructorParameters<typeof Path>) {
    return new Path(...options);
}

export function elementIsPath(value: unknown): value is Path {
    return value instanceof Path;
}
