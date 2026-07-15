import {
    CONTEXT_OPERATIONS,
    TRACKED_EVENTS,
    TRANSFORM_DEFAULTS,
    TRANSFORM_INTERPOLATORS,
} from './constants';

import {
    EventBus,
} from './event-bus';

import type {
    EventHandler,
    EventMap,
    EventSubscriptionOptions,
} from './event-bus';

import {
    Box,
    isPointInBox,
    matrixIdentity,
    matrixIsIdentity,
    matrixMultiply,
    matrixRotate,
    matrixScale,
    matrixTranslate,
} from '../math';

import type {
    Matrix,
} from '../math';

import {
    scaleContinuous,
} from '../scales';

import {
    interpolateAny,
    interpolateBorderRadius,
    interpolateColor,
    interpolateDate,
    interpolateGradient,
    interpolateNumber,
    interpolatePoints,
} from '../interpolators';

import type {
    Interpolator,
    InterpolatorFactory,
} from '../interpolators';

import type {
    Group,
} from './group';

import {
    closest,
    matches,
} from './query';

import type {
    Queryable,
} from './query';

import {
    resolveRotation,
    resolveTransformOrigin,
} from '../context';

import type {
    BaseState,
    Context,
} from '../context';

import {
    objectForEach,
    objectReduce,
    stringUniqueId,
    typeIsArray,
    typeIsFunction,
    typeIsNil,
    typeIsObject,
    typeIsString,
    valueOneOrMore,
} from '@ripl/utilities';

import type {
    AnyFunction,
    OneOrMore,
} from '@ripl/utilities';

/** Controls which pointer events an element responds to during hit testing. */
export type ElementPointerEvents = 'none' | 'all' | 'stroke' | 'fill';

/** Severity level of an element validation result. */
export type ElementValidationType = 'info' | 'warning' | 'error';

/** Options for element intersection (hit) testing. */
export type ElementIntersectionOptions = {
    /** Whether the test originates from a pointer interaction rather than a programmatic query, enabling pointer-event region filtering. */
    isPointer: boolean;
};

/** Base state interface for all elements. All visual properties are optional at the element level. */
export type BaseElementState = Partial<BaseState>;

/** Event map for elements, extending the base event map with lifecycle and interaction events. */
export interface ElementEventMap extends EventMap {
    /** Emitted when the element tree changes, notifying the scene to rebuild its graph; carries no payload. */
    graph: null;
    /** Emitted when the element is attached to a parent {@link Group}, carrying that group. */
    attached: Group;
    /** Emitted when the element is detached from a parent {@link Group}, carrying the former parent group. */
    detached: Group;
    /** Emitted when a state value changes, carrying the affected key and its new value. */
    updated: {
        /** State property key that changed. */
        key: PropertyKey;
        /** New value assigned to the property. */
        value: unknown;
    };
    /** Emitted when the pointer enters the element; carries no payload. */
    mouseenter: null;
    /** Emitted when the pointer leaves the element; carries no payload. */
    mouseleave: null;
    /** Emitted as the pointer moves over the element, carrying its position. */
    mousemove: {
        /** X coordinate of the pointer, in element-local space. */
        x: number;
        /** Y coordinate of the pointer, in element-local space. */
        y: number;
    };
    /** Emitted when the element is clicked, carrying the pointer position. */
    click: {
        /** X coordinate of the pointer, in element-local space. */
        x: number;
        /** Y coordinate of the pointer, in element-local space. */
        y: number;
    };
    /** Emitted when a drag gesture begins on the element, carrying the start position. */
    dragstart: {
        /** X coordinate at which the drag started, in element-local space. */
        x: number;
        /** Y coordinate at which the drag started, in element-local space. */
        y: number;
    };
    /** Emitted continuously while dragging the element, carrying the current position, drag start, and delta from the start. */
    drag: {
        /** Current X coordinate of the pointer, in element-local space. */
        x: number;
        /** Current Y coordinate of the pointer, in element-local space. */
        y: number;
        /** X coordinate at which the drag started, in element-local space. */
        startX: number;
        /** Y coordinate at which the drag started, in element-local space. */
        startY: number;
        /** Horizontal distance moved since the drag started, in pixels. */
        deltaX: number;
        /** Vertical distance moved since the drag started, in pixels. */
        deltaY: number;
    };
    /** Emitted when a drag gesture on the element ends, carrying the final position, drag start, and total delta. */
    dragend: {
        /** Final X coordinate of the pointer, in element-local space. */
        x: number;
        /** Final Y coordinate of the pointer, in element-local space. */
        y: number;
        /** X coordinate at which the drag started, in element-local space. */
        startX: number;
        /** Y coordinate at which the drag started, in element-local space. */
        startY: number;
        /** Total horizontal distance moved over the drag, in pixels. */
        deltaX: number;
        /** Total vertical distance moved over the drag, in pixels. */
        deltaY: number;
    };
    /** Emitted when the element is destroyed; carries no payload. */
    destroyed: null;
}

