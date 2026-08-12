import type {
    Element,
} from '@ripl/web';

import {
    normalizeClass,
} from 'vue';

/** An untyped view of an element, used to write state through its accessors by key. */
export type RiplWritable = Record<string, unknown>;

/** Splits any of Vue's class binding forms into individual class names. */
export function resolveClassNames(value: unknown): string[] {
    return normalizeClass(value).split(/\s+/).filter(Boolean);
}

/** Reads the props that were actually bound; an unbound prop must not overwrite a Ripl default. */
export function readBoundProps(props: RiplWritable, keys: readonly string[]): RiplWritable {
    return Object.fromEntries(keys
        .map((key): [string, unknown] => [
            key,
            props[key],
        ])
        .filter(([, value]) => value !== undefined));
}

/** Returns the entries of `next` that differ from `previous`. */
export function diffProps(previous: RiplWritable, next: RiplWritable): RiplWritable {
    return Object.fromEntries(Object.entries(next).filter(([key, value]) => previous[key] !== value));
}

/** Partitions changed props into animatable state and plain fields. */
export function partitionProps(changed: RiplWritable, stateKeys: Set<string>): [RiplWritable, RiplWritable] {
    const entries = Object.entries(changed);

    return [
        Object.fromEntries(entries.filter(([key]) => stateKeys.has(key))),
        Object.fromEntries(entries.filter(([key]) => !stateKeys.has(key))),
    ];
}

/** Writes state values through the element's accessors, which mark it dirty and emit `updated`. */
export function applyState(element: Element, state: RiplWritable): void {
    Object.entries(state).forEach(([key, value]) => {
        (element as unknown as RiplWritable)[key] = value;
    });
}

/** Writes the plain fields, which emit nothing, so a repaint has to be requested separately. */
export function applyFields(element: Element, fields: RiplWritable): void {
    Object.entries(fields).forEach(([key, value]) => {
        if (key !== 'class') {
            (element as unknown as RiplWritable)[key] = value;
            return;
        }

        element.classList.clear();
        resolveClassNames(value).forEach(name => element.classList.add(name));
    });
}
