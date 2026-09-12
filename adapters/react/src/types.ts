import type {
    RiplContextProps as RiplContextOptions,
    RiplElementListeners,
    RiplElementOptionsBase,
    RiplShapeProps,
} from '@ripl/adapters';

import type {
    BaseElementState,
} from '@ripl/web';

import type {
    CSSProperties,
    ForwardRefExoticComponent,
    PropsWithChildren,
    RefAttributes,
} from 'react';

export type {
    RiplDragPayload,
    RiplElementListeners,
    RiplListener,
    RiplPointerListeners,
    RiplPointerPayload,
    RiplRendererProps,
    RiplShapeProps,
    RiplStartPayload,
    RiplStopPayload,
    RiplTickPayload,
    RiplTransitionProps,
    RiplUpdatedPayload,
} from '@ripl/adapters';

/**
 * The DOM props a component that renders its own host element passes through to it.
 *
 * React has no attribute fallthrough, so a component that owns a real element has to accept these
 * explicitly — and a context or a chart needs at least a size.
 */
export interface RiplHostProps {
    /** Class names applied to the component's root element. */
    className?: string;
    /** Inline styles applied to the component's root element, typically its size. */
    style?: CSSProperties;
}

/** Props accepted by {@link RiplContext}. */
export interface RiplContextProps extends RiplContextOptions, RiplHostProps {}

/** Construction options every element accepts, which become plain fields rather than animatable state. */
export interface RiplElementOptionProps extends RiplElementOptionsBase {
    /**
     * Class names used for querying: a string, an array, or an object whose truthy keys are the
     * active names. These bind the element's own class list, not the marker node the component
     * renders, so `scene.query('.segment')` finds it.
     */
    className?: unknown;
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
 * A declarative component wrapping a Ripl object.
 *
 * A `ref` on any of these resolves to the wrapped Ripl object itself rather than to anything React
 * owns, which is how the imperative API stays reachable.
 *
 * @typeParam TProps - The component's prop surface.
 * @typeParam TInstance - The Ripl object a `ref` on the component resolves to.
 */
export type RiplComponent<TProps, TInstance = unknown> = ForwardRefExoticComponent<PropsWithChildren<TProps> & RefAttributes<TInstance>>;