/** Options for constructing an element, combining an optional id, CSS classes, data, pointer events, and initial state. */
export type ElementOptions<TState extends BaseElementState = BaseElementState> = {
    /** Optional stable id; a unique `type:uniqueId` id is generated when omitted. */
    id?: string;
    /** One or more CSS-like class names used for querying and selection. */
    class?: OneOrMore<string>;
    /** Arbitrary user data bound to the element, typically the datum backing a data-driven visual. */
    data?: unknown;
    /** Which parts of the element respond to pointer hit testing. Defaults to `all`. */
    pointerEvents?: ElementPointerEvents;
} & TState;

/** A single keyframe in a multi-step interpolation, with an optional offset (0–1) and a target value. */
export type ElementInterpolationKeyFrame<TValue = number> = {
    /** Position of the keyframe along the transition, from 0 to 1; distributed evenly when omitted. */
    offset?: number;
    /** Target value the state property holds at this keyframe. */
    value: TValue;
};

/** An interpolation target: a direct value, an array of keyframes, or a custom interpolator function. */
export type ElementInterpolationStateValue<TValue = number> = TValue
| ElementInterpolationKeyFrame<TValue>[]
| Interpolator<TValue>;

/** A map of interpolator factories keyed by state property, used to override default interpolation behaviour. */
export type ElementInterpolators<TState extends BaseElementState> = {
    [TKey in keyof TState]: InterpolatorFactory<TState[TKey]>;
};

/** Partial state where each property can be a target value, keyframe array, or interpolator function. */
export type ElementInterpolationState<TState extends BaseElementState> = {
    [TKey in keyof TState]?: ElementInterpolationStateValue<TState[TKey]>;
};

