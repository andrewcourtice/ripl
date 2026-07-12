import type {
    Context,
    ContextPath,
} from '../context';

import type {
    BaseElementState,
    ElementIntersectionOptions,
    ElementOptions,
} from './element';

import {
    Element,
} from './element';

/** Abstract base class for renderable shapes, extending `Element` with a type-constrained constructor. */
export abstract class Shape<TState extends BaseElementState = BaseElementState> extends Element<TState> {

    constructor(type: string, options: ElementOptions<TState>) {
        super(type, options);
    }

}

/** Options for a 2D shape, adding automatic fill/stroke and clipping controls. */
export type Shape2DOptions<TState extends BaseElementState = BaseElementState> = ElementOptions<TState> & {
    autoStroke?: boolean;
    autoFill?: boolean;
    clip?: boolean;
};

/**
 * Pointer hit-test strategy per `pointerEvents` mode. Modes not listed here (e.g. `all`) fall back
 * to testing both fill and stroke.
 */
const POINTER_EVENT_HIT_TESTS: Record<string, (context: Context, path: ContextPath, x: number, y: number) => boolean> = {
    none: () => false,
    stroke: (context, path, x, y) => !!context.isPointInStroke(path, x, y),
    fill: (context, path, x, y) => !!context.isPointInPath(path, x, y),
};

/** A concrete 2D shape with path management, automatic fill/stroke rendering, clipping support, and path-based hit testing. */
export class Shape2D<TState extends BaseElementState = BaseElementState> extends Shape<TState> {

    private _pathCache?: ContextPath;
    private _pathCacheContext?: Context;
    private _pathCacheVersion = -1;

    protected path?: ContextPath;

    public autoStroke: boolean;
    public autoFill: boolean;
    public clip: boolean;

    constructor(type: string, options: Shape2DOptions<TState>) {
        const {
            autoFill = true,
            autoStroke = true,
            clip = false,
            ...elementOptions
        } = options;

        super(type, elementOptions as ElementOptions<TState>);

        this.autoFill = autoFill;
        this.autoStroke = autoStroke;
        this.clip = clip;
    }

    /** Tests whether a point intersects this shape using path-based fill and stroke hit testing. */
    public intersectsWith(x: number, y: number, options?: Partial<ElementIntersectionOptions>) {
        if (!this.context || !this.path) {
            return super.intersectsWith(x, y, options);
        }

        const {
            isPointer = false,
        } = options || {};

        const isAnyIntersecting = () => !!(this.path && this.context) && (
            this.context.isPointInStroke(this.path, x, y) ||
            this.context.isPointInPath(this.path, x, y)
        );

        if (!isPointer) {
            return isAnyIntersecting();
        }

        const hitTest = POINTER_EVENT_HIT_TESTS[this.pointerEvents];

        return hitTest
            ? hitTest(this.context, this.path, x, y)
            : isAnyIntersecting();
    }

    /**
     * Resolves the shape's path, reusing a retained `ContextPath` when the backend supports caching
     * (Canvas) and the geometry (tracked by `_version`) has not changed since it was last built. This
     * skips per-frame `Path2D` allocation and geometry rebuilds for shapes that are drawn but static
     * — the common case when a few elements animate within a large scene. SVG (and any backend that
     * rebuilds its virtual path each frame) reports `supportsPathCaching === false` and always rebuilds.
     */
    private _resolvePath(context: Context, callback?: (path: ContextPath) => void): ContextPath {
        const cacheable = context.supportsPathCaching;

        if (cacheable
            && this._pathCache
            && this._pathCacheContext === context
            && this._pathCacheVersion === this._version) {
            return this._pathCache;
        }

        const path = context.createPath(this.id);

        callback?.(path);

        if (cacheable) {
            this._pathCache = path;
            this._pathCacheContext = context;
            this._pathCacheVersion = this._version;
        }

        return path;
    }

    /** Renders this shape by creating a path, invoking the callback, and automatically applying fill/stroke or clipping. */
    public render(context: Context, callback?: (path: ContextPath) => void) {
        return super.render(context, () => {
            this.path = this._resolvePath(context, callback);

            if (this.path && this.clip) {
                context.applyClip(this.path);
                return;
            }

            if (this.path && this.autoFill && this.fill) {
                context.applyFill(this.path);
            }

            if (this.path && this.autoStroke && this.stroke) {
                context.applyStroke(this.path);
            }
        }, this.clip);
    }

}

/** Factory function that creates a new `Shape2D` instance. */
export function createShape(...options: ConstructorParameters<typeof Shape2D>) {
    return new Shape2D(...options);
}

/** Type guard that checks whether a value is a `Shape` instance. */
export function elementIsShape(value: unknown): value is Shape {
    return value instanceof Shape;
}