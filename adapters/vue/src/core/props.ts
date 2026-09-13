import {
    ELEMENT_OPTION_KEYS_BASE,
    SHAPE_FIELDS,
} from '@ripl/adapters';

import type {
    ComponentObjectPropsOptions,
} from 'vue';

/**
 * A prop Ripl itself types, declared here only so Vue extracts it from attrs. Runtime validation
 * would duplicate — and inevitably drift from — the element state interfaces.
 */
export const ANY_PROP = {
    /** Vue's runtime type check for any value. */
    type: null,
    /** Absent means unset, so an omitted prop leaves the Ripl default alone. */
    default: undefined,
} as const;

/**
 * A boolean prop. `default: undefined` is load-bearing: without an explicit default Vue casts an
 * absent boolean prop to `false`, which would override Ripl's own defaults rather than leave them
 * alone. Declaring the default keeps valueless-attribute casting (`<ripl-rect clip>`) while letting
 * an omitted prop stay omitted.
 */
export const BOOLEAN_PROP = {
    /** Vue's runtime type check for a boolean. */
    type: Boolean,
    /** Absent means unset, so an omitted prop leaves the Ripl default alone. */
    default: undefined,
} as const;

/** A numeric prop, left undefined when absent so it cannot override a Ripl default. */
export const NUMBER_PROP = {
    /** Vue's runtime type check for a number. */
    type: Number,
    /** Absent means unset, so an omitted prop leaves the Ripl default alone. */
    default: undefined,
} as const;

/** Construction options that become plain fields on the element rather than animatable state. */
export const ELEMENT_OPTION_KEYS = [
    'class',
    ...ELEMENT_OPTION_KEYS_BASE,
] as const;

/** Builds a Vue runtime props declaration from a list of prop names. */
export function createProps(keys: readonly string[]): ComponentObjectPropsOptions {
    return Object.fromEntries(keys.map(key => [
        key,
        SHAPE_FIELDS.has(key) ? BOOLEAN_PROP : ANY_PROP,
    ]));
}