/** The result of validating an element, with a severity type and descriptive message. */
export interface ElementValidationResult {
    /** Severity of the result — `info`, `warning`, or `error`. */
    type: ElementValidationType;
    /** Human-readable description of the validation result. */
    message: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function isElementValueKeyFrame(value: unknown): value is ElementInterpolationKeyFrame<any>[] {
    return typeIsArray(value) && value.every(keyframe => typeIsObject(keyframe) && 'value' in keyframe);
}

function getKeyframeInterpolator<TValue>(currentValue: TValue, frames: ElementInterpolationKeyFrame<TValue>[], interpolator: InterpolatorFactory<TValue>): Interpolator<TValue | undefined> {
    let keyframes = ([{
        offset: 0,
        value: currentValue,
    }] as { offset: number;
        value: TValue; }[]).concat(
        frames.map(frame => ({
            offset: frame.offset ?? 0,
            value: frame.value,
        }))
    );

    keyframes = frames.map(({ offset, value }, index) => ({
        value,
        offset: typeIsNil(offset) ? index / (keyframes.length - 1) : offset,
    }));

    if (keyframes.at(-1)?.offset !== 1) {
        keyframes.push({
            offset: 1,
            value: keyframes.at(-1)?.value ?? currentValue,
        });
    }

    keyframes.sort(({ offset: oa }, { offset: ob }) => oa - ob);

    const frameScale = scaleContinuous([0, 1], [0, keyframes.length - 1], { clamp: true });
    const interpolators = Array.from({ length: keyframes.length - 1 }, (_, index) => {
        const frameA = keyframes[index];
        const frameB = keyframes[index + 1];
        const scale = scaleContinuous([frameA.offset, frameB.offset], [0, 1]);
        const interpolate = interpolator(frameA.value, frameB.value);

        return (time: number) => interpolate(scale(time));
    });

    return time => interpolators[Math.min(Math.floor(frameScale(time)), interpolators.length - 1)](time);
}

function getInterpolator<TValue>(value: TValue, key?: string) {
    if (key && TRANSFORM_INTERPOLATORS[key]) {
        return TRANSFORM_INTERPOLATORS[key] as InterpolatorFactory<TValue>;
    }

    const interpolator = [
        interpolateNumber,
        interpolateGradient,
        interpolateColor,
        interpolateDate,
        interpolatePoints,
        interpolateBorderRadius,
    ].find(({ test }) => !!test?.(value));

    return (interpolator ?? interpolateAny) as InterpolatorFactory<TValue>;
}

/**
 * The subset of {@link Context} transform operations required to apply an element's
 * transform. Implemented by every {@link Context}, and by the internal matrix accumulator
 * used to reconstruct an element's world transform for hit testing.
 */
export interface TransformTarget {
    /** Applies a translation of `(x, y)`. */
    translate(x: number, y: number): void;
    /** Applies a rotation, in radians. */
    rotate(angle: number): void;
    /** Applies a scale with the given horizontal and vertical factors. */
    scale(x: number, y: number): void;
}

/**
 * Applies an element's transform (translate, rotate, scale about its transform-origin) to
 * the given target. Used both to drive a {@link Context}'s transform during rendering and,
 * via a matrix accumulator, to reconstruct an element's world transform for hit testing.
 *
 * @param target - The {@link Context} (or matrix accumulator) to apply the transform to.
 * @param element - The element whose transform is applied.
 */
export function applyElementTransform(target: TransformTarget, element: Element) {
    const translateX = element.translateX ?? 0;
    const translateY = element.translateY ?? 0;
    const scaleX = element.transformScaleX ?? 1;
    const scaleY = element.transformScaleY ?? 1;
    const rawRotation = element.rotation ?? 0;
    const rawOriginX = element.transformOriginX ?? 0;
    const rawOriginY = element.transformOriginY ?? 0;

    const rotation = resolveRotation(rawRotation);

    const hasTranslate = translateX !== 0 || translateY !== 0;
    const hasScale = scaleX !== 1 || scaleY !== 1;
    const hasRotation = rotation !== 0;
    const hasOrigin = rawOriginX !== 0 || rawOriginY !== 0;

    if (!hasTranslate && !hasScale && !hasRotation) {
        return;
    }

    let originX = 0;
    let originY = 0;

    if (hasOrigin) {
        const needsBBox = typeIsString(rawOriginX) || typeIsString(rawOriginY);
        const box = needsBBox ? element.getBoundingBox() : null;

        originX = resolveTransformOrigin(rawOriginX, box?.width ?? 0);
        originY = resolveTransformOrigin(rawOriginY, box?.height ?? 0);

        if (needsBBox && box) {
            originX += box.left;
            originY += box.top;
        }
    }

    target.translate(originX + translateX, originY + translateY);

    if (hasRotation) {
        target.rotate(rotation);
    }

    if (hasScale) {
        target.scale(scaleX, scaleY);
    }

    if (hasOrigin) {
        target.translate(-originX, -originY);
    }
}

/** A {@link TransformTarget} that accumulates applied transforms into a single {@link Matrix}. */
class MatrixTransformTarget implements TransformTarget {

    public matrix: Matrix = matrixIdentity();

    public translate(x: number, y: number): void {
        this.matrix = matrixMultiply(this.matrix, matrixTranslate(x, y));
    }

    public rotate(angle: number): void {
        this.matrix = matrixMultiply(this.matrix, matrixRotate(angle));
    }

