import {
    CLASS_KEY,
} from './props';

import {
    collectChangedProps,
    partitionProps,
} from '@ripl/adapters';

import type {
    RiplPropPartition,
    RiplWritable,
} from '@ripl/adapters';

import type {
    Element,
} from '@ripl/web';

import {
    useLayoutEffect,
} from 'react';

/** How a component writes later prop changes back onto the element it built. */
export interface RiplElementPropsOptions {
    /** The prop names kept in sync after construction. */
    syncKeys: readonly string[];
    /** Which of those names are animatable state rather than plain fields. */
    stateKeys: ReadonlySet<string>;
    /** Which plain fields change how the element paints, so a repaint has to be requested. */
    paintedKeys: ReadonlySet<string>;
    /** The values last written to the element; mutated in place. */
    applied: RiplWritable;
    /** Writes a batch of changed props onto the element. */
    apply(element: Element, partition: RiplPropPartition): void;
}

/**
 * Keeps an element in sync with the props bound on its component.
 *
 * Runs after every commit rather than against a dependency list: the props are compared by identity
 * against what was last written, so a render that changed nothing returns `undefined` and allocates
 * nothing at all.
 *
 * @param element - The element to write to, or `undefined` before it has been built.
 * @param props - The component's current props.
 * @param options - Which props to sync and how to apply them.
 */
export function useElementProps(element: Element | undefined, props: RiplWritable, options: RiplElementPropsOptions): void {
    const {
        syncKeys,
        stateKeys,
        paintedKeys,
        applied,
        apply,
    } = options;

    useLayoutEffect(() => {
        const changed = element && collectChangedProps(props, syncKeys, applied, CLASS_KEY);

        if (changed) {
            apply(element, partitionProps(changed, stateKeys, paintedKeys));
        }
    });
}
