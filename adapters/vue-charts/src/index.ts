export * from './components/charts';
export * from './compositions';
export * from './plugin';
export * from './types';

export { defineRiplChart } from './core/define-chart';

export type { RiplChartDefinition } from './core/define-chart';

export { RIPL_CHART } from './core/injection';

export type { RiplAnyChart } from './core/injection';

export {
    BASE_CHART_OPTION_KEYS,
    CHART_OPTION_KEYS,
} from './core/props';

// A chart can share a surface with hand-drawn elements, so the context component is re-exported
// here and one import covers both.
export {
    RiplContext,
    useRiplContext,
} from '@ripl/vue';
