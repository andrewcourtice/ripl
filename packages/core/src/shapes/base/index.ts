import {
    CALCULATORS,
    CONTEXT_OPERATIONS,
} from './constants';

import {
    getValueFns,
} from './utilities';

import {
    isFunction,
    isString,
} from '../../utilities/type';

import {
    comparitorNumeric,
} from '../../math/comparitors';

import type {
    BaseElement,
    Element,
    ElementCalculators,
    ElementConstructor,
    ElementDefinition,
    ElementOptions,
    ElementProperties,
    ElementRenderData,
    ElementValueBounds,
    FrameCallback,
    Group,
    Scene,
    ShapeConstructor,
    ShapeDefinition,
} from './types';

import {
    min,
} from '../../math/number';
import {
    Ease, easeLinear,
} from '../../animation/ease';

export * from './constants';
export * from './types';

export function scene(target: string | HTMLCanvasElement, els?: Element<any, any>[]): Scene {
    const canvas = isString(target) ? document.querySelector(target) as HTMLCanvasElement : target;
    const context = canvas?.getContext('2d');

    if (!context) {
        throw new Error('Failed to resolve canvas element');
    }

    const dpr = window.devicePixelRatio;
    const elements = new Set(els);

    const {
        width,
        height,
    } = canvas.getBoundingClientRect();

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const {
        font,
    } = window.getComputedStyle(document.body);

    context.font = font;

    const render = (time: number = 0) => {
        for (const element of elements) {
            element.render(context, time);
        }
    };

    const add = (element: Element<any, any> | Element<any, any>[]) => {
        ([] as Element<any, any>[]).concat(element).forEach(el => elements.add(el));
    };

    return {
        context,
        canvas,
        render,
        add,
        get elements() {
            return Array.from(elements);
        },
    };
}

export function element<TElement extends BaseElement, TData extends ElementRenderData = ElementRenderData>(definition: ElementDefinition<TElement, TData>): ElementConstructor<TElement, TData> {
    return (properties, calculators): Element<TElement, TData> => {
        const id = Symbol();

        const {
            name,
            validate,
            onRender,
            calculators: rootCalculators,
        } = definition;

        if (validate && !validate(properties)) {
            throw new Error('invalid shape options provided');
        }

        const mergedCalculators = {
            ...CALCULATORS,
            ...rootCalculators,
            ...calculators,
        } as ElementCalculators<TElement>;

        let valueFns = getValueFns(properties, mergedCalculators);
        let state: TElement;

        const clone = () => element(definition)(properties, calculators);
        const update = (properties: Partial<ElementProperties<TElement>>) => {
            valueFns = {
                ...valueFns,
                ...getValueFns(properties, mergedCalculators),
            };
        };

        const frame = (time: number, callback?: FrameCallback<TElement>) => {
            const state = {} as TElement;

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
            state = state || frame(0);

            const properties = {} as ElementProperties<TElement>;

            for (const key in state) {
                const startValue = state[key];
                const endValue = newState[key] || startValue;

                properties[key] = [startValue, endValue] as ElementValueBounds<typeof state[typeof key]>;
            }

            update(properties);
        };

        const render = (context: CanvasRenderingContext2D, time: number = 0, data: TData = {}) => {
            const {
                base,
            } = data;

            const contextOperations = [] as (() => void)[];

            state = frame(time, (key, value) => {
                const contextOperation = CONTEXT_OPERATIONS[key as keyof BaseElement];
                const isContextOp = !!contextOperation && base?.[key] !== value;

                if (isContextOp) {
                    contextOperations.push(() => contextOperation(context, value));
                }
            });

            if (contextOperations.length) {
                context.save();
            }

            try {
                for (const operation of contextOperations) {
                    operation();
                }

                onRender(context, {
                    state,
                    time,
                    data,
                });
            } finally {
                if (contextOperations.length) {
                    context.restore();
                }
            }
        };

        const blend = (refElement: Element<TElement, TData>, srcFrames: number[] = [0], destFrames: number[] = [1]) => {
            const keyframes = [
                ...srcFrames.sort(comparitorNumeric).map(offset => frame(offset)),
                ...destFrames.sort(comparitorNumeric).map(offset => refElement.frame(offset)),
            ];

            const properties = {} as ElementProperties<TElement>;

            for (const prop in keyframes[0]) {
                properties[prop] = keyframes.map(frame => ({ value: frame[prop] }));
            }

            return element(definition)(properties, calculators);
        };

        return {
            id,
            name,
            clone,
            update,
            frame,
            to,
            render,
        };
    };
}

export function shape<TElement extends BaseElement, TData extends ElementRenderData = ElementRenderData>(definition: ShapeDefinition<TElement, TData>): ShapeConstructor<TElement, TData> {
    const {
        autoFill = true,
        autoStroke = true,
        onRender,
        ...elementDefinition
    } = definition;

    const elConstructor = element<TElement, TData>({
        ...elementDefinition,
        onRender(context, frame) {
            const {
                state,
                data,
            } = frame;

            const path = new Path2D();

            onRender(context, path, frame);

            if (autoStroke && state.strokeStyle || data?.base?.strokeStyle) {
                context.stroke(path);
            }

            if (autoFill && state.fillStyle || data?.base?.fillStyle) {
                context.fill(path);
            }

            return path;
        },
    });

    return (properties, options) => {
        const el = elConstructor(properties, options);

        const clone = () => shape(definition)(properties, options);

        return {
            ...el,
            clone,
        };
    };
}

