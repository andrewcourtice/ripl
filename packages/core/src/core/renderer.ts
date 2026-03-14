import {
    EventBus,
    EventMap,
} from './event-bus';

import {
    factory,
} from './factory';

import {
    Group,
    isGroup,
} from './group';

import type {
    Interpolator,
} from '../interpolators';

import {
    Element,
} from './element';

import type {
    BaseElementState,
    ElementInterpolationState,
} from './element';

import {
    Scene,
} from './scene';

import {
    computeTransitionTime,
    easeLinear,
    Transition,
} from '../animation';

import type {
    Ease,
    TransitionDirection,
    TransitionLoopMode,
} from '../animation';

import {
    OneOrMore,
    typeIsFunction,
    valueOneOrMore,
} from '@ripl/utilities';

import {
    createRect,
} from '../elements/rect';

import {
    createText,
} from '../elements/text';

import type {
    Rect,
} from '../elements/rect';

import type {
    Text,
} from '../elements/text';

/** Alias for the transition playback direction within the renderer. */
export type RendererTransitionDirection = TransitionDirection;

/** Event map for the renderer, with start, stop, and per-frame tick events. */
export interface RendererEventMap extends EventMap {
    start: {
        startTime: number;
    };
    stop: {
        startTime: number;
        endTime: number;
    };
    tick: {
        time: number;
        deltaTime: number;
    };
}

/** Internal representation of an active transition managed by the renderer. */
export interface RendererTransition {
    startTime: number;
    duration: number;
    ease: Ease;
    loop: TransitionLoopMode;
    direction: RendererTransitionDirection;
    interpolator: Interpolator<void>;
    paused: boolean;
    pauseOffset: number;
    callback(): void;
}

/** Options for scheduling a transition on one or more elements via the renderer. */
export interface RendererTransitionOptions<TElement extends Element> {
    duration?: number;
    ease?: Ease;
    loop?: TransitionLoopMode;
    delay?: number;
    direction?: RendererTransitionDirection;
    state: ElementInterpolationState<TElement extends Element<infer TState> ? TState : BaseElementState>;
    onComplete?(element: Element): void;
}

/** Options for enabling debug overlays on the renderer. */
export interface RendererDebugOptions {
    fps?: boolean;
    elementCount?: boolean;
    boundingBoxes?: boolean;
}

/** Configuration for the renderer, controlling auto-start/stop behaviour and debug overlays. */
export interface RendererOptions {
    autoStart?: boolean;
    autoStop?: boolean;
    immediate?: boolean;
    debug?: boolean | RendererDebugOptions;
}

const DEBUG_DEFAULTS: Required<RendererDebugOptions> = {
    fps: false,
    elementCount: false,
    boundingBoxes: false,
};

function resolveDebugOptions(debug: boolean | RendererDebugOptions): Required<RendererDebugOptions> {
    if (debug === true) {
        return {
            fps: true,
            elementCount: true,
            boundingBoxes: true,
        };
    }

    if (debug === false) {
        return { ...DEBUG_DEFAULTS };
    }

    return {
        ...DEBUG_DEFAULTS,
        ...debug,
    };
}

/** Transition options can be a static object or a per-element factory function. */
export type RendererTransitionOptionsArg<TElement extends Element> = RendererTransitionOptions<TElement> | ((
    element: TElement extends Group ? Element : TElement,
    index: number,
    length: number
) => RendererTransitionOptions<TElement>);

/** Drives the animation loop via `requestAnimationFrame`, managing per-element transitions and rendering the scene each frame. */
export class Renderer extends EventBus<RendererEventMap> {

    private scene: Scene;
    private transitionMap = new Map<string, Map<symbol, RendererTransition>>();

    private running = false;
    private handle?: number;
    private startTime = 0;
    private currentTime = 0;
    private previousTime = 0;

    private debugOptions: Required<RendererDebugOptions>;
    private smoothedFps = 0;
    private debugBg?: Rect;
    private debugLabel?: Text;

    public autoStart = true;
    public autoStop = true;

    /** Whether there are any active transitions in progress. */
    public get isBusy() {
        return !!this.transitionMap.size;
    }

