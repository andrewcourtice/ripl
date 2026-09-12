import {
    BASE_STATE_KEYS,
    CONSTRUCTION_ONLY_KEYS,
    SHAPE_FIELD_KEYS,
    SHAPE_FIELDS,
} from './constants';

import type {
    RiplFieldWriters,
    RiplWritable,
} from './state';

import type {
    Element,
} from '@ripl/web';

/**
 * Describes one element to wrap as a component.
 *
 * `create` is deliberately untyped on both sides. Props arrive as a loose bag, and several element
 * states narrow a base property — `EllipseState.rotation` is `number` where the base allows a CSS
 * angle string — which makes those classes invariant with the base `Element`. Typing is restored
 * where it is useful to consumers: on the component's props.
 */
export interface RiplNodeDefinition {
    /** The component's name, e.g. `RiplCircle`. */
    name: string;
    /** The element's own state property names, on top of the shared base state. */
    stateKeys: readonly string[];
    /** The inheritable state every element of this kind carries. Defaults to the 2D base state. */
    baseStateKeys?: readonly string[];
    /** Extra prop names written as plain fields rather than animatable state. */
    fieldKeys?: readonly string[];
    /** Prop names read only at construction. Defaults to the shared element set. */
    constructionOnlyKeys?: ReadonlySet<string>;
    /** Plain fields that change how the element paints. Defaults to the shape fields. */
    paintedKeys?: ReadonlySet<string>;
    /** Write overrides for fields the element exposes through a method rather than a setter. */
    fieldWriters?: RiplFieldWriters;
    /** Whether the node owns children: a group renders its children and parents its descendants. */
    container?: boolean;
    /** Constructs the underlying element from the props bound on the component. */
    create(options: RiplWritable): Element;
}

/** A node definition with every key list resolved, ready for a component to bind to. */
export interface RiplResolvedNodeDefinition {
    /** Every prop name the component declares, in the order they are read. */
    propKeys: string[];
    /** Which of those names are animatable state rather than plain fields. */
    stateKeys: Set<string>;
    /** The prop names kept in sync after construction. */
    syncKeys: string[];
    /** Which prop names are read only at construction. */
    constructionOnlyKeys: ReadonlySet<string>;
    /** Which plain fields change how the element paints, so a repaint has to be requested. */
    paintedKeys: ReadonlySet<string>;
}

/**
 * Adapts a typed element factory to {@link RiplNodeDefinition}'s untyped `create` hook.
 *
 * @typeParam TOptions - The factory's own options type.
 * @param create - The element's factory function.
 * @returns A `create` hook that constructs the element from a loose prop bag.
 */
export function elementFactory<TOptions>(create: (options: TOptions) => unknown) {
    return (options: RiplWritable) => create(options as TOptions) as Element;
}

/**
 * Resolves a node definition's key lists once, when the component is defined, so no per-instance
 * work repeats them.
 *
 * @param definition - How to construct the element and which props it accepts.
 * @param optionKeys - The adapter's shared construction option names, including its class prop.
 * @returns The resolved key lists.
 * @example
 * const resolved = resolveNodeDefinition({
 *     name: 'RiplCircle',
 *     stateKeys: ELEMENT_STATE_KEYS.circle,
 *     create: elementFactory<Shape2DOptions<CircleState>>(createCircle),
 * }, ELEMENT_OPTION_KEYS);
 */
export function resolveNodeDefinition(definition: RiplNodeDefinition, optionKeys: readonly string[]): RiplResolvedNodeDefinition {
    const baseStateKeys = definition.baseStateKeys ?? BASE_STATE_KEYS;
    const constructionOnlyKeys = definition.constructionOnlyKeys ?? CONSTRUCTION_ONLY_KEYS;

    const propKeys = [
        ...optionKeys,
        ...SHAPE_FIELD_KEYS,
        ...definition.fieldKeys ?? [],
        ...baseStateKeys,
        ...definition.stateKeys,
    ];

    const stateKeys = new Set<string>([
        ...baseStateKeys,
        ...definition.stateKeys,
    ]);

    return {
        propKeys,
        stateKeys,
        syncKeys: propKeys.filter(key => !constructionOnlyKeys.has(key)),
        constructionOnlyKeys,
        paintedKeys: definition.paintedKeys ?? SHAPE_FIELDS,
    };
}
