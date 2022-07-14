import {
    Element,
} from './element';

import {
    Scene,
} from './scene';

import {
    Ease,
    easeLinear,
} from '../animation';

import {
    min,
} from '../math';

import {
    isFunction,
} from '../utilities';

import type {
    OneOrMore,
} from '../global';

export type RendererFillMode = 'none' | 'forwards';

export interface RendererEventMap {
    start(startTime: number): void;
    stop(startTime: number, endTime: number): void;
    tick(currentTime: number, startTime: number): void;
}

export interface RendererTransition {
    startTime: number;
    duration: number;
    ease: Ease;
    callback(): void;
}

export interface RendererTransitionOptions {
    duration: number;
    ease: Ease;
    delay: number | ((index: number) => number);
    fillMode: RendererFillMode;
    callback(element: Element): void;
}

export interface RendererOptions {
    autoStart?: boolean;
}

export interface Renderer {
    start(): void;
    stop(): void;
    transition(element: OneOrMore<Element<any>>, options?: Partial<RendererTransitionOptions>): Promise<void>;
    on<TEvent extends keyof RendererEventMap>(event: TEvent, handler: RendererEventMap[TEvent]): void;
    off<TEvent extends keyof RendererEventMap>(event: TEvent, handler: RendererEventMap[TEvent]): void;
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

    const transitionMap = new Map<symbol, RendererTransition>();
    const eventMap = {
        start: new Set(),
        stop: new Set(),
        tick: new Set(),
    } as {
        [P in keyof RendererEventMap]: Set<RendererEventMap[P]>;
    };

    let running = false;
    let handle: number | undefined;
    let startTime = performance.now();
    let currentTime = performance.now();

    const tick = () => {
        if (!running) {
            return;
        }

        context.clearRect(0, 0, canvas.width, canvas.height);

        currentTime = performance.now();

        for (const handler of eventMap.tick) {
            handler(currentTime, startTime);
        }

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
                        transitionMap.delete(element.id);
                        callback();
                    }
                }
            }

            element.render(context, time);
        }

        handle = requestAnimationFrame(tick);
    };

    const start = () => {
        if (running) {
            return;
        }

        running = true;
        startTime = performance.now();
        transitionMap.clear();

        for (const handler of eventMap.start) {
            handler(startTime);
        }

        requestAnimationFrame(tick);
    };

    const stop = () => {
        if (!running) {
            return;
        }

        if (handle) {
            cancelAnimationFrame(handle);
        }

        running = false;
        transitionMap.clear();

        for (const handler of eventMap.stop) {
            handler(startTime, currentTime);
        }
    };

    const transition = (element: OneOrMore<Element<any>>, options?: Partial<RendererTransitionOptions>) => {
        return new Promise<void>(resolve => {
            const elements = ([] as Element[]).concat(element);
            const totalCount = elements.length;

            let completeCount = 0;

            elements.forEach((element, index) => {
                const {
                    duration,
                    ease,
                    delay,
                    callback,
                    fillMode,
                } = {
                    duration: 0,
                    delay: 0,
                    ease: easeLinear,
                    fillMode: 'forwards',
                    callback: () => {},
                    ...options,
                } as RendererTransitionOptions;

                const startTime = performance.now() + (isFunction(delay) ? delay(index) : delay);

                const onComplete = () => {
                    completeCount += 1;

                    if (fillMode === 'forwards') {
                        element.update(element.state());
                    }

                    callback(element);

                    if (completeCount >= totalCount) {
                        resolve();
                    }
                };

                transitionMap.set(element.id, {
                    duration,
                    ease,
                    startTime,
                    callback: onComplete,
                });
            });
        });
    };

    const on = <TEvent extends keyof RendererEventMap>(event: TEvent, handler: RendererEventMap[TEvent]) => {
        eventMap[event]?.add(handler);
    };

    const off = <TEvent extends keyof RendererEventMap>(event: TEvent, handler: RendererEventMap[TEvent]) => {
        eventMap[event]?.delete(handler);
    };

    if (autoStart) {
        start();
    }

    return {
        start,
        stop,
        transition,
        on,
        off,
        running,
        get busy() {
            return transitionMap.size > 0;
        },
    };
}