    constructor(scene: Scene, options?: RendererOptions) {
        super();

        const {
            autoStart = true,
            autoStop = true,
            debug = false,
        } = options || {};

        this.scene = scene;
        this.autoStart = autoStart;
        this.autoStop = autoStop;
        this.debugOptions = resolveDebugOptions(debug);

        if (autoStart) {
            this.start();
        }

        if (autoStop) {
            this.retain(scene.context.on('mousemove', () => this.start()));
            this.retain(scene.context.on('mouseleave', () => this.stopOnIdle()));
        }

        this.retain(scene.on('graph', () => this.start()));
        scene.once('destroyed', () => this.destroy());
    }

    private tick() {
        if (!this.running) {
            return;
        }

        const context = this.scene.context;

        let deltaTime = 0;

        context.batch(() => {
            this.currentTime = factory.now();

            deltaTime = this.currentTime - this.previousTime;

            this.emit('tick', {
                time: this.currentTime,
                deltaTime,
            });

            this.previousTime = this.currentTime;
            this.renderBuffer(deltaTime);
        });

        this.handle = factory.requestAnimationFrame(() => this.tick());
    }

    private renderBoundingBoxes(element: Element) {
        const box = element.getBoundingBox();
        const context = this.scene.context;
        const path = context.createPath();

        context.layer(() => {
            context.stroke = '#FF0000';
            context.lineWidth = 1;

            path.rect(box.left, box.top, box.width, box.height);
            context.applyStroke(path);
        });
    }

    private processTransition(entry: RendererTransition): void {
        if (entry.paused) {
            if (entry.pauseOffset > 0) {
                const time = computeTransitionTime(entry.pauseOffset, entry.duration, entry.ease, entry.direction);
                entry.interpolator(time);
            }

            return;
        }

        const elapsed = this.currentTime - entry.startTime;

        if (elapsed <= 0) {
            return;
        }

        const time = computeTransitionTime(elapsed, entry.duration, entry.ease, entry.direction);
        entry.interpolator(time);

        if (elapsed < entry.duration) {
            return;
        }

        if (!entry.loop) {
            entry.callback();
            return;
        }

        if (entry.loop === 'alternate') {
            entry.direction = entry.direction === 'forward' ? 'reverse' : 'forward';
        }

        entry.startTime = this.currentTime;
    }

    private renderBuffer(deltaTime: number) {
        const buffer = this.scene.buffer;

        buffer.forEach(element => {
            this.transitionMap.get(element.id)?.forEach(entry => {
                this.processTransition(entry);
            });

            element.render(this.scene.context);

            if (this.debugOptions.boundingBoxes) {
                this.renderBoundingBoxes(element);
            }
        });

        this.renderDebugOverlay(buffer.length, deltaTime);
    }

    private renderDebugOverlay(elementCount: number, deltaTime: number) {
        const {
            fps: showFps,
            elementCount: showElementCount,
        } = this.debugOptions;

        if (!showFps && !showElementCount) {
            return;
        }

        const instantFps = deltaTime > 0 ? 1000 / deltaTime : 0;
        this.smoothedFps += (instantFps - this.smoothedFps) * 0.1;

        const parts: string[] = [];

        if (showElementCount) {
            parts.push(`${elementCount} elements`);
        }

        if (showFps) {
            parts.push(`${Math.round(this.smoothedFps)} fps`);
        }

        const label = parts.join(' at ');
        const context = this.scene.context;
        const font = '12px monospace';
        const paddingX = 8;
        const paddingY = 4;
        const offsetX = 5;
        const offsetY = 5;

        const metrics = context.measureText(label, font);
        const textWidth = metrics.width;
        const textHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
        const boxWidth = textWidth + paddingX * 2;
        const boxHeight = textHeight + paddingY * 2;

        if (!this.debugBg) {
            this.debugBg = createRect({
                x: offsetX,
                y: offsetY,
                width: boxWidth,
                height: boxHeight,
                borderRadius: 3,
                fill: '#000000',
                opacity: 0.6,
                pointerEvents: 'none',
            });
        } else {
            this.debugBg.width = boxWidth;
            this.debugBg.height = boxHeight;
        }

        if (!this.debugLabel) {
            this.debugLabel = createText({
                x: offsetX + paddingX,
                y: offsetY + paddingY + textHeight,
                content: label,
                font,
                fill: '#FFFFFF',
                textAlign: 'left',
                textBaseline: 'alphabetic',
                pointerEvents: 'none',
            });
        } else {
            this.debugLabel.content = label;
            this.debugLabel.y = offsetY + paddingY + textHeight;
        }

        this.debugBg.render(context);
        this.debugLabel.render(context);
    }

