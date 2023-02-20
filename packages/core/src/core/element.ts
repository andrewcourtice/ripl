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
    arrayFind,
    isArray,
    isFunction,
    isNil,
    isNumber,
    isObject,
    stringUniqueId,
} from '@ripl/utilities';

import {
    createEvent,
    createEventBus,
    Event,
    EventBus,
    EventHandler,
} from './event-bus';

import {
    objectForEach,
    objectMap,
} from '@ripl/utilities';

import {
    Group,
} from './group';

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
    [TKey in keyof TElement]: ElementValue<TElement[TKey]>;
};

export type ElementValueFunctions<TElement extends BaseElement> = {
    [TKey in keyof TElement]: Interpolator<TElement[TKey]>;
};

export type ElementInterpolator<TValue> = (valueA: TValue, valueB: TValue) => Interpolator<TValue>
export type ElementInterpolators<TElement extends BaseElement> = {
    [TKey in keyof TElement]?: ElementInterpolator<TElement[TKey]>;
}

export type ElementDefinition<TElement extends BaseElement, TResult = unknown> = (properties: ElementProperties<TElement>, options: ElementOptions<TElement>, instance: ElementInstance<TElement>) => ElementRenderFunction<TElement, TResult>;
export type ElementConstructor<TElement extends BaseElement, TResult = unknown> = (properties: ElementProperties<TElement>, options?: ElementOptions<TElement>) => Element<TElement, TResult>;
export type ElementRenderFunction<TElement extends BaseElement, TReturn = unknown> = (frame: ElementRenderFrame<TElement>) => TReturn;
export type FrameCallback<TElement extends BaseElement> = (key: keyof TElement, value: TElement[keyof TElement]) => void;
export type ElementPointerEvents = 'none' | 'all' | 'stroke' | 'fill';

export interface ElementDefinitionOptions<TElement extends BaseElement> {
    abstract?: boolean;
    interpolators?: ElementInterpolators<TElement>;
}

export interface ElementOptions<TElement extends BaseElement> {
    id?: string;
    class?: string;
    data?: unknown;
    pointerEvents?: ElementPointerEvents;
    interpolators?: ElementInterpolators<TElement>;
}

export interface ElementInstance<TElement extends BaseElement> {
    onUpdate(handler: EventHandler<ElementEventMap['elementupdated']>): void;
}

export interface ElementRenderFrame<TElement extends BaseElement> {
    context: CanvasRenderingContext2D;
    state: TElement;
    time: number;
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

export interface ElementEvent<TData = unknown> extends Event<TData> {
    element: Element;
}

export interface ElementEventMap<TElement extends BaseElement = BaseElement> {
    scenegraph: ElementEvent;
    elementattached: ElementEvent<Group>;
    elementdetached: ElementEvent<Group>;
    elementupdated: ElementEvent<Partial<ElementProperties<TElement>>>;
    elementmouseenter: ElementEvent<MouseEvent>;
    elementmouseleave: ElementEvent<MouseEvent>;
    elementmousemove: ElementEvent<MouseEvent>;
    elementclick: ElementEvent<MouseEvent>;
}

export interface Element<TElement extends BaseElement = BaseElement, TResult = unknown> {
    id: string;
    type: string;
    class?: string;
    data?: unknown;
    pointerEvents: ElementPointerEvents;
    on: EventBus<ElementEventMap>['on'];
    emit: EventBus<ElementEventMap>['emit'];
    once: EventBus<ElementEventMap>['once'];
    clone(): Element<TElement>;
    update(properties: Partial<ElementProperties<TElement>>): void;
    state(time?: number, callback?: FrameCallback<TElement>): TElement;
    to(newState: Partial<TElement>, time?: number): void;
    render(context: CanvasRenderingContext2D, time?: number): TResult;

    /**
     * @internal
     */
    destroy(): void;
    get parent(): Group | undefined;
    set parent(group: Group | undefined);
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
    });

    return time => {
        const keyframe = arrayFind(deltaFrames, frame => time >= frame.offset, -1);

        if (keyframe) {
            return keyframe.calculate(keyframe.scale(time));
        }
    };
}

function defaultInterpolator<TElement extends BaseElement>(valueA: TElement[keyof TElement], valueB: TElement[keyof TElement]): Interpolator<TElement[keyof TElement]> {
    if (valueA === valueB) {
        return () => valueB;
    }

    if (isNumber(valueA) && isNumber(valueB)) {
        return interpolateNumber(valueA, valueB) as Interpolator<typeof valueA>;
    }

    return time => time > 0.5 ? valueB : valueA;
}

