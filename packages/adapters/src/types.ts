import type {
    RiplTransitionPhase,
} from './core/transition';

import type {
    BaseElementState,
    Context,
    ElementInterpolators,
    ElementPointerEvents,
    Event,
    Group,
    RendererDebugOptions,
} from '@ripl/web';

/** The payload carried by a pointer event: the pointer position in logical (CSS) pixels. */
export interface RiplPointerPayload {
    /** X coordinate of the pointer, relative to the context element's top-left. */
    x: number;
    /** Y coordinate of the pointer, relative to the context element's top-left. */
    y: number;
}

/** The payload carried by a drag event: the current position plus the gesture's origin and delta. */
export interface RiplDragPayload extends RiplPointerPayload {
    /** X coordinate at which the drag started, in logical pixels. */
    startX: number;
    /** Y coordinate at which the drag started, in logical pixels. */
    startY: number;
    /** Total horizontal distance moved since the drag started, in logical pixels. */
    deltaX: number;
    /** Total vertical distance moved since the drag started, in logical pixels. */
    deltaY: number;
}

/** The payload carried by an `updated` event: the state property that changed and its new value. */
export interface RiplUpdatedPayload {
    /** The state property that changed. */
    key: PropertyKey;
    /** The value the property changed to. */
    value: unknown;
}

/** The payload carried by the renderer's `tick` event. */
export interface RiplTickPayload {
    /** Timestamp of the current frame, in milliseconds. */
    time: number;
    /** Elapsed time since the previous frame, in milliseconds. */
    deltaTime: number;
}

/** The payload carried by the renderer's `start` event. */
export interface RiplStartPayload {
    /** Timestamp at which the loop started, in milliseconds. */
    startTime: number;
}

/** The payload carried by the renderer's `stop` event. */
export interface RiplStopPayload extends RiplStartPayload {
    /** Timestamp at which the loop stopped, in milliseconds. */
    endTime: number;
}

/**
 * A forwarded Ripl event listener. Receives the event's payload directly, with the underlying
 * {@link Event} — carrying `target`, `timestamp` and `stopPropagation` — as a second argument.
 *
 * @typeParam TPayload - The payload the event carries.
 */
export type RiplListener<TPayload> = (payload: TPayload, event: Event<TPayload>) => void;

/** Pointer and drag listeners, shared by elements, groups and the context. */
export interface RiplPointerListeners {
    /** Fired when the pointer is pressed and released without an intervening drag. */
    onClick?: RiplListener<RiplPointerPayload>;
    /** Fired when the pointer is pressed down. */
    onMousedown?: RiplListener<RiplPointerPayload>;
    /** Fired when the pointer is released. */
    onMouseup?: RiplListener<RiplPointerPayload>;
    /** Fired as the pointer moves. */
    onMousemove?: RiplListener<RiplPointerPayload>;
    /** Fired when the pointer enters. */
    onMouseenter?: RiplListener<null>;
    /** Fired when the pointer leaves. */
    onMouseleave?: RiplListener<null>;
    /** Fired once the pointer has moved past the drag threshold with the button held. */
    onDragstart?: RiplListener<RiplDragPayload>;
    /** Fired on each pointer move during a drag gesture. */
    onDrag?: RiplListener<RiplDragPayload>;
    /** Fired when a drag gesture ends. */
    onDragend?: RiplListener<RiplDragPayload>;
}

/** Every listener an element or group accepts. */
export interface RiplElementListeners extends RiplPointerListeners {
    /** Fired whenever one of the element's state properties changes. */
    onUpdated?: RiplListener<RiplUpdatedPayload>;
    /** Fired when the element is destroyed. */
    onDestroyed?: RiplListener<null>;
    /** Fired when the element is added to a group, with the group it joined. */
    onAttached?: RiplListener<Group>;
    /** Fired when the element is removed from a group, with the group it left. */
    onDetached?: RiplListener<Group>;
    /** Fired when the shape of the scene graph at or below this element changes. */
    onGraph?: RiplListener<null>;
}

