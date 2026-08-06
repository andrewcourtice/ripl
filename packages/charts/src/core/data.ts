/**
 * Shared data helpers for charts.
 *
 * Collects the small accessor/join/stacking utilities that were duplicated across charts
 * (bar.ts alone contained three near-identical stack-offset implementations).
 */

import {
    typeIsFunction,
    typeIsString,
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
 * Normalizes an {@link Accessor} into a function. Property keys read the field, functions are
 * passed through, and any other value is treated as a constant.
 */
export function resolveAccessor<TData, TValue>(accessor: Accessor<TData, TValue>): (item: TData) => TValue {
    if (typeIsFunction(accessor)) {
        return accessor as (item: TData) => TValue;
    }

    // Numbers are constants, not keys, so a scatter `sizeBy: number` reads as a fixed value.
    if (typeIsString(accessor) || typeof accessor === 'symbol') {
        return (item: TData) => item[accessor as keyof TData] as unknown as TValue;
    }

    return () => accessor as TValue;
}

/**
 * Builds a value → index lookup with `Array.prototype.indexOf` semantics: the earliest occurrence
 * wins for a duplicated value, an absent value resolves to `-1`, and `NaN` matches nothing.
 *
 * A render loop that resolves each datum's position with `indexOf` is quadratic over a series;
 * building the lookup once makes every resolution constant time.
 *
 * @typeParam TValue - The array's element type.
 * @param values - The array to index, in order.
 * @returns A function resolving a value to its index in `values`, or `-1` when absent.
 */
export function createIndexLookup<TValue>(values: readonly TValue[]): (value: TValue) => number {
    const indices = new Map<TValue, number>();

    values.forEach((value, index) => {
        // `Map` matches NaN to itself where `indexOf` never does, so leave NaN unindexed.
        if (indices.has(value) || (typeof value === 'number' && Number.isNaN(value))) {
            return;
        }

        indices.set(value, index);
    });

    return value => indices.get(value) ?? -1;
}

/**
 * Builds a key → value lookup with `Array.prototype.find` semantics over a key comparison: the
 * earliest match wins for a duplicated key, and an unknown key resolves to `undefined`.
 *
 * @typeParam TValue - The array's element type.
 * @typeParam TKey - The key type the values are looked up by.
 * @param values - The array to index, in order.
 * @param getKey - Resolves a value's lookup key.
 * @returns A function resolving a key to its first matching value, or `undefined` when absent.
 */
export function createKeyedLookup<TValue, TKey>(values: readonly TValue[], getKey: (value: TValue) => TKey): (key: TKey) => TValue | undefined {
    const matches = new Map<TKey, TValue>();

    values.forEach(value => {
        const key = getKey(value);

        if (!matches.has(key)) {
            matches.set(key, value);
        }
    });

    return key => matches.get(key);
}

/**
 * Computes the stacked baseline offset for a series at a given data item. Positive and negative
 * values stack independently so diverging stacks render correctly. Series earlier in the array
 * sit closer to the baseline.
 *
 * @param series - The series that stack together, in stacking order.
 * @param current - The series to compute the offset for.
 * @param item - The data item being stacked.
 * @param getValue - Resolves a series' numeric value at a data item.
 * @param currentIndex - `current`'s index in `series`, when the caller already holds it. Defaults to
 * an `indexOf` scan, which is quadratic when the offset is computed for every series in turn.
 */
export function computeStackOffset<TSeries, TData>(
    series: TSeries[],
    current: TSeries,
    item: TData,
    getValue: (series: TSeries, item: TData) => number,
    currentIndex: number = series.indexOf(current)
): number {
    const currentValue = getValue(current, item);

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

/**
 * Computes the value extent `[min, max]` of independently stacked positive and negative totals: the
 * span a stacked bar chart covers when, per item, positive and negative values accumulate from the
 * baseline in opposite directions. Both bounds seed at `0`, so an all-positive (or all-negative)
 * dataset keeps a zero baseline.
 *
 * @typeParam TSeries - The series type.
 * @typeParam TData - The data-item type.
 * @param series - The series that stack together.
 * @param data - The dataset iterated per item.
 * @param getValue - Resolves a series' numeric value at a data item.
 * @returns The `[min, max]` extent covering every item's positive and negative stacked totals.
 */
export function positiveNegativeExtent<TSeries, TData>(
    series: TSeries[],
    data: TData[],
    getValue: (series: TSeries, item: TData) => number
): [number, number] {
    let max = 0;
    let min = 0;

    data.forEach(item => {
        let positive = 0;
        let negative = 0;

        series.forEach(srs => {
            const value = getValue(srs, item);

            if (value >= 0) {
                positive += value;
            } else {
                negative += value;
            }
        });

        max = Math.max(max, positive);
        min = Math.min(min, negative);
    });

    return [min, max];
}

/**
 * Computes the value extent `[min, max]` of the running cumulative total across series: the span a
 * stacked area chart covers as each series accumulates on top of the previous ones. Both bounds seed
 * at `0`, so a single-sign dataset keeps a zero baseline.
 *
 * @typeParam TSeries - The series type.
 * @typeParam TData - The data-item type.
 * @param series - The series that stack together, in stacking order.
 * @param data - The dataset iterated per item.
 * @param getValue - Resolves a series' numeric value at a data item.
 * @returns The `[min, max]` extent covering the cumulative running total across every item.
 */
export function cumulativeExtent<TSeries, TData>(
    series: TSeries[],
    data: TData[],
    getValue: (series: TSeries, item: TData) => number
): [number, number] {
    let max = 0;
    let min = 0;

    data.forEach(item => {
        let cumulative = 0;
        let cumulativeMax = 0;
        let cumulativeMin = 0;

        series.forEach(srs => {
            cumulative += getValue(srs, item);
            cumulativeMax = Math.max(cumulativeMax, cumulative);
            cumulativeMin = Math.min(cumulativeMin, cumulative);
        });

        max = Math.max(max, cumulativeMax);
        min = Math.min(min, cumulativeMin);
    });

    return [min, max];
}
