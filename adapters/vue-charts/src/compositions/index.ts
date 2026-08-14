import {
    RIPL_CHART,
} from '../core/injection';

import type {
    RiplAnyChart,
} from '../core/injection';

import {
    inject,
    shallowRef,
} from 'vue';

import type {
    ShallowRef,
} from 'vue';

/** Shared empty ref, returned when the composition is used outside a chart component. */
const EMPTY: ShallowRef<undefined> = shallowRef();

/**
 * Returns the chart provided by the nearest chart component.
 *
 * The chart is created during that component's `setup()`, so this already resolves in a
 * descendant's own `setup()`. It is `undefined` outside a chart component, and during server
 * rendering.
 *
 * @returns The chart, or `undefined` when there is none.
 * @example
 * const chart = useRiplChart();
 *
 * function download() {
 *     return chart.value?.export().toURL();
 * }
 */
export function useRiplChart(): ShallowRef<RiplAnyChart | undefined> {
    return inject(RIPL_CHART, EMPTY);
}
