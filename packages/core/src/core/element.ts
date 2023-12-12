import {
    CONTEXT_OPERATIONS,
    TRACKED_EVENTS,
} from './constants';

import {
    createEvent,
    createEventBus,
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
    interpolateNumber,
    interpolatePoints,
    Interpolator,
    InterpolatorFactory,
} from '../interpolators';

import {
    arrayFind,
    CachedFunction,
    functionCache,
    objectFreeze,
    objectReduce,
    stringUniqueId,
    typeIsArray,
    typeIsFunction,
    typeIsNil,
    typeIsObject,
} from '@ripl/utilities';

import {
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
    ElementInterpolationState,
    ElementIntersectionHandler,
    ElementIntersectionOptions,
    ElementValidationHandler,
    EventHandler,
    FrameCallback,
    Group,
    RendererTransitionKeyFrame,
} from './types';

function isElementValueKeyFrame(value: unknown): value is RendererTransitionKeyFrame<any>[] {
    return typeIsArray(value) && value.every(keyframe => typeIsObject(keyframe) && 'value' in keyframe);
}

function getKeyframeInterpolator<TValue>(currentValue: TValue, frames: RendererTransitionKeyFrame<TValue>[], interpolator: InterpolatorFactory<TValue>): Interpolator<TValue | undefined> {
    let keyframes = [{
        offset: 0,
        value: currentValue,
    }].concat(frames);

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

    const frameScale = scaleContinuous([0, 1], [0, keyframes.length - 1], true);
    const interpolators = Array.from({ length: keyframes.length - 1 }, (_, index) => {
        const frameA = keyframes[index];
        const frameB = keyframes[index + 1];
        const scale = scaleContinuous([frameA.offset, frameB.offset], [0, 1]);
        const interpolate = interpolator(frameA.value, frameB.value);

        return (time: number) => interpolate(scale(time));
    });

    return time => interpolators[Math.floor(frameScale(time))](time);
}

function getInterpolator<TValue>(value: TValue) {
    const interpolator = arrayFind([
        interpolateNumber,
        interpolateColor,
        interpolateDate,
        interpolatePoints,
        interpolateBorderRadius,
    ], ({ test }) => !!test?.(value));

    return (interpolator ?? interpolateAny) as InterpolatorFactory<TValue>;
}

export function createElementEvent<TData = unknown>(element: Element, data: TData): ElementEvent<TData> {
    return {
        element,
        ...createEvent(data),
    };
}

