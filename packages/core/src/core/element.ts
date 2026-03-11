import {
    CONTEXT_OPERATIONS,
    TRACKED_EVENTS,
    TRANSFORM_DEFAULTS,
    TRANSFORM_INTERPOLATORS,
} from './constants';

import {
    EventBus,
    EventHandler,
    EventMap,
    EventSubscriptionOptions,
} from './event-bus';

import {
    Box,
    isPointInBox,
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
    Interpolator,
    InterpolatorFactory,
} from '../interpolators';

import type {
    Group,
} from './group';

import {
    resolveRotation,
    resolveTransformOrigin,
} from '../context';

import type {
    BaseState,
    Context,
} from '../context';

import {
    AnyFunction,
    objectForEach,
    objectReduce,
    OneOrMore,
    stringUniqueId,
    typeIsArray,
    typeIsFunction,
    typeIsNil,
    typeIsObject,
    typeIsString,
    valueOneOrMore,
} from '@ripl/utilities';

/** Controls which pointer events an element responds to during hit testing. */
export type ElementPointerEvents = 'none' | 'all' | 'stroke' | 'fill';

/** Severity level of an element validation result. */
export type ElementValidationType = 'info' | 'warning' | 'error';

/** Options for element intersection (hit) testing. */
export type ElementIntersectionOptions = {
    isPointer: boolean;
};

/** Base state interface for all elements. All visual properties are optional at the element level. */
export type BaseElementState = Partial<BaseState>;

/** Event map for elements, extending the base event map with lifecycle and interaction events. */
export interface ElementEventMap extends EventMap {
    graph: null;
    track: keyof ElementEventMap;
    untrack: keyof ElementEventMap;
    attached: Group;
    detached: Group;
    updated: null;
    mouseenter: null;
    mouseleave: null;
    mousemove: {
        x: number;
        y: number;
    };
    click: {
        x: number;
        y: number;
    };
    dragstart: {
        x: number;
        y: number;
    };
    drag: {
        x: number;
        y: number;
        startX: number;
        startY: number;
        deltaX: number;
        deltaY: number;
    };
    dragend: {
        x: number;
        y: number;
        startX: number;
        startY: number;
        deltaX: number;
        deltaY: number;
    };
    destroyed: null;
}

/** Options for constructing an element, combining an optional id, CSS classes, data, pointer events, and initial state. */
export type ElementOptions<TState extends BaseElementState = BaseElementState> = {
    id?: string;
    class?: OneOrMore<string>;
    data?: unknown;
    pointerEvents?: ElementPointerEvents;
} & TState;

