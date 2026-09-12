import {
    RIPL_CHART,
} from '../core/contexts';

import type {
    RiplAnyChart,
} from '@ripl/adapters-charts';

import {
    useContext,
} from 'react';

/**
 * Returns the chart provided by the nearest chart component.
 *
 * The chart is built in that component's layout effect and published through state, so a descendant
 * always renders after it exists. It is `undefined` outside a chart component, and during server
 * rendering.
 *
 * @returns The chart, or `undefined` when there is none.
 * @example
 * const chart = useRiplChart();
 *
 * const download = () => chart?.export().toURL();
 */
export function useRiplChart(): RiplAnyChart | undefined {
    return useContext(RIPL_CHART);
}
