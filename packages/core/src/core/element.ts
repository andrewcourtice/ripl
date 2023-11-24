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
} from './event-bus';

import {
    objectForEach,
    objectMap,
} from '@ripl/utilities';

import type {
    BaseElement,
    Element,
    ElementConstructor,
    ElementDefinition,
    ElementDefinitionOptions,
    ElementEvent,
    ElementEventMap,
    ElementInstance,
    ElementInterpolator,
    ElementInterpolators,
    ElementProperties,
    ElementValueBounds,
    ElementValueFunctions,
    ElementValueKeyFrame,
    FrameCallback,
    Group,
} from './types';

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