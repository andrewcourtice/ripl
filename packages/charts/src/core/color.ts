/**
 * Shared colour-accessor helpers for charts.
 *
 * Centralises the per-item `colorBy` accessor resolution that categorical charts (pie, treemap,
 * funnel, etc.) previously each re-implemented, so they share one consistent code path.
 */

import type {
    Accessor,
} from './data';

import {
    resolveAccessor,
} from './data';

/**
 * Resolves a per-item colour accessor (`colorBy`) into a function returning each item's colour.
 *
 * A property key reads that field, a function is passed through, and an absent accessor yields a
 * function returning `undefined` so callers can fall back to the series colour generator.
 *
 * @typeParam TData - The data-item type.
 * @param colorBy - The `colorBy` accessor, or `undefined` when the chart has no per-item colour.
 * @returns A function mapping a data item to its colour (or `undefined`).
 */
export function resolveColorBy<TData>(colorBy?: keyof TData | ((item: TData) => string)): (item: TData) => string | undefined {
    if (colorBy === undefined) {
        return () => undefined;
    }

    return resolveAccessor<TData, string>(colorBy as Accessor<TData, string>);
}