    /** Starts the animation loop if it is not already running. */
    public start() {
        if (this.running) {
            return;
        }

        this.running = true;
        this.startTime = factory.now();
        this.previousTime = this.startTime;

        this.emit('start', {
            startTime: this.startTime,
        });

        factory.requestAnimationFrame(() => this.tick());
    }

    /** Stops the animation loop, cancels pending frames, and clears all transitions. */
    public stop() {
        if (!this.running) {
            return;
        }

        if (this.handle) {
            factory.cancelAnimationFrame(this.handle);
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

    /** Schedules an animated transition for one or more elements, returning a `Transition` that resolves when all complete. */
    public transition<TElement extends Element>(element: OneOrMore<TElement>, options?: RendererTransitionOptionsArg<TElement>) {
        this.start();

        const getOptions = typeIsFunction(options)
            ? options
            : () => options || {} as RendererTransitionOptions<TElement>;

        const scopedTransitions = new Map<symbol, { elementId: Element['id'];
            entry: RendererTransition; }>();

        const hooks = {
            onPause: () => {
                const now = factory.now();

                scopedTransitions.forEach(({ entry }) => {
                    entry.pauseOffset = now - entry.startTime;
                    entry.paused = true;
                });
            },
            onPlay: () => {
                const now = factory.now();

                scopedTransitions.forEach(({ entry }) => {
                    entry.startTime = now - entry.pauseOffset;
                    entry.paused = false;
                });

                this.start();
            },
            onSeek: (position: number) => {
                scopedTransitions.forEach(({ entry }) => {
                    entry.pauseOffset = position * entry.duration;
                    entry.paused = true;

                    const time = computeTransitionTime(entry.pauseOffset, entry.duration, entry.ease, entry.direction);
                    entry.interpolator(time);
                });

                this.start();
            },
        };

        const instance = new Transition((resolve, _reject, onAbort) => {
            const elements = valueOneOrMore(element).flatMap(element => {
                return isGroup(element) ? element.graph(false) : [element];
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
                } = getOptions(element as TElement extends Group ? Element : TElement, index, totalCount);

                const transitionId = Symbol();
                const startTime = factory.now() + delay;

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

                const entry: RendererTransition = {
                    loop,
                    ease,
                    startTime,
                    direction,
                    duration,
                    callback,
                    paused: false,
                    pauseOffset: 0,
                    interpolator: element.interpolate(state),
                };

                scopedTransitions.set(transitionId, {
                    entry,
                    elementId: element.id,
                });

                transitions.set(transitionId, entry);
                this.transitionMap.set(element.id, transitions);
            });

            onAbort(() => {
                scopedTransitions.forEach(({ elementId }, id) => {
                    const elementTransitions = this.transitionMap.get(elementId);
                    elementTransitions?.delete(id);

                    if (!elementTransitions?.size) {
                        this.transitionMap.delete(elementId);
                    }
                });

                this.stopOnIdle();
            });
        }, hooks);

        instance.inverse = () => {
            const flippedOptions = typeIsFunction(options)
                ? ((el: TElement extends Group ? Element : TElement, idx: number, len: number) => {
                    const resolved = options(el, idx, len);

                    return {
                        ...resolved,
                        direction: (resolved.direction || 'forward') === 'reverse' ? 'forward' : 'reverse',
                    } as RendererTransitionOptions<TElement>;
                }) as RendererTransitionOptionsArg<TElement>
                : {
                    ...options,
                    direction: ((options as RendererTransitionOptions<TElement>)?.direction || 'forward') === 'reverse' ? 'forward' : 'reverse',
                } as RendererTransitionOptions<TElement>;

            return this.transition(element, flippedOptions);
        };

        return instance;
    }

    /** Stops the renderer and destroys all event subscriptions. */
    public destroy(): void {
        this.stop();
        super.destroy();
    }

}

/** Factory function that creates a new `Renderer` bound to the given scene. */
export function createRenderer(...options: ConstructorParameters<typeof Renderer>) {
    return new Renderer(...options);
}
