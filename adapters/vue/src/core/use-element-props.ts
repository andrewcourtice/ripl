import {
    CONSTRUCTION_ONLY_KEYS,
    SHAPE_FIELDS,
} from './props';

import {
    collectChangedProps,
    partitionProps,
    readBoundProps,
    resolveClassNames,
} from './state';

import type {
    RiplPropPartition,
    RiplWritable,
} from './state';

import type {
    Element,
} from '@ripl/web';

import {
    watch,
} from 'vue';

/** How a component builds its element from props and writes later changes back onto it. */
export interface RiplElementPropsOptions<TElement extends Element> {
    /** Every prop name the component declares. */
    keys: readonly string[];
    /** Which of those names are animatable state rather than plain fields. */
    stateKeys: ReadonlySet<string>;
    /** Which are read only at construction. Defaults to the shared element set. */
    constructionOnlyKeys?: ReadonlySet<string>;
    /** Which plain fields change how the element paints, so a repaint has to be requested. Defaults to the shape fields. */
    paintedKeys?: ReadonlySet<string>;
    /** Builds the element from the construction snapshot, or returns `undefined` to decline. */
    create(initial: RiplWritable): TElement | undefined;
    /** Writes a batch of changed props onto the element. */
    apply(element: TElement, partition: RiplPropPartition): void;
}

/**
 * Constructs an element from its bound props and keeps it in sync with them.
 *
 * The construction snapshot excludes unbound props, so a prop the template never set cannot
 * overwrite a Ripl default. Later changes arrive pre-split into animatable state and plain fields,
 * since the two are written through different paths on the element.
 *
 * @typeParam TElement - The element type being wrapped.
 * @param props - The component's props object.
 * @param options - How to build the element and apply changes to it.
 * @returns The constructed element, or `undefined` when construction declined.
 */
export function useElementProps<TElement extends Element>(props: RiplWritable, options: RiplElementPropsOptions<TElement>): TElement | undefined {
    const {
        keys,
        stateKeys,
        constructionOnlyKeys = CONSTRUCTION_ONLY_KEYS,
        paintedKeys = SHAPE_FIELDS,
        create,
        apply,
    } = options;

    const initial = readBoundProps(props, keys);
    const applied = {
        ...initial,
    };

    if (initial.class !== undefined) {
        initial.class = resolveClassNames(initial.class);
    }

    const element = create(initial);

    if (!element) {
        return undefined;
    }

    const syncKeys = keys.filter(key => !constructionOnlyKeys.has(key));

    // The getter writes through to `applied`, so an unchanged tick returns `undefined` and
    // allocates nothing; `watch` seeds its old value from a first call that is already in sync.
    watch(() => collectChangedProps(props, syncKeys, applied), changed => {
        if (changed) {
            apply(element, partitionProps(changed, stateKeys, paintedKeys));
        }
    });

    return element;
}
