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

import {
    matrixApplyToPoint,
    matrixInvert,
} from '../math';

/** Abstract base class for renderable shapes, extending `Element` with a type-constrained constructor. */
export abstract class Shape<TState extends BaseElementState = BaseElementState> extends Element<TState> {

    constructor(type: string, options: ElementOptions<TState>) {
        super(type, options);
    }

}

/** Options for a 2D shape, adding automatic fill/stroke and clipping controls. */
export type Shape2DOptions<TState extends BaseElementState = BaseElementState> = ElementOptions<TState> & {
    /** Whether the shape automatically strokes its outline after rendering when a stroke is set. Defaults to `true`. */
    autoStroke?: boolean;
    /** Whether the shape automatically fills its path after rendering when a fill is set. Defaults to `true`. */
    autoFill?: boolean;
    /** Whether the shape's path is used as a clipping region for descendants instead of being filled or stroked. Defaults to `false`. */
    clip?: boolean;
    /** Whether to reuse the traced path across render cycles while the shape is unchanged, avoiding re-tracing on backends that support it. Defaults to `true`; set `false` for path renderers that read external mutable data not held in element state. */
    cachePath?: boolean;
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

    protected path?: ContextPath;

    private _cachedContext?: Context;

    /** When `true`, the shape's outline is automatically stroked after rendering whenever {@link Element.stroke} is set. */
    public autoStroke: boolean;
    /** When `true`, the shape is automatically filled after rendering whenever {@link Element.fill} is set. */
    public autoFill: boolean;
    /** When `true`, the shape's path is used as a clipping region for descendants instead of being filled or stroked. */
    public clip: boolean;
    /** When `true`, the shape reuses its traced path across render cycles while unchanged, on backends that support path caching. */
    public cachePath: boolean;

    constructor(type: string, options: Shape2DOptions<TState>) {
        const {
            autoFill = true,
            autoStroke = true,
            clip = false,
            cachePath = true,
            ...elementOptions
        } = options;

        super(type, elementOptions as ElementOptions<TState>);

        this.autoFill = autoFill;
        this.autoStroke = autoStroke;
        this.clip = clip;
        this.cachePath = cachePath;
    }

    /** Tests whether a point intersects this shape using path-based fill and stroke hit testing. */
    public intersectsWith(x: number, y: number, options?: Partial<ElementIntersectionOptions>) {
        if (!this.context || !this.path) {
            return super.intersectsWith(x, y, options);
        }

        // The stored path is in this element's local space, but its transform (and any ancestor
        // group transform) is applied to the context during rendering. Backends that don't
        // natively account for that during hit testing (e.g. canvas) need the point mapped back
        // into local space; the identity case (no transforms) is skipped for free.
        if (!this.context.hitTestHonorsTransform) {
            const worldTransform = (this as unknown as Element).getWorldTransform();
            const inverse = worldTransform && matrixInvert(worldTransform);

            if (inverse) {
                // The point arrives in device pixels (scaled by the device pixel ratio) but the world
                // transform is composed in logical space. Map device → logical, apply the inverse, then
                // map back to device so the native path test (which works in device pixels) stays correct.
                const dpr = this.context.scaleDPR(1);
                const [localX, localY] = matrixApplyToPoint(inverse, [x / dpr, y / dpr]);

                x = localX * dpr;
                y = localY * dpr;
            }
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

    /** Renders this shape, reusing its cached path while unchanged (else creating and tracing a new one), then automatically applying fill/stroke or clipping. */
    public render(context: Context, callback?: (path: ContextPath) => void) {
        return super.render(context, () => {
            // The traced path is authored in local space (element and ancestor transforms are
            // applied to the context, not the path), so it only needs re-tracing when this
            // element's own state changed. Reuse it across frames on backends whose createPath is
            // side-effect-free, and only when the same context produced the cached path.
            const canReuse = this.cachePath
                && context.supportsPathCaching
                && this._cachedContext === context
                && !!this.path
                && !this.$dirty;

            if (!canReuse) {
                this.path = context.createPath(this.id);

                callback?.(this.path);

                this._cachedContext = context;
            }

            if (this.path && this.clip) {
                context.applyClip(this.path);
                return;
            }

            // Paint if a fill/stroke is set on this shape *or inherited* from a group; the context
            // already holds the resolved value (own, applied by the base render; inherited, applied
            // at the group boundary), so autoFill/autoStroke fire whenever the effective paint is set.
            if (this.path && this.autoFill && this.getComputedValue('fill')) {
                context.applyFill(this.path);
            }

            if (this.path && this.autoStroke && this.getComputedValue('stroke')) {
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