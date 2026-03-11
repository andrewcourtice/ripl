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
    computeTransitionTime,
    Ease,
    easeLinear,
    Transition,
    TransitionDirection,
} from '../animation';

import {
    OneOrMore,
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
    loop: boolean;
    direction: RendererTransitionDirection;
    interpolator: Interpolator<void>;
    callback(): void;
}

/** Options for scheduling a transition on one or more elements via the renderer. */
export interface RendererTransitionOptions<TElement extends Element> {
    duration?: number;
    ease?: Ease;
    loop?: boolean;
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
    sortBuffer?: (buffer: Element[]) => Element[];
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
    private startTime = performance.now();
    private currentTime = performance.now();
    private previousTime = performance.now();

    private debugOptions: Required<RendererDebugOptions>;
    private debugOverlay?: HTMLDivElement;
    private smoothedFps = 0;

    public autoStart = true;
    public autoStop = true;
    public sortBuffer?: (buffer: Element[]) => Element[];

    /** Whether there are any active transitions in progress. */
    public get isBusy() {
        return !!this.transitionMap.size;
    }

    constructor(scene: Scene, options?: RendererOptions) {
        super();

        const {
            autoStart = true,
            autoStop = true,
            sortBuffer,
            debug = false,
        } = options || {};

        this.scene = scene;
        this.autoStart = autoStart;
        this.autoStop = autoStop;
        this.sortBuffer = sortBuffer;
        this.debugOptions = resolveDebugOptions(debug);

        if (this.debugOptions.fps || this.debugOptions.elementCount) {
            this.debugOverlay = this.createDebugOverlay();
        }

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

        this.scene.context.clear();
        this.scene.context.markRenderStart();

        this.currentTime = performance.now();

        const buffer = this.sortBuffer
            ? this.sortBuffer(this.scene.buffer)
            : this.scene.buffer;

        const deltaTime = this.currentTime - this.previousTime;

        this.emit('tick', {
            time: this.currentTime,
            deltaTime,
        });

        this.previousTime = this.currentTime;

        buffer.forEach(element => {
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
                        time = computeTransitionTime(elapsed, duration, ease, direction);

                        interpolator(time);

                        if (elapsed >= duration) {
                            callback();
                        }
                    }
                });
            }

            element.render(this.scene.context);

            if (this.debugOptions.boundingBoxes) {
                const box = element.getBoundingBox();
                const context = this.scene.context;
                const path = context.createPath();

                context.batch(() => {
                    context.stroke = '#FF0000';
                    context.lineWidth = 1;

                    path.rect(box.left, box.top, box.width, box.height);
                    context.applyStroke(path);
                });
            }
        });

        this.scene.context.markRenderEnd();
        this.updateDebugOverlay(buffer.length, deltaTime);
        this.handle = requestAnimationFrame(() => this.tick());
    }

    /** Starts the animation loop if it is not already running. */
    public start() {
        if (this.running) {
            return;
        }

        this.running = true;
        this.startTime = performance.now();
        this.previousTime = this.startTime;

        this.emit('start', {
            startTime: this.startTime,
        });

        requestAnimationFrame(() => this.tick());
    }

    /** Stops the animation loop, cancels pending frames, and clears all transitions. */
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

    /** Schedules an animated transition for one or more elements, returning a `Transition` that resolves when all complete. */
    public transition<TElement extends Element>(element: OneOrMore<TElement>, options?: RendererTransitionOptionsArg<TElement>) {
        this.start();

        const getOptions = typeIsFunction(options)
            ? options
            : () => options || {} as RendererTransitionOptions<TElement>;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        return new Transition((resolve, _reject, _onAbort) => {
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

    private createDebugOverlay(): HTMLDivElement {
        const overlay = document.createElement('div');

        overlay.style.position = 'absolute';
        overlay.style.top = '5px';
        overlay.style.left = '5px';
        overlay.style.padding = '4px 8px';
        overlay.style.fontFamily = 'monospace';
        overlay.style.fontSize = '12px';
        overlay.style.lineHeight = '1.4';
        overlay.style.color = '#FFFFFF';
        overlay.style.background = 'rgba(0, 0, 0, 0.6)';
        overlay.style.borderRadius = '3px';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex = '9999';

        const root = this.scene.context.root;
        const position = getComputedStyle(root).position;

        if (position === 'static' || !position) {
            root.style.position = 'relative';
        }

        root.appendChild(overlay);

        return overlay;
    }

    private updateDebugOverlay(elementCount: number, deltaTime: number): void {
        if (!this.debugOverlay) {
            return;
        }

        const instantFps = deltaTime > 0 ? 1000 / deltaTime : 0;

        this.smoothedFps += (instantFps - this.smoothedFps) * 0.1;

        const fps = Math.round(this.smoothedFps);
        const parts: string[] = [];

        if (this.debugOptions.elementCount) {
            parts.push(`${elementCount} elements`);
        }

        if (this.debugOptions.fps) {
            parts.push(`${fps} fps`);
        }

        this.debugOverlay.textContent = parts.join(' at ');
    }

    /** Stops the renderer and destroys all event subscriptions. */
    public destroy(): void {
        this.stop();
        this.debugOverlay?.remove();

        super.destroy();
    }

}

/** Factory function that creates a new `Renderer` bound to the given scene. */
export function createRenderer(...options: ConstructorParameters<typeof Renderer>) {
    return new Renderer(...options);
}