function getInterpolators<TElement extends BaseElement>(
    properties: Partial<ElementProperties<TElement>>,
    interpolators: ElementInterpolators<TElement> = {}
): ElementValueFunctions<TElement> {
    return objectMap(properties, (key, value) => {
        const interpolator = interpolators[key] || defaultInterpolator;

        if (isFunction(value)) {
            return value;
        }

        if (isElementValueKeyFrame(value)) {
            return getKeyframeInterpolator(value, interpolator);
        }

        if (isElementValueBound(value)) {
            return interpolator!(value[0], value[1]);
        }

        return () => value;
    });
}

export function createElementEvent<TElement extends Element, TData = unknown>(element: TElement, data: TData): ElementEvent<TData> {
    return {
        element,
        ...createEvent(data),
    };
}

export function createElement<TElement extends BaseElement, TResult = unknown>(
    type: string,
    definition: ElementDefinition<TElement, TResult>,
    definitionOptions: ElementDefinitionOptions<TElement> = {}
): ElementConstructor<TElement, TResult> {
    const {
        abstract,
        interpolators: rootInterpolators,
    } = definitionOptions;

    return (properties, instanceOptions = {}) => {
        const eventBus = createEventBus<ElementEventMap>();

        const instance = {
            onUpdate: handler => eventBus.on('elementupdated', handler),
        } as ElementInstance<TElement>;

        const {
            id = `${type}:${stringUniqueId()}`,
            pointerEvents = 'all',
            data,
            class: elClass,
            interpolators: instanceInterpolators,
        } = instanceOptions;

        const interpolators = {
            ...INTERPOLATORS,
            ...rootInterpolators,
            ...instanceInterpolators,
        } as ElementInterpolators<TElement>;

        const onRender = definition(properties, instanceOptions, instance);

        let valueFns = getInterpolators(properties, interpolators);

        let parent: Group | undefined;
        let currentState: TElement;
        let result: TResult;

        const element: Element<TElement, TResult> = {
            id,
            type,
            data,
            clone,
            update,
            state,
            to,
            render,
            pointerEvents,
            class: elClass,

            emit,
            on: eventBus.on,
            once: eventBus.once,

            destroy,

            get parent() {
                return parent;
            },

            set parent(group: Group | undefined) {
                parent = group;
            },

            get result() {
                return result;
            },

            get path() {
                return [parent?.id || '', id].join('/');
            },
        };

        function destroy() {
            parent?.remove(element);
            eventBus.destroy();
        }

        function emit<TEvent extends keyof ElementEventMap>(event: TEvent, payload: ElementEventMap[TEvent]) {
            eventBus.emit(event, payload);

            if (parent && payload.bubble) {
                parent.emit(event, payload);
            }
        }

        function clone() {
            return createElement(type, definition, definitionOptions)(properties, instanceOptions);
        }

        function update(properties: Partial<ElementProperties<TElement>>) {
            valueFns = {
                ...valueFns,
                ...getInterpolators(properties, interpolators),
            };

            emit('elementupdated', createElementEvent(element, properties));
        }

        function state(time?: number, callback?: FrameCallback<TElement>) {
            if (isNil(time) && currentState) {
                return currentState;
            }

            const _time = time ?? 0;
            const parentState = parent?.state(_time) || {};
            const output = {} as TElement;

            const updateOutput = (key: keyof TElement, value: TElement[keyof TElement]) => {
                output[key] = value;

                if (callback) {
                    callback(key, value);
                }
            };

            objectForEach(parentState, updateOutput);
            objectForEach(valueFns, (key, value) => updateOutput(key, value(_time)));

            return output;
        }

        function to(newState: Partial<TElement>, time?: number) {
            const currentState = state();
            const targetState = state(time);

            const properties = objectMap(currentState, (key, startValue) => {
                const endValue = newState[key] ?? targetState[key] ?? startValue;

                return startValue === endValue
                    ? startValue
                    : [startValue, endValue];
            });

            update(properties);
        }

        function render(context: CanvasRenderingContext2D, time: number = 0) {
            context.save();

            try {
                currentState = state(time, (key, value) => {
                    if (!abstract && key in CONTEXT_OPERATIONS) {
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
        }

        return element;
    };
}