import {
    CONTEXT_OPERATIONS,
    INTERPOLATORS,
} from './constants';

import {
    scaleContinuous,
} from '../scales';

import {
    interpolateNumber,
    Interpolator,
} from '../interpolators';

import {
    isArray,
    isFunction,
    isNil,
    isNumber,
    isObject,
} from '../utilities';

import defaultEventBus,{
    EventBus,
} from './event-bus';

export type ElementValueBounds<TValue = number> = [first: TValue, last: TValue];
export type ElementValueKeyFrame<TValue = number> = {
    offset?: number;
    value: TValue;
}

export type ElementValue<TValue = number> = TValue
| ElementValueBounds<TValue>
| ElementValueKeyFrame<TValue>[]
| Interpolator<TValue>;


export type ElementProperties<TElement extends BaseElement> = {
    [P in keyof TElement]: ElementValue<TElement[P]>;
};

export type ElementValueFunctions<TElement extends BaseElement> = {
    [P in keyof TElement]: Interpolator<TElement[P]>;
};

export type ElementInterpolator<TValue> = (valueA: TValue, valueB: TValue) => Interpolator<TValue>
export type ElementInterpolators<TElement extends BaseElement> = {
    [P in keyof TElement]?: ElementInterpolator<TElement[P]>;
}

export type ElementConstructor<TElement extends BaseElement> = (properties: ElementProperties<TElement>, options?: ElementOptions<TElement>) => Element<TElement>;
export type ElementRenderFunction<TElement extends BaseElement, TReturn = unknown> = (frame: ElementRenderFrame<TElement>) => TReturn;
export type ElementValidator<TElement extends BaseElement> = (properties: ElementProperties<TElement>) => boolean;
export type FrameCallback<TElement extends BaseElement> = (key: keyof TElement, value: TElement[keyof TElement]) => void;
export type ElementPointerEvents = 'none' | 'all' | 'stroke' | 'fill';

export interface ElementDefinition<TElement extends BaseElement, TReturn = unknown> {
    name: string;
    renderless?: boolean;
    interpolators?: ElementInterpolators<TElement>;
    validate?: ElementValidator<TElement>;
    onRender: ElementRenderFunction<TElement, TReturn>;
}

export interface ElementOptions<TElement extends BaseElement> {
    class?: string;
    pointerEvents?: ElementPointerEvents;
    interpolators?: ElementInterpolators<TElement>;
}

export interface ElementRenderFrame<TElement extends BaseElement> {
    context: CanvasRenderingContext2D;
    state: TElement;
    time: number;
}

export interface ElementRenderData {
    [key: PropertyKey]: unknown;
    base?: BaseElement;
}

export interface BaseElement {
    strokeStyle?: CanvasRenderingContext2D['strokeStyle'];
    fillStyle?: CanvasRenderingContext2D['fillStyle'];
    lineWidth?: CanvasRenderingContext2D['lineWidth'];
    lineDash?: number[];
    lineDashOffset?: CanvasRenderingContext2D['lineDashOffset'];
    lineCap?: CanvasRenderingContext2D['lineCap'];
    lineJoin?: CanvasRenderingContext2D['lineJoin'];
    miterLimit?: CanvasRenderingContext2D['miterLimit'];

    font?: CanvasRenderingContext2D['font'];
    direction?: CanvasRenderingContext2D['direction'];
    textAlign?: CanvasRenderingContext2D['textAlign'];
    textBaseline?: CanvasRenderingContext2D['textBaseline'];

    filter?: CanvasRenderingContext2D['filter'];
    globalAlpha?: CanvasRenderingContext2D['globalAlpha'];
    globalCompositeOperation?: CanvasRenderingContext2D['globalCompositeOperation'];

    shadowBlur?: CanvasRenderingContext2D['shadowBlur'];
    shadowColor?: CanvasRenderingContext2D['shadowColor'];
    shadowOffsetX?: CanvasRenderingContext2D['shadowOffsetX'];
    shadowOffsetY?: CanvasRenderingContext2D['shadowOffsetY'];
}

export interface Element<TElement extends BaseElement = BaseElement, TResult = unknown> {
    id: symbol;
    name: string;
    class?: string;
    pointerEvents: ElementPointerEvents;
    clone(): Element<TElement>;
    update(properties: Partial<ElementProperties<TElement>>): void;
    state(time?: number, callback?: FrameCallback<TElement>): TElement;
    to(newState: Partial<TElement>): void;
    render(context: CanvasRenderingContext2D, time?: number): TResult;

    /**
     * @internal
     */
    get parent(): Element | undefined;
    set parent(element: Element | undefined);
    get eventBus(): EventBus;
    set eventBus(element: EventBus | undefined);
    get path(): string;
    get result(): TResult | undefined;
}

function isElementValueBound(value: unknown): value is ElementValueBounds<any> {
    return isArray(value) && value.length === 2;
}

function isElementValueKeyFrame(value: unknown): value is ElementValueKeyFrame<any>[] {
    return isArray(value) && value.every(keyframe => isObject(keyframe) && 'value' in keyframe);
}

