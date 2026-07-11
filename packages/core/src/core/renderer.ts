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

import {
    isGroup,
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

    private _scene: Scene;
    private _transitionMap = new Map<string, Map<symbol, RendererTransition>>();

    private _running = false;
    private _handle?: number;
    private _startTime = 0;
    private _currentTime = 0;
    private _previousTime = 0;

    private _debugOptions: Required<RendererDebugOptions>;
    private _smoothedFps = 0;

    public autoStart = true;
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
        const box = element.getBoundingBox();
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
        const buffer = this._scene.buffer;

        buffer.forEach(element => {
            this._transitionMap.get(element.id)?.forEach(entry => {
                this._processTransition(entry);
            });

            element.render(this._scene.context);

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
