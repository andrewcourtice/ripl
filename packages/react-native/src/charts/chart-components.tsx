import {
    createAreaChart,
    createBarChart,
    createLineChart,
    createPieChart,
    createScatterChart,
} from '@ripl/charts';

import type {
    AreaChartOptions,
    BarChartOptions,
    LineChartOptions,
    PieChartOptions,
    ScatterChartOptions,
} from '@ripl/charts';

import {
    createChartComponent,
} from './create-chart-component';

/**
 * React Native area chart. Pass the chart's options (`data`, `series`, `key`, …) via the `options`
 * prop. For chart types without a dedicated component, use {@link createChartComponent}.
 */
export const AreaChart = createChartComponent<AreaChartOptions, ReturnType<typeof createAreaChart>>(createAreaChart);

/** React Native bar chart. Pass the chart's options (`data`, `series`, `key`, …) via the `options` prop. */
export const BarChart = createChartComponent<BarChartOptions, ReturnType<typeof createBarChart>>(createBarChart);

/** React Native line chart. Pass the chart's options (`data`, `series`, `key`, …) via the `options` prop. */
export const LineChart = createChartComponent<LineChartOptions, ReturnType<typeof createLineChart>>(createLineChart);

/** React Native pie chart. Pass the chart's options (`data`, `value`, `key`, …) via the `options` prop. */
export const PieChart = createChartComponent<PieChartOptions, ReturnType<typeof createPieChart>>(createPieChart);

/** React Native scatter chart. Pass the chart's options (`data`, `series`, …) via the `options` prop. */
export const ScatterChart = createChartComponent<ScatterChartOptions, ReturnType<typeof createScatterChart>>(createScatterChart);
