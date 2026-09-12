import {
    ELEMENT_OPTION_KEYS_BASE,
    readBoundProps,
    resolveClassNames,
} from '@ripl/adapters';

import type {
    RiplWritable,
} from '@ripl/adapters';

/** The prop React binds class names through, in place of the `class` a template language uses. */
export const CLASS_KEY = 'className';

/** Construction options that become plain fields on the element rather than animatable state. */
export const ELEMENT_OPTION_KEYS = [
    CLASS_KEY,
    ...ELEMENT_OPTION_KEYS_BASE,
] as const;

/** The two views of an element's bound props: what to construct it from, and what was written. */
export interface RiplElementSnapshot {
    /** The values written to the element, against which later props are diffed. */
    applied: RiplWritable;
    /** The options to construct the element from, in the shape Ripl's own factories declare. */
    options: RiplWritable;
}

/**
 * Reads the props that were actually bound into the options an element factory takes.
 *
 * An unbound prop is left out so a Ripl default survives, and the class binding is both split into
 * individual names and renamed onto the `class` field the element options declare — `className`
 * exists only on the React side of the boundary.
 *
 * @param props - The component's props.
 * @param keys - Every prop name the component declares.
 * @returns The applied snapshot and the construction options.
 */
export function readElementSnapshot(props: RiplWritable, keys: readonly string[]): RiplElementSnapshot {
    const applied = readBoundProps(props, keys, CLASS_KEY);

    const options: RiplWritable = {
        ...applied,
    };

    const names = options[CLASS_KEY];

    if (names !== undefined) {
        delete options[CLASS_KEY];
        options.class = resolveClassNames(names);
    }

    return {
        applied,
        options,
    };
}