function getKeyframeInterpolator<TValue>(value: ElementValueKeyFrame<TValue>[], calculator: ElementInterpolator<TValue>): Interpolator<TValue | undefined> {
    const lastIndex = value.length - 1;
    const keyframes = value.map(({ offset, value }, index) => ({
        value,
        offset: isNil(offset) ? index / lastIndex : offset,
    }));

    if (keyframes[0].offset !== 0) {
        keyframes.unshift({
            offset: 0,
            value: keyframes[0].value,
        });
    }

    if (keyframes[lastIndex].offset !== 1) {
        keyframes.push({
            offset: 1,
            value: keyframes[lastIndex ].value,
        });
    }

    keyframes.sort(({ offset: oa }, { offset: ob }) => oa - ob);

    const deltaFrames = Array.from({ length: keyframes.length - 1 }, (_, index) => {
        const frameA = keyframes[index];
        const frameB = keyframes[index + 1];
        const scale = scaleContinuous([frameA.offset, frameB.offset], [0, 1]);
        const calculate = calculator(frameA.value, frameB.value);

        return {
            scale,
            calculate,
            ...frameA,
        };
    }).reverse();

    return time => {
        const keyframe = deltaFrames.find(frame => time >= frame.offset);

        if (keyframe) {
            return keyframe.calculate(keyframe.scale(time));
        }
    };
}

function defaultInterpolator<TElement extends BaseElement>(valueA: TElement[keyof TElement], valueB: TElement[keyof TElement]): Interpolator<TElement[keyof TElement]> {
    if (isNumber(valueA) && isNumber(valueB)) {
        return interpolateNumber(valueA, valueB) as Interpolator<typeof valueA>;
    }

    return time => time > 0.5 ? valueB : valueA;
}

function getInterpolators<TElement extends BaseElement>(properties: Partial<ElementProperties<TElement>>, interpolators: ElementInterpolators<TElement> = {}): ElementValueFunctions<TElement> {
    const output = {} as ElementValueFunctions<TElement>;

    for (const key in properties) {
        const value = properties[key];
        const interpolator = interpolators[key] || defaultInterpolator;

        if (isFunction(value)) {
            output[key] = value;
            continue;
        }

        if (isElementValueKeyFrame(value)) {
            output[key] = getKeyframeInterpolator(value, interpolator);
            continue;
        }

        if (isElementValueBound(value)) {
            output[key] = interpolator!(value[0], value[1]);
            continue;
        }

        output[key] = time => value;
    }

    return output;
}

export function element<TElement extends BaseElement, TReturn = unknown>(definition: ElementDefinition<TElement, TReturn>): ElementConstructor<TElement> {
    const {
        name,
        validate,
        onRender,
        renderless,
        interpolators: rootInterpolators,
    } = definition;

    return (properties, options): Element<TElement> => {
        const id = Symbol();

        const {
            interpolators,
            class: elClass,
            pointerEvents = 'all',
        } = options || {};

        if (validate && !validate(properties)) {
            throw new Error('invalid shape options provided');
        }

        const mergedInterpolators = {
            ...INTERPOLATORS,
            ...rootInterpolators,
            ...interpolators,
        } as ElementInterpolators<TElement>;

        let valueFns = getInterpolators(properties, mergedInterpolators);

        let eventBus: EventBus | undefined;
        let parent: Element | undefined;

        let currentState: TElement;
        let result: TReturn;

        const getEventBus = () => eventBus || parent?.eventBus || defaultEventBus;

        const clone = () => element(definition)(properties, options);
        const update = (properties: Partial<ElementProperties<TElement>>) => {
            valueFns = {
                ...valueFns,
                ...getInterpolators(properties, mergedInterpolators),
            };
        };

        const state = (time?: number, callback?: FrameCallback<TElement>) => {
            if (isNil(time) && currentState) {
                return currentState;
            }

            const _time = time ?? 0;
            const parentState = parent?.state(_time) || {};
            const output = {} as TElement;

            const updateOutput = (key: keyof TElement, value: unknown) => {
                output[key] = value;

                if (callback) {
                    callback(key, value);
                }
            };

            for (const key in parentState) {
                updateOutput(key, parentState[key]);
            }

            for (const key in valueFns) {
                updateOutput(key, valueFns[key](_time));
            }

            return output;
        };

        const to = (newState: Partial<TElement>) => {
            currentState = currentState || state();

            const properties = {} as ElementProperties<TElement>;

            for (const key in currentState) {
                const startValue = currentState[key];
                const endValue = newState[key] || startValue;

                properties[key] = [startValue, endValue] as ElementValueBounds<typeof currentState[typeof key]>;
            }

            update(properties);
        };

        const render = (context: CanvasRenderingContext2D, time: number = 0) => {
            context.save();

            try {
                currentState = state(time, (key, value) => {
                    if (!renderless && key in CONTEXT_OPERATIONS) {
                        CONTEXT_OPERATIONS[key]?.(context, value);
                    }
                });

                result = onRender({
                    context,
                    time,
                    state: currentState,
                });
            } finally {
                context.restore();
            }

            return result;
        };

        return {
            id,
            name,
            clone,
            update,
            state,
            to,
            render,
            pointerEvents,
            class: elClass,

            get parent() {
                return parent;
            },
            set parent(par) {
                parent = par;
            },

            get result() {
                return result;
            },

            get path() {
                return [parent?.path || '', `.${elClass}`].join(' ');
            },

            get eventBus() {
                return getEventBus();
            },
            set eventBus(bus) {
                eventBus = bus;
            },
        };
    };
}