import {
    applyTransform,
    CONTEXT_OPERATIONS,
    TRACKED_EVENTS,
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
    interpolateRotation,
    interpolateTransformOrigin,
    Interpolator,
    InterpolatorFactory,
} from '../interpolators';

import {
    AnyFunction,
    arrayFind,
    objectForEach,
    objectReduce,
    OneOrMore,
    stringUniqueId,
    typeIsArray,
    typeIsFunction,
    typeIsNil,
    typeIsObject,
    valueOneOrMore,
} from '@ripl/utilities';

import type {
    Group,
} from './group';

import type {
    BaseState,
    Context,
} from '../context';

export type ElementPointerEvents = 'none' | 'all' | 'stroke' | 'fill';
export type ElementValidationType = 'info' | 'warning' | 'error';
export type ElementIntersectionOptions = {
    isPointer: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface BaseElementState extends Partial<BaseState> {}

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
    destroyed: null;
}

export type ElementOptions<TState extends BaseElementState = BaseElementState> = {
    id?: string;
    class?: OneOrMore<string>;
    data?: unknown;
    pointerEvents?: ElementPointerEvents;
} & TState;

export type ElementInterpolationKeyFrame<TValue = number> = {
    offset?: number;
    value: TValue;
};

export type ElementInterpolationStateValue<TValue = number> = TValue
| ElementInterpolationKeyFrame<TValue>[]
| Interpolator<TValue>;

export type ElementInterpolators<TState extends BaseElementState> = {
    [TKey in keyof TState]: InterpolatorFactory<TState[TKey]>;
};

export type ElementInterpolationState<TState extends BaseElementState> = {
    [TKey in keyof TState]?: ElementInterpolationStateValue<TState[TKey]>;
};

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const TRANSFORM_INTERPOLATORS: Record<string, InterpolatorFactory<any>> = {
    rotation: interpolateRotation,
    transformOriginX: interpolateTransformOrigin,
    transformOriginY: interpolateTransformOrigin,
};

const TRANSFORM_DEFAULTS: Record<string, number> = {
    translateX: 0,
    translateY: 0,
    transformScaleX: 1,
    transformScaleY: 1,
    rotation: 0,
    transformOriginX: 0,
    transformOriginY: 0,
};

function getInterpolator<TValue>(value: TValue, key?: string) {
    if (key && TRANSFORM_INTERPOLATORS[key]) {
        return TRANSFORM_INTERPOLATORS[key] as InterpolatorFactory<TValue>;
    }

    const interpolator = arrayFind([
        interpolateNumber,
        interpolateGradient,
        interpolateColor,
        interpolateDate,
        interpolatePoints,
        interpolateBorderRadius,
    ], ({ test }) => !!test?.(value));

    return (interpolator ?? interpolateAny) as InterpolatorFactory<TValue>;
}

// Unused decorator - keeping for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function propDefault<TThis, TValue, TDefault = TValue>(value: TDefault) {
    return (target: () => TValue, { kind }: ClassGetterDecoratorContext<TThis, TValue>) => {
        if (kind === 'getter') {
            return () => target() ?? value;
        }
    };
}


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
    public parent?: Group<TEventMap>;
    public data: unknown;

    // Props

    public get direction() {
        return this.getStateValue('direction');
    }

    public set direction(value) {
        this.setStateValue('direction', value);
    }

    public get fillStyle() {
        return this.getStateValue('fillStyle');
    }

    public set fillStyle(value) {
        this.setStateValue('fillStyle', value);
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

    public get globalAlpha() {
        return this.getStateValue('globalAlpha');
    }

    public set globalAlpha(value) {
        this.setStateValue('globalAlpha', value);
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

    public get strokeStyle() {
        return this.getStateValue('strokeStyle');
    }

    public set strokeStyle(value) {
        this.setStateValue('strokeStyle', value);
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
        this.state = state as TState;
        this.pointerEvents = pointerEvents;
        this.classList = new Set(valueOneOrMore(classes));
    }

    protected getStateValue<TKey extends keyof TState>(key: TKey) {
        return this.state[key] ?? (this.parent as unknown as TState)?.[key];
    }

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

        return {
            dispose: () => (this.emit('untrack' as keyof TEventMap, event as TEventMap[keyof TEventMap]), listener.dispose()),
        };
    }

    public clone() {
        return new Element(this.type, {
            id: this.id,
            class: Array.from(this.classList),
            ...this.state,
        });
    }

    public getBoundingBox() {
        return new Box(0, 0, 0, 0);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public intersectsWith(x: number, y: number, options?: Partial<ElementIntersectionOptions>) {
        return isPointInBox([x, y], this.getBoundingBox());
    }

    public interpolate(newState: Partial<ElementInterpolationState<TState>>, interpolators: Partial<ElementInterpolators<TState>> = {}): Interpolator<void> {
        const mappedIntpls = objectReduce(newState, (output, key, value) => {
            let currentValue = this.getStateValue(key);

            if (typeIsNil(currentValue)) {
                const defaultVal = TRANSFORM_DEFAULTS[key as string];

                if (typeIsNil(defaultVal)) {
                    return output;
                }

                currentValue = defaultVal as TState[keyof TState];
                this.state[key] = currentValue;
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

    public render(context: Context, callback?: AnyFunction) {
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
            context.restore();
            context.markRenderEnd();
        }
    }

    public destroy() {
        this.parent?.remove(this as unknown as Element);
        super.destroy();
    }
}

export function createElement(...options: ConstructorParameters<typeof Element>) {
    return new Element(...options);
}

export function typeIsElement(value: unknown): value is Element {
    return value instanceof Element;
}
