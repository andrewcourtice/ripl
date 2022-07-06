import {
    Element,
} from './element';

import {
    Scene,
} from './scene';

import {
    Ease,
    easeLinear,
} from '../animation/ease';

import {
    min,
} from '../math/number';

import {
    isFunction,
} from '../utilities/type';

export interface RendererTransition {
    startTime: number;
    duration: number;
    ease: Ease;
    callback: Function;
}

export interface RendererTransitionOptions {
    duration: number;
    ease: Ease;
    delay: number | ((index: number) => number);
    callback: (element: Element<any>) => void;
}

export interface RendererOptions {
    autoStart?: boolean;
}

export interface Renderer {
    start: () => void;
    stop: () => void;
    transition: (element: Element<any> | Element<any>[], options?: Partial<RendererTransitionOptions>) => Promise<void>;
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
    let handle: number | undefined;

    const transitionMap = new Map<symbol, RendererTransition>();

    const tick = () => {
        if (!running) {
            return;
        }

        context.clearRect(0, 0, canvas.width, canvas.height);

        const currentTime = performance.now();

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
        if (!running) {
            running = true;
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

    const transition = (element: Element<any> | Element<any>[], options?: Partial<RendererTransitionOptions>) => {
        return new Promise<void>(resolve => {
            const elements = ([] as Element<any>[]).concat(element);
            const totalCount = elements.length;

            let completeCount = 0;

            elements.forEach((element, index) => {
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
                        completeCount += 1;
                        callback(element);

                        if (completeCount >= totalCount) {
                            resolve();
                        }
                    },
                });
            });
        });
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