export function defineElement<TState extends BaseElementState, TAttrs extends BaseElementAttrs = BaseElementAttrs, TExtension extends Record<PropertyKey, any> = {}>(
    type: string,
    definition: ElementDefinition<TState, TAttrs, TExtension>,
    definitionOptions: ElementDefinitionOptions<TState> = {}
) {
    const {
        abstract,
    } = definitionOptions;

    const constructor: ElementConstructor<TState, TAttrs, TExtension> = (instanceOptions = {}) => {
        const eventBus = createEventBus<ElementEventMap>();

        let {
            id = `${type}:${stringUniqueId()}`,
            state = {} as TState,
            attrs = {
                pointerEvents: 'all',
            } as TAttrs,
            data,
            class: elClass = [],
            interpolators = {},
        } = instanceOptions;

        let context: CanvasRenderingContext2D | undefined;
        let parent: Group | undefined;
        let extension = {} as TExtension;

        let getBoundingBoxHandler: CachedFunction<ElementBoundingBoxHandler<TState>> = functionCache(() => new Box(0, 0, 0, 0));
        let intersectsWithHandler: CachedFunction<ElementIntersectionHandler<TState>> = functionCache(point => isPointInBox(point, getBoundingBox()));
        let validationHandler: ElementValidationHandler<TState> = () => true;

        const classList = new Set(([] as string[]).concat(elClass));

        const instance = {
            emit,
            on: eventBus.on,
            once: eventBus.once,

            get id() {
                return id;
            },

            getAttrs () {
                return objectFreeze(attrs);
            },

            getState() {
                return objectFreeze(getState());
            },

            extend(value) {
                extension = value;
            },

            setBoundingBoxHandler: handler => getBoundingBoxHandler = functionCache(handler),
            setIntersectionHandler: handler => intersectsWithHandler = functionCache(handler),
            setValidationHandler: handler => validationHandler = handler,
        } as ElementInstance<TState, TAttrs, TExtension>;

        const onRender = definition(instance);

        const element: Element<TState, TAttrs, TExtension> = {
            ...extension,
            clone,
            interpolate,
            getBoundingBox,
            intersectsWith,
            render,
            classList,

            emit,
            has: eventBus.has,
            on: trackEvents('on'),
            once: trackEvents('once'),

            destroy,
            setAttrs,
            setState,

            get id() {
                return id;
            },

            set id(value) {
                id = value;
            },

            get type() {
                return type;
            },

            get class() {
                return Array.from(classList).join('.');
            },

            get attrs () {
                return objectFreeze(attrs);
            },

            get state() {
                return objectFreeze(getState());
            },

            get interpolators() {
                return objectFreeze(interpolators);
            },

            get data() {
                return data;
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

        function trackEvents<TEvent extends keyof ElementEventMap>(method: 'on' | 'once') {
            return (event: TEvent, handler: EventHandler<ElementEventMap[TEvent]>) => {
                const listener = eventBus[method](event, handler);

                if (!TRACKED_EVENTS.includes(event)) {
                    return listener;
                }

                const elEvent = createElementEvent(element, event);
                emit('scene:track', elEvent);

                return {
                    dispose: () => (emit('scene:untrack', elEvent), listener.dispose()),
                };
            };
        }

        function clone() {
            return constructor(instanceOptions);
        }

        function setState(newState: Partial<TState>) {
            Object.assign(state, newState);
            return element;
        }

        function setAttrs(newAttrs: Partial<TAttrs>) {
            Object.assign(attrs, newAttrs);
            return element;
        }

        function getState(callback?: FrameCallback<TState>) {
            const parentState = parent?.state || {};
            const output = {
                ...parentState,
                ...state,
            };

            return callback
                ? objectMap(output, (key, value) => (callback(key, value), value))
                : output;
        }

        function getBoundingBox() {
            if (!context) {
                throw new Error('Failed operation - This operation requires the element to first be rendered to a context');
            }

            return getBoundingBoxHandler({
                context,
                state: getState(),
            });
        }

        function intersectsWith(x: number, y: number, options?: ElementIntersectionOptions) {
            if (!context) {
                throw new Error('Failed operation - This operation requires the element to first be rendered to a context');
            }

            const {
                isPointer = false,
            } = options || {};

            return intersectsWithHandler([x, y], {
                isPointer,
                context,
                state: getState(),
            });
        }

        function interpolate(newState: ElementInterpolationState<TState>): Interpolator<TState> {
            const currentState = getState();

            const interpolators = objectReduce(newState, (output, key, value) => {
                const currentValue = currentState[key];

                if (typeIsNil(currentValue)) {
                    return output;
                }

                if (typeIsFunction(value)) {
                    return (output[key] = value, output);
                }

                const interpolator = element.interpolators[key] || getInterpolator(currentValue);

                if (isElementValueKeyFrame(value)) {
                    return (output[key] = getKeyframeInterpolator(currentValue, value, interpolator), output);
                }

                return (output[key] = interpolator(currentValue, value), output);
            }, {} as Record<keyof TState, Interpolator<any>>);

            return time => objectMap(interpolators, (_, value) => value(time));
        }

        function render(ctx: CanvasRenderingContext2D, renderState?: Partial<TState>) {
            context = ctx;

            if (renderState) {
                setState(renderState);
            }

            context.save();

            try {
                const state = getState((key, value) => {
                    if (!abstract && context && key in CONTEXT_OPERATIONS) {
                        CONTEXT_OPERATIONS[key]?.(context, value);
                    }
                });

                onRender({
                    context,
                    state,
                });

                getBoundingBoxHandler.invalidate();
                intersectsWithHandler.invalidate();
            } finally {
                context.restore();
            }
        }

        return element;
    };

    return constructor;
}