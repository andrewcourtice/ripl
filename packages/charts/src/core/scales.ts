/**
 * Shared value-axis scale construction for cartesian charts.
 *
 * Turns the resolved {@link ChartAxisItemOptions} for a value axis into a concrete
 * {@link Scale}, selecting the scale family (`linear`/`log`/`pow`/`sqrt`), applying an explicit
 * `min`/`max` domain override, and nice-ing the domain to tick-aligned bounds. Charts route their
 * value scale through this so a `scale`, `nice`, `ticks`, `min`, or `max` option works uniformly.
 */

import type {
    ChartAxisItemOptions,
} from './options';

import type {
    Scale,
} from '@ripl/core';

import {
    scaleContinuous,
    scaleLogarithmic,
    scalePower,
    scaleSymlog,
    scaleTime,
} from '@ripl/core';

/**
 * The target number of ticks (and grid lines) an axis draws, from its `ticks` option (default 10).
 *
 * @param options - The resolved axis options.
 * @returns The tick count.
 */
export function axisTickCount(options: ChartAxisItemOptions): number {
    return options.ticks ?? 10;
}

/**
 * Whether the resolved axis options select the time scale family (a continuous axis over `Date`
 * values with calendar-aligned ticks).
 *
 * @param options - The resolved axis options.
 * @returns `true` when the axis is configured with `scale: 'time'`.
 */
export function isTimeAxis(options: ChartAxisItemOptions): boolean {
    return options.scale === 'time';
}

/**
 * Builds a time-axis {@link Scale} from resolved axis options over a millisecond extent and pixel
 * range. An explicit numeric `min`/`max` (epoch milliseconds) overrides the corresponding end of
 * the data extent. Ticks are calendar-aligned `Date` values from the core time scale.
 *
 * @param options - The resolved axis options (min/max in epoch milliseconds where set).
 * @param domain - The data extent `[min, max]` in epoch milliseconds.
 * @param range - The pixel range `[start, end]` the scale maps onto.
 * @returns A scale mapping `Date` values to pixels.
 */
export function createTimeAxisScale(
    options: ChartAxisItemOptions,
    domain: number[],
    range: number[]
): Scale<Date, number> {
    const min = typeof options.min === 'number' ? options.min : domain[0];
    const max = typeof options.max === 'number' ? options.max : domain[1];

    return scaleTime([
        new Date(min),
        new Date(max),
    ], range);
}

/**
 * Builds a value-axis {@link Scale} from resolved axis options over a data extent and pixel range.
 *
 * The scale family is chosen from `options.scale` (`'log'`, `'pow'`, `'sqrt'`, or the default
 * `'linear'`). An explicit `min`/`max` overrides the corresponding end of the data extent and is
 * respected exactly; otherwise the domain is niced to tick-aligned bounds unless `nice` is `false`.
 *
 * @param options - The resolved axis options (scale type, nice, ticks, min/max, base/exponent).
 * @param domain - The data extent `[min, max]` the values span.
 * @param range - The pixel range `[start, end]` the scale maps onto.
 * @returns A numeric scale mapping `domain` to `range`.
 */
export function createValueScale(
    options: ChartAxisItemOptions,
    domain: number[],
    range: number[]
): Scale<number> {
    const min = typeof options.min === 'number' ? options.min : domain[0];
    const max = typeof options.max === 'number' ? options.max : domain[1];
    const resolvedDomain: [number, number] = [min, max];

    // Explicit bounds are honoured exactly; otherwise nice the domain to tick-aligned boundaries
    // (the historical default via `padToTicks`), unless the caller opted out with `nice: false`.
    const hasExplicitBounds = typeof options.min === 'number' || typeof options.max === 'number';
    const nice = options.nice ?? true;

    let padToTicks: boolean | number | undefined;

    if (nice !== false && !hasExplicitBounds) {
        padToTicks = typeof nice === 'number' ? nice : axisTickCount(options);
    }

    if (options.scale === 'log') {
        return scaleLogarithmic(resolvedDomain, range, {
            base: options.base ?? 10,
            padToTicks,
        });
    }

    if (options.scale === 'pow') {
        return scalePower(resolvedDomain, range, {
            exponent: options.exponent ?? 1,
            padToTicks,
        });
    }

    if (options.scale === 'sqrt') {
        return scalePower(resolvedDomain, range, {
            exponent: 0.5,
            padToTicks,
        });
    }

    if (options.scale === 'symlog') {
        return scaleSymlog(resolvedDomain, range, {
            constant: options.constant ?? 1,
            padToTicks,
        });
    }

    return scaleContinuous(resolvedDomain, range, {
        padToTicks,
    });
}
