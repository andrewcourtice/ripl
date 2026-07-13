/**
 * The canonical list of charts rendered in the visual gallery. Imported by both `gallery.ts`
 * (to render each chart) and `charts.spec.ts` (to snapshot each one) so the two never drift.
 */
export const CHART_IDS = [
    'bar',
    'line',
    'area',
    'scatter',
    'pie',
    'chord',
    'funnel',
    'gantt',
    'gauge',
    'heatmap',
    'histogram',
    'polar-area',
    'polar-scatter',
    'radial-bar',
    'packed-circle',
    'force-directed',
    'arc-diagram',
    'radar',
    'realtime',
    'sankey',
    'stock',
    'sunburst',
    'treemap',
    'trend',
] as const;

export type ChartId = typeof CHART_IDS[number];