/** A single keyframe in a multi-step interpolation, with an optional offset (0–1) and a target value. */
export type ElementInterpolationKeyFrame<TValue = number> = {
    offset?: number;
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
    type: ElementValidationType;
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

function applyTransform(context: Context, _value: unknown, element: Element) {
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

    context.translate(originX + translateX, originY + translateY);

    if (hasRotation) {
        context.rotate(rotation);
    }

    if (hasScale) {
        context.scale(scaleX, scaleY);
    }

    if (hasOrigin) {
        context.translate(-originX, -originY);
    }
}

/** The base renderable element with state management, event handling, interpolation, transform support, and context rendering. */
export class Element<
    TState extends BaseElementState = BaseElementState,
    TEventMap extends ElementEventMap = ElementEventMap
> extends EventBus<TEventMap> {

    protected state: TState;
    protected context?: Context;

    public id: string;
    public readonly type: string;
    public readonly classList: Set<string>;

    public abstract: boolean = false;
    public pointerEvents: ElementPointerEvents = 'all';
    public declare parent?: Group<TEventMap>;
    public data: unknown;

    // Props

    public get direction() {
        return this.getStateValue('direction');
    }

    public set direction(value) {
        this.setStateValue('direction', value);
    }

    public get fill() {
        return this.getStateValue('fill');
    }

    public set fill(value) {
        this.setStateValue('fill', value);
    }

    public get filter() {
        return this.getStateValue('filter');
    }

    public set filter(value) {
        this.setStateValue('filter', value);
    }

    public get font() {
        return this.getStateValue('font');
    }

    public set font(value) {
        this.setStateValue('font', value);
    }

    public get opacity() {
        return this.getStateValue('opacity');
    }

    public set opacity(value) {
        this.setStateValue('opacity', value);
    }

    public get globalCompositeOperation() {
        return this.getStateValue('globalCompositeOperation');
    }

    public set globalCompositeOperation(value) {
        this.setStateValue('globalCompositeOperation', value);
    }

    public get lineCap() {
        return this.getStateValue('lineCap');
    }

    public set lineCap(value) {
        this.setStateValue('lineCap', value);
    }

    public get lineDash() {
        return this.getStateValue('lineDash');
    }

    public set lineDash(value) {
        this.setStateValue('lineDash', value);
    }

    public get lineDashOffset() {
        return this.getStateValue('lineDashOffset');
    }

    public set lineDashOffset(value) {
        this.setStateValue('lineDashOffset', value);
    }

    public get lineJoin() {
        return this.getStateValue('lineJoin');
    }

    public set lineJoin(value) {
        this.setStateValue('lineJoin', value);
    }

    public get lineWidth() {
        return this.getStateValue('lineWidth');
    }

    public set lineWidth(value) {
        this.setStateValue('lineWidth', value);
    }

    public get miterLimit() {
        return this.getStateValue('miterLimit');
    }

    public set miterLimit(value) {
        this.setStateValue('miterLimit', value);
    }

    public get shadowBlur() {
        return this.getStateValue('shadowBlur');
    }

    public set shadowBlur(value) {
        this.setStateValue('shadowBlur', value);
    }

    public get shadowColor() {
        return this.getStateValue('shadowColor');
    }

    public set shadowColor(value) {
        this.setStateValue('shadowColor', value);
    }

    public get shadowOffsetX() {
        return this.getStateValue('shadowOffsetX');
    }

    public set shadowOffsetX(value) {
        this.setStateValue('shadowOffsetX', value);
    }

    public get shadowOffsetY() {
        return this.getStateValue('shadowOffsetY');
    }

    public set shadowOffsetY(value) {
        this.setStateValue('shadowOffsetY', value);
    }

    public get stroke() {
        return this.getStateValue('stroke');
    }

    public set stroke(value) {
        this.setStateValue('stroke', value);
    }

    public get textAlign() {
        return this.getStateValue('textAlign');
    }

    public set textAlign(value) {
        this.setStateValue('textAlign', value);
    }

    public get textBaseline() {
        return this.getStateValue('textBaseline');
    }

    public set textBaseline(value) {
        this.setStateValue('textBaseline', value);
    }

    public get zIndex(): number {
        return (this.parent?.zIndex ?? 0) + (this.state.zIndex ?? 0);
    }

    public set zIndex(value) {
        this.setStateValue('zIndex', value);
    }

    public get translateX() {
        return this.getStateValue('translateX');
    }

    public set translateX(value) {
        this.setStateValue('translateX', value);
    }

    public get translateY() {
        return this.getStateValue('translateY');
    }

    public set translateY(value) {
        this.setStateValue('translateY', value);
    }

    public get transformScaleX() {
        return this.getStateValue('transformScaleX');
    }

    public set transformScaleX(value) {
        this.setStateValue('transformScaleX', value);
    }

    public get transformScaleY() {
        return this.getStateValue('transformScaleY');
    }

    public set transformScaleY(value) {
        this.setStateValue('transformScaleY', value);
    }

    public get rotation() {
        return this.getStateValue('rotation');
    }

    public set rotation(value) {
        this.setStateValue('rotation', value);
    }

    public get transformOriginX() {
        return this.getStateValue('transformOriginX');
    }

    public set transformOriginX(value) {
        this.setStateValue('transformOriginX', value);
    }

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
        this.emit('updated', null);
    }

    public on<TEvent extends keyof TEventMap>(event: TEvent, handler: EventHandler<TEventMap[TEvent]>, options?: EventSubscriptionOptions) {
        const listener = super.on(event, handler, options);

        if (!TRACKED_EVENTS.includes(event as keyof ElementEventMap)) {
            return listener;
        }

        this.emit('track' as keyof TEventMap, event as TEventMap[keyof TEventMap]);
        this.context?.invalidateTrackedElements(event as string);

        return {
            dispose: () => {
                this.emit('untrack' as keyof TEventMap, event as TEventMap[keyof TEventMap]);
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
                applyTransform(context, null, this as unknown as Element);
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
