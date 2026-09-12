import type {
    EventMap,
} from '@ripl/core';

import type {
    BaseChartOptions,
    Chart,
} from '@ripl/charts';

import type {
    InjectionKey,
    ShallowRef,
} from 'vue';

/**
 * Any chart, whatever its option and event types.
 *
 * `EventBus` holds its listeners in a `Map` keyed by the event map, which makes two charts with
 * different event maps mutually unassignable however narrow the base — so nothing is a real
 * supertype of every chart, and `chartFactory` bridges the gap with a single cast.
 */
export type RiplAnyChart = Chart<BaseChartOptions, EventMap>;

// A registry symbol for the same reason `@ripl/vue` uses them: the standalone IIFE builds inline
// their workspace dependencies, so a page loading two adapters holds two sets of unequal keys.

/** Injection key for the chart a subtree belongs to. */
export const RIPL_CHART: InjectionKey<ShallowRef<RiplAnyChart | undefined>> = Symbol.for('ripl.vuecharts.chart');
