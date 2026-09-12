import type {
    RiplAnyChart,
} from '@ripl/adapters-charts';

import type {
    InjectionKey,
    ShallowRef,
} from 'vue';

// A registry symbol for the same reason `@ripl/vue` uses them: the standalone IIFE builds inline
// their workspace dependencies, so a page loading two adapters holds two sets of unequal keys.

/** Injection key for the chart a subtree belongs to. */
export const RIPL_CHART: InjectionKey<ShallowRef<RiplAnyChart | undefined>> = Symbol.for('ripl.vuecharts.chart');
