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

import {
    typeIsNil,
} from '@ripl/utilities';

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

/** Line style a backend's `isPointInStroke` reads off the context to decide the stroke's extent. */
const STROKE_HIT_PROPERTIES = [
    'lineCap',
    'lineDash',
    'lineDashOffset',
    'lineJoin',
    'lineWidth',
    'miterLimit',
] as const;

/** Abstract base class for renderable shapes, extending `Element` with a type-constrained constructor. */
export abstract class Shape<TState extends BaseElementState = BaseElementState> extends Element<TState> {

    constructor(type: string, options: ElementOptions<TState>) {
        super(type, options);
    }

}

/** A concrete 2D shape with path management, automatic fill/stroke rendering, clipping support, and path-based hit testing. */
export class Shape2D<TState extends BaseElementState = BaseElementState> extends Shape<TState> {

    private _cachedContext?: Context;

    protected path?: ContextPath;

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

    private _withStrokeStyle<TResult>(context: Context, body: () => TResult): TResult {
        return context.layer(() => {
            STROKE_HIT_PROPERTIES.forEach(key => {
                const value = this.getComputedValue(key as unknown as keyof TState);

                if (!typeIsNil(value)) {
                    (context as unknown as Record<string, unknown>)[key] = value;
                }
            });

            return body();
        });
    }

    protected get hitPaths(): ContextPath[] {
        return this.path
            ? [this.path]
            : [];
    }

    protected strokePath(context: Context, path: ContextPath): void {
        context.applyStroke(path);
    }

    /**
     * Tests whether a point intersects this shape using path-based fill and stroke hit testing.
     *
     * @param x - X coordinate in logical space (CSS pixels relative to the context's top-left), the same space pointer event payloads report.
     * @param y - Y coordinate in logical space (CSS pixels relative to the context's top-left).
     * @param options - Hit-testing options, such as whether the test originates from a pointer event.
     * @returns Whether the point lies within the shape's fill or stroke, honoring its pointer-event region.
     */
    public intersectsWith(x: number, y: number, options?: Partial<ElementIntersectionOptions>) {
        const context = this.context;
        const paths = this.hitPaths;

        if (!context || !paths.length) {
            return super.intersectsWith(x, y, options);
        }

        // The path is local-space, so backends that don't honor transforms need the point mapped back.
        if (!context.hitTestHonorsTransform) {
            const worldTransform = (this as unknown as Element).getWorldTransform();
            const inverse = worldTransform && matrixInvert(worldTransform);

            if (inverse) {
                [x, y] = matrixApplyToPoint(inverse, [x, y]);
            }
        }

        const {
            isPointer = false,
        } = options || {};

        const isAnyIntersecting = () => paths.some(path => (
            context.isPointInStroke(path, x, y) ||
            context.isPointInPath(path, x, y)
        ));

        const hitTest = isPointer
            ? POINTER_EVENT_HIT_TESTS[this.pointerEvents]
            : undefined;

        // `isPointInStroke` strokes with the current line style, which the frame's trailing restore rolled back.
        return this._withStrokeStyle(context, () => (hitTest
            ? paths.some(path => hitTest(context, path, x, y))
            : isAnyIntersecting()));
    }

    /** Renders this shape, reusing its cached path while unchanged (else creating and tracing a new one), then automatically applying fill/stroke or clipping. */
    public render(context: Context, callback?: (path: ContextPath) => void) {
        return super.render(context, () => {
            // Paths are local-space, so only this element's own state change forces a re-trace.
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

            // The context already holds the resolved paint, so this fires for inherited values too.
            if (this.path && this.autoFill && this.getComputedValue('fill')) {
                context.applyFill(this.path);
            }

            if (this.path && this.autoStroke && this.getComputedValue('stroke')) {
                this.strokePath(context, this.path);
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