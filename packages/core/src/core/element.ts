import {
    CALCULATORS,
    CONTEXT_OPERATIONS,
} from './constants';

import {
    interpolateNumber,
} from '../math/interpolate';

import {
    continuous,
} from '../math/scale';

import {
    isArray,
    isFunction,
    isNil,
    isNumber,
    isObject,
} from '../utilities/type';

import defaultEventBus,{
    EventBus,
} from './event-bus';

export type ElementValueFunction<TValue = number> = (time: number) => TValue;
export type ElementValueBounds<TValue = number> = [first: TValue, last: TValue];
export type ElementValueKeyFrame<TValue = number> = {
    offset?: number;
    value: TValue;
}

export type ElementValue<TValue = number> = TValue
| ElementValueBounds<TValue>
| ElementValueKeyFrame<TValue>[]
| ElementValueFunction<TValue>;

export interface BaseElement {
    strokeStyle?: string;
    fillStyle?: string;
    lineWidth?: number;
    lineDash?: number[];
    lineDashOffset?: CanvasRenderingContext2D['lineDashOffset'];
    lineCap?: CanvasRenderingContext2D['lineCap'];
    lineJoin?: CanvasRenderingContext2D['lineJoin'];
    font?: CanvasRenderingContext2D['font'];
    filter?: CanvasRenderingContext2D['filter'];
}

export type ElementProperties<TElement extends BaseElement> = {
    [P in keyof TElement]: ElementValue<TElement[P]>;
};

export type ElementValueFunctions<TElement extends BaseElement> = {
    [P in keyof TElement]: ElementValueFunction<TElement[P]>;
};

export type ElementCalculator<TValue> = (valueA: TValue, valueB: TValue) => ElementValueFunction<TValue>
export type ElementCalculators<TElement extends BaseElement> = {
    [P in keyof TElement]?: ElementCalculator<TElement[P]>;
}

export type ElementRenderFunction<TElement extends BaseElement, TReturn = unknown> = (context: CanvasRenderingContext2D, frame: ElementRenderFrame<TElement>) => TReturn;
export type ElementValidator<TElement extends BaseElement> = (properties: ElementProperties<TElement>) => boolean;

export interface ElementDefinition<TElement extends BaseElement, TReturn = unknown> {
    name: string;
    renderless?: boolean;
    calculators?: ElementCalculators<TElement>;
    validate?: ElementValidator<TElement>;
    onRender: ElementRenderFunction<TElement, TReturn>;
}

export interface ElementOptions<TElement extends BaseElement> {
    class?: string;
    calculators?: ElementCalculators<TElement>;
}

export type ElementConstructor<TElement extends BaseElement> = (properties: ElementProperties<TElement>, options?: ElementOptions<TElement>) => Element<TElement>;

export interface ElementRenderFrame<TElement extends BaseElement> {
    state: TElement;
    time: number;
}

export interface ElementRenderData {
    [key: PropertyKey]: unknown;
    base?: BaseElement;
}

export type FrameCallback<TElement extends BaseElement> = (key: keyof TElement, value: TElement[keyof TElement]) => void;

export interface Element<TElement extends BaseElement, TResult = unknown> {
    id: symbol;
    name: string;
    clone: () => Element<TElement>;
    update: (properties: Partial<ElementProperties<TElement>>) => void;
    state: (time: number, callback?: FrameCallback<TElement>) => TElement;
    to: (newState: Partial<TElement>) => void;
    render: (context: CanvasRenderingContext2D, time?: number) => TResult;

    /**
     * @internal
     */
    get parent(): Element<any> | undefined;
    set parent(element: Element<any> | undefined);
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

function getKeyframeValueFns<TValue>(value: ElementValueKeyFrame<TValue>[], calculator: ElementCalculator<TValue>): ElementValueFunction<TValue | undefined> {
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
        const scale = continuous([frameA.offset, frameB.offset], [0, 1]);
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

function defaultCalculator<TElement extends BaseElement>(valueA: TElement[keyof TElement], valueB: TElement[keyof TElement]): ElementValueFunction<TElement[keyof TElement]> {
    if (isNumber(valueA) && isNumber(valueB)) {
        return time => interpolateNumber(valueA, valueB, time) as typeof valueA;
    }

    return time => time > 0.5 ? valueB : valueA;
}

function getValueFns<TElement extends BaseElement>(properties: Partial<ElementProperties<TElement>>, calculators: ElementCalculators<TElement> = {}): ElementValueFunctions<TElement> {
    const output = {} as ElementValueFunctions<TElement>;

    for (const key in properties) {
        const value = properties[key];
        const calculator = calculators[key] || defaultCalculator;

        if (isFunction(value)) {
            output[key] = value;
            continue;
        }

        if (isElementValueKeyFrame(value)) {
            output[key] = getKeyframeValueFns(value, calculator);
            continue;
        }

        if (isElementValueBound(value)) {
            output[key] = calculator!(value[0], value[1]);
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
        calculators: rootCalculators,
    } = definition;

    return (properties, options): Element<TElement> => {
        const id = Symbol();

        const {
            calculators,
            class: elClass,
        } = options || {};

        if (validate && !validate(properties)) {
            throw new Error('invalid shape options provided');
        }

        const mergedCalculators = {
            ...CALCULATORS,
            ...rootCalculators,
            ...calculators,
        } as ElementCalculators<TElement>;

        let valueFns = getValueFns(properties, mergedCalculators);

        let eventBus: EventBus | undefined;
        let parent: Element<any> | undefined;

        let currentState: TElement;
        let result: TReturn;

        const getEventBus = () => eventBus || parent?.eventBus || defaultEventBus;

        const clone = () => element(definition)(properties, options);
        const update = (properties: Partial<ElementProperties<TElement>>) => {
            valueFns = {
                ...valueFns,
                ...getValueFns(properties, mergedCalculators),
            };
        };

        const state = (time: number, callback?: FrameCallback<TElement>) => {
            const state = {
                ...parent?.state(time),
            } as TElement;

            for (const key in valueFns) {
                const value = valueFns[key](time);
                state[key] = value;

                if (callback) {
                    callback(key, value);
                }
            }

            return state;
        };

        const to = (newState: Partial<TElement>) => {
            currentState = currentState || state(0);

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

                result = onRender(context, {
                    state: currentState,
                    time,
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