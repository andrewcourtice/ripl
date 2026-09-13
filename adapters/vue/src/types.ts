import type {
    RiplElementListeners,
    RiplElementOptionsBase,
    RiplShapeProps,
} from '@ripl/adapters';

import type {
    BaseElementState,
} from '@ripl/web';

import type {
    AllowedComponentProps,
    VNode,
    VNodeProps,
} from 'vue';

export type {
    RiplContextProps,
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

/** Construction options every element accepts, which become plain fields rather than animatable state. */
export interface RiplElementOptionProps extends RiplElementOptionsBase {
    /** Class names used for querying, in any of Vue's class binding forms. */
    class?: unknown;
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
 * Typed through `$props` rather than `DefineComponent` so that editors and `vue-tsc` resolve each
 * element's own state properties, which the runtime prop declarations deliberately leave untyped.
 *
 * The instance type is the wrapped Ripl object itself, because a template ref on any of these
 * components resolves to that object rather than to Vue's component proxy.
 *
 * @typeParam TProps - The component's prop surface.
 * @typeParam TExposed - The Ripl object a template ref on the component resolves to.
 */
export interface RiplComponent<TProps, TExposed = unknown> {
    /** @internal Structural marker that lets Vue's language tooling read the prop surface. */
    new (): {
        $props: TProps & VNodeProps & AllowedComponentProps;
        $slots: {
            default?: () => VNode[];
        };
    } & TExposed;
}
