import type {
    EventMap,
} from './event-bus';

import {
    EventBus,
} from './event-bus';

import {
    factory,
} from './factory';

import type {
    Group,
} from './group';

import type {
    Interpolator,
} from '../interpolators';

import type {
    Element,
} from './element';

import type {
    BaseElementState,
    ElementInterpolationState,
} from './element';

import type {
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

import type {
    OneOrMore,
} from '@ripl/utilities';

import {
    noop,
    typeIsFunction,
    valueOneOrMore,
} from '@ripl/utilities';

/** Alias for the transition playback direction within the renderer. */
export type RendererTransitionDirection = TransitionDirection;

/** Event map for the renderer, with start, stop, and per-frame tick events. */
export interface RendererEventMap extends EventMap {
    /** Emitted when the animation loop starts. */
    start: {
        /** Timestamp at which the loop started, in milliseconds. */
        startTime: number;
    };
    /** Emitted when the animation loop stops. */
    stop: {
        /** Timestamp at which the loop originally started, in milliseconds. */
        startTime: number;
        /** Timestamp at which the loop stopped, in milliseconds. */
        endTime: number;
    };
    /** Emitted once per animation frame. */
    tick: {
        /** Timestamp of the current frame, in milliseconds. */
        time: number;
        /** Elapsed time since the previous frame, in milliseconds. */
        deltaTime: number;
    };
}

/** Internal representation of an active transition managed by the renderer. */
export interface RendererTransition {
    /** Timestamp at which the transition began, in milliseconds. */
    startTime: number;
    /** Total duration of the transition, in milliseconds. */
    duration: number;
    /** Easing function applied to the transition's progress. */
    ease: Ease;
    /** Loop behaviour once the transition completes. */
    loop: TransitionLoopMode;
    /** Playback direction of the transition. */
    direction: RendererTransitionDirection;
    /** Interpolator advanced each frame to apply the transition to the element. */
    interpolator: Interpolator<void>;
    /** Whether the transition is currently paused. */
    paused: boolean;
    /** Elapsed offset, in milliseconds, captured when the transition was paused or seeked. */
    pauseOffset: number;
    /** Invoked when the transition completes (a non-looping transition finishing). */
    callback(): void;
}

/** Options for scheduling a transition on one or more elements via the renderer. */
export interface RendererTransitionOptions<TElement extends Element> {
    /** Duration of the transition, in milliseconds. Defaults to `0`. */
    duration?: number;
    /** Easing function applied to the transition's progress. Defaults to linear. */
    ease?: Ease;
    /** Loop behaviour once the transition completes. Defaults to no looping. */
    loop?: TransitionLoopMode;
    /** Delay, in milliseconds, before the transition begins. Defaults to `0`. */
    delay?: number;
    /** Playback direction of the transition. Defaults to `forward`. */
    direction?: RendererTransitionDirection;
    /** Target state (values, keyframes, or interpolators) the element transitions towards. */
    state: ElementInterpolationState<TElement extends Element<infer TState> ? TState : BaseElementState>;
    /** Invoked with the element once its transition completes. */
    onComplete?(element: Element): void;
}

/** Options for enabling debug overlays on the renderer. */
export interface RendererDebugOptions {
    /** Whether to overlay the current frames-per-second reading. */
    fps?: boolean;
    /** Whether to overlay the number of elements in the scene buffer. */
    elementCount?: boolean;
    /** Whether to draw each element's bounding box. */
    boundingBoxes?: boolean;
}

/** Configuration for the renderer, controlling auto-start/stop behaviour and debug overlays. */
export interface RendererOptions {
    /** Whether the renderer starts its animation loop automatically on construction. Defaults to `true`. */
    autoStart?: boolean;
    /** Whether the renderer stops the loop when idle — no active transitions and the pointer has left. Defaults to `true`. */
    autoStop?: boolean;
    /** Whether transitions apply their final state immediately rather than animating. */
    immediate?: boolean;
    /** Enables debug overlays — `true` for all, or a {@link RendererDebugOptions} object to toggle individual overlays. */
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

    private _scene: Scene;
    private _transitionMap = new Map<string, Map<symbol, RendererTransition>>();

    private _running = false;
    private _handle?: number;
    private _startTime = 0;
    private _currentTime = 0;
    private _previousTime = 0;

    private _debugOptions: Required<RendererDebugOptions>;
    private _smoothedFps = 0;

    /** Whether the renderer starts its animation loop automatically on construction. */
    public autoStart = true;
    /** Whether the renderer stops the loop when idle — no active transitions and the pointer has left. */
    public autoStop = true;

    /** Whether there are any active transitions in progress. */
    public get isBusy() {
        return !!this._transitionMap.size;
    }

    constructor(scene: Scene, options?: RendererOptions) {
        super();

        const {
            autoStart = true,
            autoStop = true,
            debug = false,
        } = options || {};

        this._scene = scene;
        this.autoStart = autoStart;
        this.autoStop = autoStop;
        this._debugOptions = resolveDebugOptions(debug);

        if (autoStart) {
            this.start();
        }

        if (autoStop) {
            this.retain(scene.context.on('mousemove', () => this.start()));
            this.retain(scene.context.on('mouseleave', () => this._stopOnIdle()));
        }

        this.retain(scene.on('graph', () => this.start()));
        scene.once('destroyed', () => this.destroy());
    }

    private _tick() {
        if (!this._running) {
            return;
        }

        const context = this._scene.context;

        let deltaTime = 0;

        context.batch(() => {
            this._currentTime = factory.now();

            deltaTime = this._currentTime - this._previousTime;

            this.emit('tick', {
                time: this._currentTime,
                deltaTime,
            });

            this._previousTime = this._currentTime;

            this._renderBuffer();
            this._renderDebugOverlay(deltaTime);
        });

        this._handle = factory.requestAnimationFrame(() => this._tick());
    }

    private _renderBoundingBoxes(element: Element) {
        // Drawn within the element's current transform context, so use the local (untransformed) box.
        const box = element.getLocalBoundingBox();
        const context = this._scene.context;
        const path = context.createPath();

        context.layer(() => {
            context.stroke = '#FF0000';
            context.lineWidth = 1;

            path.rect(box.left, box.top, box.width, box.height);
            context.applyStroke(path);
        });
    }

    private _processTransition(entry: RendererTransition): void {
        if (entry.paused) {
            if (entry.pauseOffset > 0) {
                const time = computeTransitionTime(entry.pauseOffset, entry.duration, entry.ease, entry.direction);
                entry.interpolator(time);
            }

            return;
        }

        const elapsed = this._currentTime - entry.startTime;

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

        entry.startTime = this._currentTime;
    }

    private _renderBuffer() {
        const context = this._scene.context;

        this._scene.instructions.forEach(({ type, element }) => {
            // A group boundary closes here — its transitions were already advanced at the
            // matching `push`, so restore and move on without re-processing them.
            if (type === 'pop') {
                context.popGroup();
                return;
            }

            this._transitionMap.get(element.id)?.forEach(entry => {
                this._processTransition(entry);
            });

            if (type === 'push') {
                context.pushGroup(element);
                return;
            }

            element.render(context);

            if (this._debugOptions.boundingBoxes) {
                this._renderBoundingBoxes(element);
            }
        });
    }

    private _renderDebugOverlay(deltaTime: number) {
        const {
            fps: showFps,
            elementCount: showElementCount,
        } = this._debugOptions;

        if (!showFps && !showElementCount) {
            return;
        }

        const elementCount = this._scene.buffer.length;
        const instantFps = deltaTime > 0 ? 1000 / deltaTime : 0;
        this._smoothedFps += (instantFps - this._smoothedFps) * 0.1;

        const parts: string[] = [];

        if (showElementCount) {
            parts.push(`${elementCount} elements`);
        }

        if (showFps) {
            parts.push(`${Math.round(this._smoothedFps)} fps`);
        }

        const label = parts.join(' at ');
        const context = this._scene.context;
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

        context.layer(() => {
            context.opacity = 0.6;
            context.fill = '#000000';

            const bgPath = context.createPath();
            bgPath.roundRect(offsetX, offsetY, boxWidth, boxHeight, [3, 3, 3, 3]);
            context.applyFill(bgPath);
        });

        context.layer(() => {
            context.font = font;
            context.textAlign = 'left';
            context.textBaseline = 'top';
            context.fill = '#FFFFFF';

            const text = context.createText({
                x: offsetX + paddingX,
                y: offsetY + paddingY,
                content: label,
            });

            context.applyFill(text);
        });
    }

    /** Starts the animation loop if it is not already running. */
    public start() {
        if (this._running) {
            return;
        }

        this._running = true;
        this._startTime = factory.now();
        this._previousTime = this._startTime;

        this.emit('start', {
            startTime: this._startTime,
        });

        factory.requestAnimationFrame(() => this._tick());
    }

    /** Stops the animation loop, cancels pending frames, and clears all transitions. */
    public stop() {
        if (!this._running) {
            return;
        }

        if (this._handle) {
            factory.cancelAnimationFrame(this._handle);
        }

        this._running = false;
        this._transitionMap.clear();

        this.emit('stop', {
            startTime: this._startTime,
            endTime: this._currentTime,
        });
    }

    private _stopOnIdle() {
        if (this.autoStop && this._transitionMap.size === 0) {
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
            // Targets animate their own state — including groups, which the render loop advances at
            // their `push` op so a group transitions as a unit (transform about its origin, opacity
            // composited at the boundary) rather than fanning out to per-leaf animations.
            const elements = valueOneOrMore(element);

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
                    onComplete = noop,
                    direction = 'forward',
                    state,
                } = getOptions(element as TElement extends Group ? Element : TElement, index, totalCount);

                const transitionId = Symbol();
                const startTime = factory.now() + delay;

                const callback = () => {
                    const elementTransitions = this._transitionMap.get(element.id);

                    completeCount += 1;
                    elementTransitions?.delete(transitionId);

                    if (!elementTransitions?.size) {
                        this._transitionMap.delete(element.id);
                    }

                    try {
                        onComplete(element);
                    } finally {
                        this._stopOnIdle();

                        if (completeCount >= totalCount) {
                            resolve();
                        }
                    }
                };

                const transitions = this._transitionMap.get(element.id) || new Map<symbol, RendererTransition>();

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
                this._transitionMap.set(element.id, transitions);
            });

            onAbort(() => {
                scopedTransitions.forEach(({ elementId }, id) => {
                    const elementTransitions = this._transitionMap.get(elementId);
                    elementTransitions?.delete(id);

                    if (!elementTransitions?.size) {
                        this._transitionMap.delete(elementId);
                    }
                });

                this._stopOnIdle();
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