    public scale(x: number, y: number): void {
        this.matrix = matrixMultiply(this.matrix, matrixScale(x, y));
    }

}

/**
 * Reconstructs an element's world transform — the composition of its own transform and
 * every ancestor group's transform, from the root down — for use in hit testing against
 * backends (such as canvas) that do not natively account for element transforms.
 *
 * @param element - The element whose world transform to compute.
 * @returns The composed {@link Matrix}, or `null` when the whole chain is the identity
 * transform (the common case), letting callers skip any point remapping.
 */
export function getWorldTransform(element: Element): Matrix | null {
    const chain: Element[] = [];
    let current: Element | undefined = element;

    while (current) {
        chain.unshift(current);
        current = current.parent as Element | undefined;
    }

    const target = new MatrixTransformTarget();

    chain.forEach(node => applyElementTransform(target, node));

    return matrixIsIdentity(target.matrix)
        ? null
        : target.matrix;
}

/** The base renderable element with state management, event handling, interpolation, transform support, and context rendering. */
export class Element<
    TState extends BaseElementState = BaseElementState,
    TEventMap extends ElementEventMap = ElementEventMap
> extends EventBus<TEventMap> implements Queryable {

    protected state: TState;
    protected context?: Context;

    /** Unique identifier for this element, defaulting to `type:uniqueId` when not supplied. */
    public id: string;
    /** The element type name (e.g. `circle`, `rect`, `group`). */
    public readonly type: string;
    /** Set of CSS-like class names used for querying and selection. */
    public readonly classList: Set<string>;

    /** When `true`, the element skips transform and drawing-state application during {@link Element.render}; used by containers such as {@link Group}. */
    public abstract: boolean = false;
    /** Controls which parts of the element respond to pointer hit testing. See {@link ElementPointerEvents}. */
    public pointerEvents: ElementPointerEvents = 'all';
    /** The parent {@link Group} this element is attached to, or `undefined` when detached. */
    public declare parent?: Group<TEventMap>;
    /** Arbitrary user data bound to the element, typically the datum backing a data-driven visual. */
    public data: unknown;

    // Props

    /** Text directionality used when rendering text, mirroring the canvas `direction` drawing-state property (`inherit`, `ltr`, or `rtl`). */
    public get direction() {
        return this.getStateValue('direction');
    }

    public set direction(value) {
        this.setStateValue('direction', value);
    }

    /** Fill style (colour or gradient) painted inside the element, mirroring the canvas `fillStyle` drawing-state property. */
    public get fill() {
        return this.getStateValue('fill');
    }

    public set fill(value) {
        this.setStateValue('fill', value);
    }

    /** Filter effects applied to the element, mirroring the canvas `filter` drawing-state property. */
    public get filter() {
        return this.getStateValue('filter');
    }

    public set filter(value) {
        this.setStateValue('filter', value);
    }

    /** Font used for text rendering, mirroring the canvas `font` drawing-state property. */
    public get font() {
        return this.getStateValue('font');
    }

    public set font(value) {
        this.setStateValue('font', value);
    }

    /** Opacity of the element from 0 (transparent) to 1 (opaque), mapping to the canvas `globalAlpha` drawing-state property. */
    public get opacity() {
        return this.getStateValue('opacity');
    }

    public set opacity(value) {
        this.setStateValue('opacity', value);
    }

    /** Compositing/blend mode used to draw the element, mirroring the canvas `globalCompositeOperation` drawing-state property. */
    public get globalCompositeOperation() {
        return this.getStateValue('globalCompositeOperation');
    }

    public set globalCompositeOperation(value) {
        this.setStateValue('globalCompositeOperation', value);
    }

    /** Cap style drawn at the ends of stroked lines, mirroring the canvas `lineCap` drawing-state property (`butt`, `round`, or `square`). */
    public get lineCap() {
        return this.getStateValue('lineCap');
    }

    public set lineCap(value) {
        this.setStateValue('lineCap', value);
    }

    /** Dash pattern for stroked lines, mirroring the canvas line-dash array set via `setLineDash`. */
    public get lineDash() {
        return this.getStateValue('lineDash');
    }

    public set lineDash(value) {
        this.setStateValue('lineDash', value);
    }

    /** Offset into the line-dash pattern, mirroring the canvas `lineDashOffset` drawing-state property. */
    public get lineDashOffset() {
        return this.getStateValue('lineDashOffset');
    }

    public set lineDashOffset(value) {
        this.setStateValue('lineDashOffset', value);
    }

    /** Join style drawn where stroked segments meet, mirroring the canvas `lineJoin` drawing-state property (`bevel`, `miter`, or `round`). */
    public get lineJoin() {
        return this.getStateValue('lineJoin');
    }

    public set lineJoin(value) {
        this.setStateValue('lineJoin', value);
    }

    /** Width of stroked lines in pixels, mirroring the canvas `lineWidth` drawing-state property. */
    public get lineWidth() {
        return this.getStateValue('lineWidth');
    }

    public set lineWidth(value) {
        this.setStateValue('lineWidth', value);
    }

    /** Miter length limit for `miter` line joins, mirroring the canvas `miterLimit` drawing-state property. */
    public get miterLimit() {
        return this.getStateValue('miterLimit');
    }

    public set miterLimit(value) {
        this.setStateValue('miterLimit', value);
    }

    /** Blur radius applied to the element's shadow, mirroring the canvas `shadowBlur` drawing-state property. */
    public get shadowBlur() {
        return this.getStateValue('shadowBlur');
    }

    public set shadowBlur(value) {
        this.setStateValue('shadowBlur', value);
    }

    /** Colour of the element's shadow, mirroring the canvas `shadowColor` drawing-state property. */
    public get shadowColor() {
        return this.getStateValue('shadowColor');
    }

    public set shadowColor(value) {
        this.setStateValue('shadowColor', value);
    }

    /** Horizontal offset of the element's shadow, mirroring the canvas `shadowOffsetX` drawing-state property. */
    public get shadowOffsetX() {
        return this.getStateValue('shadowOffsetX');
    }

    public set shadowOffsetX(value) {
        this.setStateValue('shadowOffsetX', value);
    }

    /** Vertical offset of the element's shadow, mirroring the canvas `shadowOffsetY` drawing-state property. */
    public get shadowOffsetY() {
        return this.getStateValue('shadowOffsetY');
    }

    public set shadowOffsetY(value) {
        this.setStateValue('shadowOffsetY', value);
    }

    /** Stroke style (colour or gradient) painted along the element's outline, mirroring the canvas `strokeStyle` drawing-state property. */
    public get stroke() {
        return this.getStateValue('stroke');
    }

    public set stroke(value) {
        this.setStateValue('stroke', value);
    }

    /** Horizontal alignment of rendered text, mirroring the canvas `textAlign` drawing-state property. */
    public get textAlign() {
        return this.getStateValue('textAlign');
    }

    public set textAlign(value) {
        this.setStateValue('textAlign', value);
    }

    /** Vertical baseline of rendered text, mirroring the canvas `textBaseline` drawing-state property. */
    public get textBaseline() {
        return this.getStateValue('textBaseline');
    }

    public set textBaseline(value) {
        this.setStateValue('textBaseline', value);
    }

    /** Effective stacking order of the element, combining its own z-index with its parent {@link Group}'s. Higher values render on top. */
    public get zIndex(): number {
        return (this.parent?.zIndex ?? 0) + (this.state.zIndex ?? 0);
    }

    public set zIndex(value) {
        this.setStateValue('zIndex', value);
    }

    /** Horizontal translation applied to the element during rendering, in pixels. */
    public get translateX() {
        return this.getStateValue('translateX');
    }

    public set translateX(value) {
        this.setStateValue('translateX', value);
    }

    /** Vertical translation applied to the element during rendering, in pixels. */
    public get translateY() {
        return this.getStateValue('translateY');
    }

    public set translateY(value) {
        this.setStateValue('translateY', value);
    }

    /** Horizontal scale factor applied to the element during rendering (`1` is unscaled). */
    public get transformScaleX() {
        return this.getStateValue('transformScaleX');
    }

    public set transformScaleX(value) {
        this.setStateValue('transformScaleX', value);
    }

    /** Vertical scale factor applied to the element during rendering (`1` is unscaled). */
    public get transformScaleY() {
        return this.getStateValue('transformScaleY');
    }

    public set transformScaleY(value) {
        this.setStateValue('transformScaleY', value);
    }

    /** Rotation applied to the element during rendering, in radians or as a CSS-like angle string. */
    public get rotation() {
        return this.getStateValue('rotation');
    }

    public set rotation(value) {
        this.setStateValue('rotation', value);
    }

    /** Horizontal origin about which transforms are applied, as a pixel value or percentage string. */
    public get transformOriginX() {
        return this.getStateValue('transformOriginX');
    }

    public set transformOriginX(value) {
        this.setStateValue('transformOriginX', value);
    }

    /** Vertical origin about which transforms are applied, as a pixel value or percentage string. */
    public get transformOriginY() {
        return this.getStateValue('transformOriginY');
    }

    public set transformOriginY(value) {
        this.setStateValue('transformOriginY', value);
    }

    constructor(type: string, {
        id = `${type}:${stringUniqueId()}`,
        class: classes = [],
        data,
        pointerEvents = 'all',
        ...state
    }: ElementOptions<TState>) {
        super();

        this.type = type;
        this.id = id;
        this.data = data;
        this.pointerEvents = pointerEvents;
        this.classList = new Set(valueOneOrMore(classes));

        this.state = {
            ...TRANSFORM_DEFAULTS,
            ...state,
        } as unknown as TState;
    }

    /** Reads a state value, falling back to the parent’s value if the local value is nil (property inheritance). */
    protected getStateValue<TKey extends keyof TState>(key: TKey) {
        return this.state[key] ?? (this.parent as unknown as TState)?.[key];
    }

    /** Sets a state value and emits an `updated` event. */
    protected setStateValue<TKey extends keyof TState>(key: TKey, value: TState[TKey]) {
        this.state[key] = value;
        this.emit('updated', {
            key,
            value,
        });
    }

    /**
     * Subscribes a handler to an element event, returning a disposable subscription.
     *
     * Overrides {@link EventBus.on} to additionally invalidate the {@link Context}'s tracked-element
     * cache for interaction events, keeping hit testing accurate as listeners are added and removed.
     *
     * @param event - The event name to listen for.
     * @param handler - Callback invoked when the event is emitted.
     * @param options - Optional subscription options (e.g. self-only filtering).
     * @returns A disposable used to remove the subscription.
     */
    public on<TEvent extends keyof TEventMap>(event: TEvent, handler: EventHandler<TEventMap[TEvent]>, options?: EventSubscriptionOptions) {
        const listener = super.on(event, handler, options);

        if (!TRACKED_EVENTS.includes(event as keyof ElementEventMap)) {
            return listener;
        }

        this.context?.invalidateTrackedElements(event as string);

        return {
            dispose: () => {
                this.context?.invalidateTrackedElements(event as string);
                listener.dispose();
            },
        };
    }

    /** Creates a shallow clone of this element with the same id, classes, and state. */
    public clone() {
        return new Element(this.type, {
            id: this.id,
            class: Array.from(this.classList),
            ...this.state,
        });
    }

    /** Tests whether this element matches the CSS-like selector. */
    public matches(selector: string): boolean {
        return matches(this, selector);
    }

    /** Returns the closest ancestor (including this element) matching the CSS-like selector, or `undefined`. */
    public closest<TElement extends Element = Element>(selector: string) {
        return closest<TElement>(this, selector);
    }

    /** Returns the axis-aligned bounding box for this element. Override in subclasses for accurate geometry. */
    public getBoundingBox() {
        return new Box(0, 0, 0, 0);
    }

    /** Tests whether a point intersects this element’s bounding box. Override for custom hit testing. */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public intersectsWith(x: number, y: number, options?: Partial<ElementIntersectionOptions>) {
        return isPointInBox([x, y], this.getBoundingBox());
    }

    /** Creates an interpolator that transitions from the current state towards the target state, supporting keyframes and custom interpolator overrides. */
    public interpolate(newState: Partial<ElementInterpolationState<TState>>, interpolators: Partial<ElementInterpolators<TState>> = {}): Interpolator<void> {
        const mappedIntpls = objectReduce(newState, (output, key, value) => {
            const currentValue = this.getStateValue(key);

            if (typeIsNil(currentValue)) {
                return output;
            }

            if (typeIsFunction(value)) {
                return (output[key] = value, output);
            }

            const interpolator = interpolators[key] || getInterpolator(currentValue, key as string);

            if (isElementValueKeyFrame(value)) {
                return (output[key] = getKeyframeInterpolator(currentValue, value, interpolator), output);
            }

            return (output[key] = interpolator(currentValue, value as TState[keyof TState]), output);
        }, {} as Record<keyof TState, Interpolator<TState[keyof TState] | undefined>>);

        return time => objectForEach(mappedIntpls, (key, value) => {
            this.state[key] = value(time) as TState[keyof TState];
        });
    }

    /** Renders this element by applying transforms and context state, then invoking the optional callback. */
    public render(context: Context, callback?: AnyFunction, skipRestore?: boolean) {
        this.context = context;
        context.currentRenderElement = this;

        context.markRenderStart();
        context.save();

        try {
            if (!this.abstract) {
                applyElementTransform(context, this as unknown as Element);
            }

            objectForEach(CONTEXT_OPERATIONS, (key, operation) => {
                const value = (this as unknown as Record<keyof BaseElementState, unknown>)[key];

                if (!this.abstract && !typeIsNil(value)) {
                    (operation as (ctx: Context, val: unknown) => void)(context, value);
                }
            });

            callback?.();
        } finally {
            if (!skipRestore) {
                context.restore();
            }

            context.markRenderEnd();
        }
    }

    /** Detaches the element from its parent {@link Group} and tears down its event subscriptions. */
    public destroy() {
        this.parent?.remove(this as unknown as Element);
        super.destroy();
    }
}

/** Factory function that creates a new `Element` instance. */
export function createElement(...options: ConstructorParameters<typeof Element>) {
    return new Element(...options);
}

/** Type guard that checks whether a value is an `Element` instance. */
export function typeIsElement(value: unknown): value is Element {
    return value instanceof Element;
}