export function group(
    elements: Element<any, any>[],
    properties: ElementProperties<BaseElement>,
    options?: ElementOptions<BaseElement>
): Group {
    const children = new Set(elements);

    const el = element({
        name: 'group',
        onRender(context, { time, state }) {
            for (const child of children) {
                child.render(context, time, {
                    base: state,
                });
            }
        },
    })(properties, options);

    return {
        ...el,
        add: (element: Element<any, any>) => children.add(element),
        delete: (element: Element<any, any>) => children.delete(element),
    };
}

interface RendererTransition {
    startTime: number;
    duration: number;
    ease: Ease;
    callback: Function;
}

interface RendererTransitionOptions {
    duration: number;
    ease: Ease;
    delay: number | ((index: number) => number);
    callback: (element: Element<any, any>) => void;
}

interface RendererOptions {
    autoStart?: boolean;
}

interface Renderer {
    start: () => void;
    stop: () => void;
    transition: (element: Element<any, any> | Element<any, any>[], options?: Partial<RendererTransitionOptions>) => Promise<unknown[]>;
    running: boolean;
    get busy(): boolean;
}

export function renderer(
    scene: Scene,
    options?: RendererOptions
): Renderer {
    const {
        autoStart,
    } = {
        autoStart: true,
        ...options,
    };

    const {
        canvas,
        context,
    } = scene;

    if (!context) {
        throw new Error('Failed to get context');
    }

    let running = false;
    let startTime = performance.now();
    let handle: number | undefined;

    const transitionMap = new Map<symbol, RendererTransition>();

    const tick = () => {
        if (!running) {
            return;
        }

        context.clearRect(0, 0, canvas.width, canvas.height);

        const currentTime = performance.now();
        const elapsedTime = currentTime - startTime;

        for (const element of scene.elements) {
            let time = 0;

            if (transitionMap.has(element.id)) {
                const {
                    startTime,
                    duration,
                    ease,
                    callback,
                } = {
                    startTime: currentTime,
                    duration: 0,
                    ease: easeLinear,
                    callback: () => {},
                    ...transitionMap.get(element.id),
                };

                const elapsed = currentTime - startTime;

                if (elapsed > 0) {
                    time = ease(min(elapsed / duration, 1));

                    if (elapsed >= duration) {
                        callback();
                        transitionMap.delete(element.id);
                    }
                }
            }

            element.render(context, time);
        }

        handle = requestAnimationFrame(tick);
    };

    const start = () => {
        if (!running) {
            running = true;
            startTime = performance.now();
            transitionMap.clear();
            requestAnimationFrame(tick);
        }
    };

    const stop = () => {
        if (running) {
            if (handle) {
                cancelAnimationFrame(handle);
            }

            running = false;
            transitionMap.clear();
        }
    };

    const transition = (element: Element<any, any> | Element<any, any>[], options?: Partial<RendererTransitionOptions>) => {
        const promises = ([] as Element<any, any>[])
            .concat(element)
            .map((element, index) => new Promise<void>(resolve => {
                const {
                    duration,
                    ease,
                    delay,
                    callback,
                } = {
                    duration: 0,
                    delay: 0,
                    ease: easeLinear,
                    callback: () => {},
                    ...options,
                };

                const startTime = performance.now() + (isFunction(delay) ? delay(index) : delay);

                transitionMap.set(element.id, {
                    duration,
                    ease,
                    startTime,
                    callback: () => {
                        callback(element);
                        resolve();
                    },
                });
            }));

        return Promise.all(promises);
    };

    if (autoStart) {
        start();
    }

    return {
        start,
        stop,
        transition,
        running,
        get busy() {
            return !!transitionMap.size;
        },
    };
}

type InteractionEventName = 'mouseenter'
| 'mouseleave';

interface InteractionEvent {
    element: Element<any, any>;
}

export function interaction(scene: Scene, renderer?: Renderer) {
    const {
        canvas,
    } = scene;

    const eventMap = {
        mouseenter: [],
        mouseleave: [],
    } as Record<InteractionEventName, Function[]>;

    let left = 0;
    let top = 0;

    const onMouseenter = (event: MouseEvent) => {
        ({
            left,
            top,
        } = canvas.getBoundingClientRect());
    };

    const onMouseleave = (event: MouseEvent) => {
        const x = event.clientX - left;
        const y = event.clientY - top;

        console.log(x, y);

        // for (const element of scene.elements) {
        //     element.
        // }
    };

    const destroy = () => {
        canvas.removeEventListener('mouseenter', onMouseenter);
        canvas.removeEventListener('mousemove', onMouseleave);
    };

    canvas.addEventListener('mouseenter', onMouseenter);
    canvas.addEventListener('mousemove', onMouseleave);

    return {
        //on,
        destroy,
    };
}