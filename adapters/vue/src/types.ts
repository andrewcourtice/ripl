import type {
    BaseElementState,
    ElementPointerEvents,
    Event,
} from '@ripl/web';

import type {
    AllowedComponentProps,
    VNode,
    VNodeProps,
} from 'vue';

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
}

/** Construction options every element accepts, which become plain fields rather than animatable state. */
export interface RiplElementOptionProps {
    /** Stable id used for querying and for matching an element across renders. */
    id?: string;
    /** Class names used for querying, in any of Vue's class binding forms. */
    class?: unknown;
    /** Arbitrary user data bound to the element, typically the datum backing it. */
    data?: unknown;
    /** Which parts of the element respond to pointer hit testing. Defaults to `all`. */
    pointerEvents?: ElementPointerEvents;
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

/**
 * The full prop surface of an element component: the element's own state, the shared construction
 * options and paint flags, and its event listeners.
 *
 * @typeParam TState - The element's state interface, e.g. `CircleState`.
 */
export type RiplElementProps<TState extends BaseElementState> = Partial<TState>
& RiplElementOptionProps
& RiplShapeProps
& RiplElementListeners;

/**
 * A declarative component wrapping a Ripl element.
 *
 * Typed through `$props` rather than `DefineComponent` so that editors and `vue-tsc` resolve each
 * element's own state properties, which the runtime prop declarations deliberately leave untyped.
 *
 * @typeParam TProps - The component's prop surface.
 */
export interface RiplComponent<TProps> {
    /** @internal Structural marker that lets Vue's language tooling read the prop surface. */
    new (): {
        $props: TProps & VNodeProps & AllowedComponentProps;
        $slots: {
            default?: () => VNode[];
        };
    };
}
