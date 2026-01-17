import {
    EventBus,
    EventMap,
} from './event-bus';

import {
    Group,
    isGroup,
} from './group';

import {
    Interpolator,
} from '../interpolators';

import {
    BaseElementState,
    Element,
    ElementInterpolationState,
} from './element';

import {
    Scene,
} from './scene';

import {
    Ease,
    easeLinear,
    Transition,
} from '../animation';

import {
    clamp,
} from '../math';

import {
    arrayForEach,
    OneOrMore,
    typeIsFunction,
    valueOneOrMore,
} from '@ripl/utilities';

export type RendererTransitionDirection = 'forward' | 'reverse';

export interface RendererEventMap extends EventMap {
    start: {
        startTime: number;
    };
    stop: {
        startTime: number;
        endTime: number;
    };
}

export interface RendererTransition {
    startTime: number;
    duration: number;
    ease: Ease;
    loop: boolean;
    direction: RendererTransitionDirection;
    interpolator: Interpolator<void>;
    callback(): void;
}

export interface RendererTransitionOptions<TElement extends Element> {
    duration?: number;
    ease?: Ease;
    loop?: boolean;
    delay?: number;
    direction?: RendererTransitionDirection;
    state: ElementInterpolationState<TElement extends Element<infer TState> ? TState : BaseElementState>;
    onComplete?(element: Element): void;
}

export interface RendererOptions {
    autoStart?: boolean;
    autoStop?: boolean;
    immediate?: boolean;
    debug?: {
        boundingBoxes: boolean;
    };
}

export type RendererTransitionOptionsArg<TElement extends Element> = RendererTransitionOptions<TElement> | ((
    element: TElement extends Group ? Element : TElement,
    index: number,
    length: number
) => RendererTransitionOptions<TElement>);

export class Renderer extends EventBus<RendererEventMap> {

    private scene: Scene;
    private transitionMap = new Map<string, Map<symbol, RendererTransition>>();

    private running = false;
    private handle?: number;
    private startTime = performance.now();
    private currentTime = performance.now();

    public autoStart = true;
    public autoStop = true;

    public get isBusy() {
        return !!this.transitionMap.size;
    }

    constructor(scene: Scene, options?: RendererOptions) {
        super();

        const {
            autoStart = true,
            autoStop = true,
        } = options || {};

        this.scene = scene;
        this.autoStart = autoStart;
        this.autoStop = autoStop;

        if (autoStart) {
            this.start();
        }

        if (autoStop) {
            scene.on('mousemove', () => this.start(), { self: true });
            scene.on('mouseleave', () => this.stopOnIdle(), { self: true });
        }

        scene.once('destroyed', () => this.destroy());
    }

    private tick() {
        if (!this.running) {
            return;
        }

        this.scene.context.clear();
        this.scene.context.markRenderStart();

        this.currentTime = performance.now();

        arrayForEach(this.scene.buffer, element => {
            if (this.transitionMap.has(element.id)) {
                let time = 0;

                this.transitionMap.get(element.id)?.forEach(({
                    startTime,
                    duration,
                    ease,
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    loop: _loop,
                    direction,
                    interpolator,
                    callback,
                }) => {
                    const elapsed = this.currentTime - startTime;

                    if (elapsed > 0) {
                        time = clamp(elapsed / duration, 0, 1);
                        time = ease(direction === 'reverse' ? 1 - time : time);

                        interpolator(time);

                        if (elapsed >= duration) {
                            callback();
                        }
                    }
                });
            }

            element.render(this.scene.context);

            // if (rendererOptions.debug?.boundingBoxes) {
            //     const {
            //         left,
            //         top,
            //         width,
            //         height,
            //     } = element.getBoundingBox();

            //     context.save();
            //     context.strokeStyle = '#FF0000';
            //     context.strokeRect(left, top, width, height);
            //     context.restore();
            // }
        });

        this.scene.context.markRenderEnd();
        this.handle = requestAnimationFrame(() => this.tick());
    }

    public start() {
        if (this.running) {
            return;
        }

        this.running = true;
        this.startTime = performance.now();
        this.transitionMap.clear();

        this.emit('start', {
            startTime: this.startTime,
        });

        requestAnimationFrame(() => this.tick());
    }

    public stop() {
        if (!this.running) {
            return;
        }

        if (this.handle) {
            cancelAnimationFrame(this.handle);
        }

        this.running = false;
        this.transitionMap.clear();

        this.emit('stop', {
            startTime: this.startTime,
            endTime: this.currentTime,
        });
    }

    private stopOnIdle() {
        if (this.autoStop && this.transitionMap.size === 0) {
            this.stop();
        }
    }

    public transition<TElement extends Element>(element: OneOrMore<TElement>, options?: RendererTransitionOptionsArg<TElement>) {
        this.start();

        const getOptions = typeIsFunction(options)
            ? options
            : () => options || {} as RendererTransitionOptions<TElement>;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        return new Transition((resolve, _reject, _onAbort) => {
            const elements = valueOneOrMore(element).flatMap(element => {
                return isGroup(element) ? element.graph(false) : element;
            });

            if (!elements.length) {
                resolve();
            }

            const totalCount = elements.length;
            let completeCount = 0;

            elements.forEach((element, index) => {
                const {
                    duration = 0,
                    delay = 0,
                    loop = false,
                    ease = easeLinear,
                    onComplete = () => {},
                    direction = 'forward',
                    state,
                } = getOptions(element, index, totalCount);

                const transitionId = Symbol();
                const startTime = performance.now() + delay;

                const callback = () => {
                    const elementTransitions = this.transitionMap.get(element.id);

                    completeCount += 1;
                    elementTransitions?.delete(transitionId);

                    if (!elementTransitions?.size) {
                        this.transitionMap.delete(element.id);
                    }

                    try {
                        onComplete(element);
                    } finally {
                        this.stopOnIdle();

                        if (completeCount >= totalCount) {
                            resolve();
                        }
                    }
                };

                const transitions = this.transitionMap.get(element.id) || new Map<symbol, RendererTransition>();

                transitions.set(transitionId, {
                    loop,
                    ease,
                    startTime,
                    direction,
                    duration,
                    callback,
                    interpolator: element.interpolate(state),
                });

                this.transitionMap.set(element.id, transitions);
            });
        });
    }

    public destroy(): void {
        this.stop();
        super.destroy();
    }

}

export function createRenderer(...options: ConstructorParameters<typeof Renderer>) {
    return new Renderer(...options);
}
