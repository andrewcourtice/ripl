/**
 * Shared data helpers for charts.
 *
 * Collects the small accessor/join/stacking utilities that were duplicated across charts
 * (bar.ts alone contained three near-identical stack-offset implementations).
 */

import {
    typeIsFunction,
} from '@ripl/utilities';

/** A value accessor expressed as a property key, a constant, or a function. */

export type Accessor<TData, TValue> = keyof TData | TValue | ((item: TData) => TValue);

/** The keys of `TData` whose values are `number`. Resolves to `never` for `unknown`/loose data. */
export type NumericKey<TData> = {
    [K in keyof TData]-?: TData[K] extends number ? K : never;
}[keyof TData];

/**
 * A strongly-typed numeric accessor: a numeric-valued property key of `TData`, or a function
 * returning a `number`. Using this (instead of a bare `keyof TData`) makes the compiler reject a key
 * that points at a non-numeric field. Fields that also accept a fixed constant (e.g. a scatter
 * `sizeBy`) widen this with `| number` at the option site.
 */
export type NumericAccessor<TData> = NumericKey<TData> | ((item: TData) => number);

/**
 * Normalises an {@link Accessor} into a function. Property keys read the field, functions are
 * passed through, and any other value is treated as a constant.
 */
export function resolveAccessor<TData, TValue>(accessor: Accessor<TData, TValue>): (item: TData) => TValue {
    if (typeIsFunction(accessor)) {
        return accessor as (item: TData) => TValue;
    }

    // Only strings and symbols are treated as property keys; numbers (and any other value) are
    // treated as constants so options like a scatter `sizeBy: number` behave as a fixed value.
    if (typeof accessor === 'string' || typeof accessor === 'symbol') {
        return (item: TData) => item[accessor as keyof TData] as unknown as TValue;
    }

    return () => accessor as TValue;
}

/**
 * Computes the stacked baseline offset for a series at a given data item. Positive and negative
 * values stack independently so diverging stacks render correctly. Series earlier in the array
 * sit closer to the baseline.
 */
export function computeStackOffset<TSeries, TData>(
    series: TSeries[],
    current: TSeries,
    item: TData,
    getValue: (series: TSeries, item: TData) => number
): number {
    const currentValue = getValue(current, item);
    const currentIndex = series.indexOf(current);

    return series.slice(0, currentIndex).reduce((sum, previous) => {
        const previousValue = getValue(previous, item);

        if (currentValue >= 0 && previousValue >= 0) {
            return sum + previousValue;
        }

        if (currentValue < 0 && previousValue < 0) {
            return sum + previousValue;
        }

        return sum;
    }, 0);
}