/**
 * Construction options every element accepts, which become plain fields rather than animatable
 * state, excluding the class binding.
 *
 * Each adapter extends this with its own class prop — `class` in a template language, `className`
 * in JSX — because the two cannot share one name.
 */
export interface RiplElementOptionsBase {
    /** Stable id used for querying and for matching an element across renders. */
    id?: string;
    /** Arbitrary user data bound to the element, typically the datum backing it. */
    data?: unknown;
    /** Which parts of the element respond to pointer hit testing. Defaults to `all`. */
    pointerEvents?: ElementPointerEvents;
    /**
     * Interpolator overrides for individual state properties, layered over the defaults the element
     * type declares. Read once, when the element is constructed.
     */
    interpolators?: ElementInterpolators<BaseElementState>;
}

/** Painting options accepted by every path-backed shape. */
export interface RiplShapeProps {
    /** Whether the shape fills itself automatically when a fill is set. Defaults to `true`. */
    autoFill?: boolean;
    /** Whether the shape strokes itself automatically when a stroke is set. Defaults to `true`. */
    autoStroke?: boolean;
    /** Whether the shape's path clips subsequent siblings. Defaults to `false`. */
    clip?: boolean;
    /** Whether the shape's path is cached between frames. Defaults to `true`. */
    cachePath?: boolean;
}

/** The props a context component accepts, beyond whatever children the framework passes it. */
export interface RiplContextProps extends RiplPointerListeners {
    /**
     * An existing context to draw into instead of creating one. Use this to render through a
     * backend other than canvas, or to keep a context alive across re-mounts.
     */
    context?: Context;
    /** Whether the context listens for and emits pointer and drag events. Defaults to `true`. */
    interactive?: boolean;
    /** Minimum pointer movement, in pixels, before a drag gesture is recognised. Defaults to `3`. */
    dragThreshold?: number;
    /** Arbitrary metadata attached to the context. */
    meta?: Record<string, unknown>;
    /** Fired once the context exists and its host element is in the document. */
    onReady?: (context: Context) => void;
    /** Fired when the context's surface is resized. */
    onResize?: () => void;
    /** Fired when the context requests a repaint that no element change triggered. */
    onRender?: () => void;
}

/** The props a renderer component accepts, beyond whatever children the framework passes it. */
export interface RiplRendererProps {
    /** Whether the renderer starts its animation loop on creation. Defaults to `true`. */
    autoStart?: boolean;
    /** Whether the loop stops when idle: no active transitions and the pointer has left. Defaults to `true`. */
    autoStop?: boolean;
    /** Whether transitions apply their final state immediately rather than animating. */
    immediate?: boolean;
    /** Debug overlays: `true` for all, or an object toggling individual overlays. */
    debug?: boolean | RendererDebugOptions;
    /** Fired when the animation loop starts. */
    onStart?: RiplListener<RiplStartPayload>;
    /** Fired when the animation loop stops. */
    onStop?: RiplListener<RiplStopPayload>;
    /** Fired once per animation frame. */
    onTick?: RiplListener<RiplTickPayload>;
}

/** The props a transition component accepts, beyond whatever children the framework passes it. */
export interface RiplTransitionProps {
    /**
     * The state descendants animate *from* when they enter, with the options to animate by. The
     * target is read off the element before the enter state is applied, so a property the consumer
     * never bound still animates back to its inherited or default value.
     */
    enter?: RiplTransitionPhase;
    /**
     * The options used when a descendant's props change. Its own `state`, if given, is merged over
     * the changed props to form the target.
     */
    update?: RiplTransitionPhase;
    /**
     * The state descendants animate *to* when they leave, with the options to animate by. The
     * element is destroyed once the transition finishes.
     */
    leave?: RiplTransitionPhase;
    /** Whether descendants present on the initial mount run their enter phase. Defaults to `true`. */
    appear?: boolean;
}
