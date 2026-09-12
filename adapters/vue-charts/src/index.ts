export * from './components/charts';
export * from './compositions';
export * from './plugin';
export * from './types';

export { defineRiplChart } from './core/define-chart';

export { RIPL_CHART } from './core/injection';

// The option tables and the chart lifecycle live in `@ripl/adapters-charts`, shared with the React
// adapter; they are re-exported here so one import covers a whole chart.

export {
    BASE_CHART_OPTION_KEYS,
    chartFactory,
    CHART_OPTION_KEYS,
} from '@ripl/adapters-charts';

export type {
    RiplAnyChart,
    RiplChartDefinition,
} from '@ripl/adapters-charts';

// A chart can share a surface with hand-drawn elements, so the context component is re-exported
// here and one import covers both.
export {
    RiplContext,
    useRiplContext,
} from '@ripl/vue';
