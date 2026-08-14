import {
    objectForEach,
} from '@ripl/utilities';

import type {
    Element,
} from '@ripl/web';

import {
    normalizeClass,
} from 'vue';

/** An untyped view of an element, used to write state through its accessors by key. */
export type RiplWritable = Record<string, unknown>;

/** Per-field write overrides, for fields an element exposes through a method rather than a setter. */
export type RiplFieldWriters = Record<string, (element: Element, value: unknown) => void>;

/** The two halves a changed prop batch splits into, and what each half needs applying. */
export interface RiplPropPartition {
    /** The changed props that are animatable element state. */
    state: RiplWritable;
    /** The changed props that are plain fields. */
    fields: RiplWritable;
    /** Whether any animatable state changed. */
    hasState: boolean;
    /** Whether a changed field affects painting, so a repaint has to be requested. */
    hasPaintedField: boolean;
}

// A `:class` object literal is a fresh object every render, so comparing the raw binding would
// report a change every time; the normalised string is stable and `normalizeClass` is idempotent.
function readProp(props: RiplWritable, key: string): unknown {
    const value = props[key];

    return key === 'class' && value !== undefined
        ? normalizeClass(value)
        : value;
}

/** Splits any of Vue's class binding forms into individual class names. */
export function resolveClassNames(value: unknown): string[] {
    return normalizeClass(value).split(/\s+/).filter(Boolean);
}

/**
 * Reads the props that were actually bound; an unbound prop must not overwrite a Ripl default.
 *
 * @param props - The component's props object.
 * @param keys - Every prop name the component declares.
 * @returns The bound props, with `class` normalised to a string.
 */
export function readBoundProps(props: RiplWritable, keys: readonly string[]): RiplWritable {
    const output: RiplWritable = {};

    keys.forEach(key => {
        const value = readProp(props, key);

        if (value !== undefined) {
            output[key] = value;
        }
    });

    return output;
}

/**
 * Reads the bound props, folding any that differ from `applied` into a changed batch.
 *
 * Writes through to `applied` so the caller keeps no second snapshot, and returns `undefined`
 * rather than an empty object, so a tick that changed nothing costs no allocation at all.
 *
 * @param props - The component's props object.
 * @param keys - Every prop name to keep in sync.
 * @param applied - The values last written to the element; mutated in place.
 * @returns The changed props, or `undefined` when none changed.
 */
export function collectChangedProps(props: RiplWritable, keys: readonly string[], applied: RiplWritable): RiplWritable | undefined {
    let changed: RiplWritable | undefined;

    keys.forEach(key => {
        const value = readProp(props, key);

        if (value === undefined || applied[key] === value) {
            return;
        }

        applied[key] = value;
        (changed ??= {})[key] = value;
    });

    return changed;
}

/**
 * Partitions changed props into animatable state and plain fields.
 *
 * @param changed - The props that changed.
 * @param stateKeys - The prop names that are animatable state.
 * @param paintedKeys - The field names that change how the element paints.
 * @returns The two halves, and flags describing what needs applying.
 */
export function partitionProps(changed: RiplWritable, stateKeys: ReadonlySet<string>, paintedKeys: ReadonlySet<string>): RiplPropPartition {
    const state: RiplWritable = {};
    const fields: RiplWritable = {};

    let hasState = false;
    let hasPaintedField = false;

    objectForEach(changed, (key, value) => {
        if (stateKeys.has(key)) {
            state[key] = value;
            hasState = true;
            return;
        }

        fields[key] = value;
        hasPaintedField ||= paintedKeys.has(key);
    });

    return {
        state,
        fields,
        hasState,
        hasPaintedField,
    };
}

/** Writes state values through the element's accessors, which mark it dirty and emit `updated`. */
export function applyState(element: Element, state: RiplWritable): void {
    objectForEach(state, (key, value) => {
        (element as unknown as RiplWritable)[key] = value;
    });
}

/**
 * Writes the plain fields, which emit nothing, so a repaint has to be requested separately.
 *
 * @param element - The element to write to.
 * @param fields - The changed fields.
 * @param writers - Write overrides for fields with no plain setter.
 */
export function applyFields(element: Element, fields: RiplWritable, writers?: RiplFieldWriters): void {
    objectForEach(fields, (key, value) => {
        const writer = writers?.[key];

        if (writer) {
            writer(element, value);
            return;
        }

        if (key !== 'class') {
            (element as unknown as RiplWritable)[key] = value;
            return;
        }

        element.classList.clear();
        resolveClassNames(value).forEach(name => element.classList.add(name));
    });
}
