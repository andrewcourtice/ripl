import {
    CONTEXT_OPERATIONS,
    INTERPOLATORS,
} from './constants';

import {
    createEvent,
    createEventBus,
} from './event-bus';

import {
    scaleContinuous,
} from '../scales';

import {
    interpolateNumber,
    Interpolator,
} from '../interpolators';

import {
    Box,
    isPointInBox,
} from '../math';

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
    objectForEach,
    objectMap,
} from '@ripl/utilities';

import type {
    BaseElementAttrs,
    BaseElementState,
    Element,
    ElementBoundingBoxHandler,
    ElementConstructor,
    ElementDefinition,
    ElementDefinitionOptions,
    ElementEvent,
    ElementEventMap,
    ElementInstance,
    ElementInterpolator,
    ElementInterpolators,
    ElementIntersectionHandler,
    ElementIntersectionOptions,
    ElementProducers,
    ElementProperties,
    ElementValidationHandler,
    ElementValueBounds,
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

function defaultInterpolator<TState extends BaseElementState>(valueA: TState[keyof TState], valueB: TState[keyof TState]): Interpolator<TState[keyof TState]> {
    if (valueA === valueB) {
        return () => valueB;
    }

    if (isNumber(valueA) && isNumber(valueB)) {
        return interpolateNumber(valueA, valueB) as Interpolator<typeof valueA>;
    }

    return time => time > 0.5 ? valueB : valueA;
}

function getProducers<TState extends BaseElementState>(
    properties: Partial<ElementProperties<TState>>,
    interpolators: ElementInterpolators<TState> = {}
): ElementProducers<TState> {
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

export function defineElement<TState extends BaseElementState, TAttrs extends BaseElementAttrs = BaseElementAttrs>(
    type: string,
    definition: ElementDefinition<TState, TAttrs>,
    definitionOptions: ElementDefinitionOptions<TState> = {}
): ElementConstructor<TState, TAttrs> {
    const {
        abstract,
        interpolators: definitionInterpolators,
    } = definitionOptions;

    return (instanceOptions = {}) => {
        const eventBus = createEventBus<ElementEventMap>();

        let {
            id = `${type}:${stringUniqueId()}`,
            props = {},
            attrs = {
                pointerEvents: 'all',
            } as TAttrs,
            data,
            class: elClass,
            interpolators: instanceInterpolators,
        } = instanceOptions;

        let getBoundingBoxHandler: ElementBoundingBoxHandler<TState> = () => new Box(0, 0, 0, 0);
        let intersectsWithHandler: ElementIntersectionHandler<TState> = () => false;
        let validationHandler: ElementValidationHandler<TState> = () => true;

        const interpolators = {
            ...INTERPOLATORS,
            ...definitionInterpolators,
            ...instanceInterpolators,
        } as ElementInterpolators<TState>;

        const instance = {
            emit,
            on: eventBus.on,
            once: eventBus.once,

            getAttrs: () => attrs,
            getAttr: key => attrs[key],

            setBoundingBoxHandler: handler => getBoundingBoxHandler = handler,
            setIntersectionHandler: handler => intersectsWithHandler = handler,
            setValidationHandler: handler => validationHandler = handler,
        } as ElementInstance<TState, TAttrs>;

        const onRender = definition(instance);

        let producers = getProducers(props, interpolators);

        let ctx: CanvasRenderingContext2D | undefined;
        let parent: Group | undefined;
        let currentState: TState;

        const element: Element<TState, TAttrs> = {
            id,
            type,
            data,
            clone,
            setProps,
            setAttrs,
            getState,
            setEndState,
            getBoundingBox,
            intersectsWith,
            render,
            class: elClass,

            emit,
            on: eventBus.on,
            once: eventBus.once,

            destroy,

            get attrs () {
                return Object.freeze(attrs) as TAttrs;
            },

            get parent() {
                return parent;
            },

            set parent(group: Group | undefined) {
                parent = group;
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
            return defineElement(type, definition, definitionOptions)(instanceOptions);
        }

        function setProps(properties: Partial<ElementProperties<TState>>) {
            producers = {
                ...producers,
                ...getProducers(properties, interpolators),
            };

            emit('element:updated', createElementEvent(element, properties));
        }

        function setAttrs(attributes: Partial<TAttrs>) {
            attrs = {
                ...attrs,
                ...attributes,
            };
        }

        function getState(time?: number, callback?: FrameCallback<TState>) {
            if (isNil(time) && currentState) {
                return currentState;
            }

            const _time = time ?? 0;
            const parentState = parent?.getState(_time) || {};
            const output = {} as TState;

            const updateOutput = (key: keyof TState, value: TState[keyof TState]) => {
                output[key] = value;

                if (callback) {
                    callback(key, value);
                }
            };

            objectForEach(parentState, updateOutput);
            objectForEach(producers, (key, value) => updateOutput(key, value(_time)));

            return output;
        }

        function setEndState(newState: Partial<TState>, time?: number) {
            const currentState = getState();
            const targetState = getState(time);

            const properties = objectMap(currentState, (key, startValue) => {
                const endValue = newState[key] ?? targetState[key] ?? startValue;

                return startValue === endValue
                    ? startValue
                    : [startValue, endValue];
            });

            setProps(properties);
        }

        function getBoundingBox() {
            if (!ctx) {
                throw new Error('Failed operation - This operation requires the element to first be rendered to a context');
            }

            return getBoundingBoxHandler({
                context: ctx,
                state: getState(),
            });
        }

        function intersectsWith(x: number, y: number, options?: ElementIntersectionOptions) {
            if (!ctx) {
                throw new Error('Failed operation - This operation requires the element to first be rendered to a context');
            }

            const {
                isPointer = false,
            } = options || {};

            return intersectsWithHandler([x, y], {
                isPointer,
                context: ctx,
                state: getState(),
            });
        }

        function render(context: CanvasRenderingContext2D, time: number = 0) {
            ctx = context;

            context.save();

            try {
                currentState = getState(time, (key, value) => {
                    if (!abstract && key in CONTEXT_OPERATIONS) {
                        CONTEXT_OPERATIONS[key]?.(context, value);
                    }
                });

                onRender({
                    context,
                    time,
                    state: currentState,
                });
            } finally {
                context.restore();
            }
        }

        return element;
    };
}