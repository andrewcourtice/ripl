import {
    RiplArcDiagramChart,
    RiplAreaChart,
    RiplBarChart,
    RiplBoxPlotChart,
    RiplChordChart,
    RiplForceDirectedChart,
    RiplFunnelChart,
    RiplGanttChart,
    RiplGaugeChart,
    RiplHeatmapChart,
    RiplHistogramChart,
    RiplLineChart,
    RiplPackedCircleChart,
    RiplPieChart,
    RiplPolarAreaChart,
    RiplPolarScatterChart,
    RiplRadarChart,
    RiplRadialBarChart,
    RiplRealtimeChart,
    RiplSankeyChart,
    RiplScatterChart,
    RiplStockChart,
    RiplSunburstChart,
    RiplTreemapChart,
    RiplTrendChart,
} from './components/charts';

import {
    createRipl,
    registerComponents,
} from '@ripl/vue';

import type {
    Plugin,
} from 'vue';

/** Every component the plugin registers, keyed by the name it is registered under. */
const COMPONENTS: Record<string, unknown> = {
    RiplArcDiagramChart,
    RiplAreaChart,
    RiplBarChart,
    RiplBoxPlotChart,
    RiplChordChart,
    RiplForceDirectedChart,
    RiplFunnelChart,
    RiplGanttChart,
    RiplGaugeChart,
    RiplHeatmapChart,
    RiplHistogramChart,
    RiplLineChart,
    RiplPackedCircleChart,
    RiplPieChart,
    RiplPolarAreaChart,
    RiplPolarScatterChart,
    RiplRadarChart,
    RiplRadialBarChart,
    RiplRealtimeChart,
    RiplSankeyChart,
    RiplScatterChart,
    RiplStockChart,
    RiplSunburstChart,
    RiplTreemapChart,
    RiplTrendChart,
};

/**
 * Creates the Vue plugin that registers every Ripl chart component globally, along with the core
 * components from `@ripl/vue` — so a chart can share a `<ripl-context>` with hand-drawn elements.
 *
 * Applying `createRipl()` as well, in either order, is harmless: a name already registered is
 * skipped rather than re-registered.
 *
 * @returns A plugin to pass to `app.use()`.
 * @example
 * import { createRiplCharts } from '@ripl/vue-charts';
 *
 * createApp(App).use(createRiplCharts()).mount('#app');
 */
export function createRiplCharts(): Plugin {
    return {
        install(app) {
            app.use(createRipl());
            registerComponents(app, COMPONENTS);
        },
    };
}
