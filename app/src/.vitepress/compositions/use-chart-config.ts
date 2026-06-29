import {
    reactive,
} from 'vue';

import type {
    LegendPosition,
} from '@ripl/charts';

/**
 * The default Ripl chart colour palette (mirrors `COLOURS` in `@ripl/charts`, which is not
 * re-exported from the package entry point). Used to seed the per-series colour pickers so they
 * start on the same colours the chart picks automatically.
 */
export const CHART_PALETTE = [
    '#7cacf8',
    '#6dd5b1',
    '#b197fc',
    '#f7c97e',
    '#f4a0b9',
    '#6ec6d6',
    '#f5b07a',
    '#9daaf2',
    '#b0d98a',
    '#d9a0e8',
    '#7dd3e8',
    '#a1afc4',
];

/** Returns a colour from the default palette for the given index (cycling). */
export function paletteColor(index: number): string {
    return CHART_PALETTE[index % CHART_PALETTE.length];
}

/** Seeds a colour map from an ordered list of ids using the default palette. */
export function seedColors(ids: string[]): Record<string, string> {
    return ids.reduce<Record<string, string>>((output, id, index) => {
        output[id] = paletteColor(index);
        return output;
    }, {});
}

/** Which common feature controls a chart demo exposes in its config drawer. */
export interface ChartConfigFeatures {
    title?: boolean;
    legend?: boolean;
    axes?: boolean;
    grid?: boolean;
    animation?: boolean;
}

/** Initial values for the shared chart config. */
export interface ChartConfigDefaults {
    features?: ChartConfigFeatures;
    title?: string;
    titleVisible?: boolean;
    legendVisible?: boolean;
    legendPosition?: LegendPosition;
    axesVisible?: boolean;
    axisX?: string;
    axisY?: string;
    gridVisible?: boolean;
    animationEnabled?: boolean;
    colors?: Record<string, string>;
}

/** The reactive shape returned by {@link useChartConfig}. */
export interface ChartConfig {
    features: Required<ChartConfigFeatures>;
    title: string;
    titleVisible: boolean;
    legendVisible: boolean;
    legendPosition: LegendPosition;
    axesVisible: boolean;
    axisX: string;
    axisY: string;
    gridVisible: boolean;
    animationEnabled: boolean;
    colors: Record<string, string>;
}

/**
 * Creates a reactive config object backing a chart demo's customization drawer. Pair it with
 * {@link buildCommonOptions} to translate the config into chart options, and a deep `watch` that
 * calls `chart.update(...)` whenever the config changes.
 */
export function useChartConfig(defaults: ChartConfigDefaults = {}): ChartConfig {
    const features = defaults.features ?? {};

    return reactive<ChartConfig>({
        features: {
            title: features.title ?? false,
            legend: features.legend ?? false,
            axes: features.axes ?? false,
            grid: features.grid ?? false,
            animation: features.animation ?? true,
        },
        title: defaults.title ?? '',
        titleVisible: defaults.titleVisible ?? !!defaults.title,
        legendVisible: defaults.legendVisible ?? true,
        legendPosition: defaults.legendPosition ?? 'top',
        axesVisible: defaults.axesVisible ?? true,
        axisX: defaults.axisX ?? '',
        axisY: defaults.axisY ?? '',
        gridVisible: defaults.gridVisible ?? true,
        animationEnabled: defaults.animationEnabled ?? true,
        colors: {
            ...(defaults.colors ?? {}),
        },
    });
}

/**
 * Maps a {@link ChartConfig} into a partial chart options object covering the common, cross-chart
 * properties (title, legend, axes, grid, animation). Only the features the demo enabled are
 * emitted, so it can be spread into any chart's options or `chart.update(...)`. Per-series colours
 * are intentionally left out — series shape varies per chart, so demos merge `config.colors`
 * into their own series factory.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function buildCommonOptions(config: ChartConfig): Record<string, any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const options: Record<string, any> = {};
    const { features } = config;

    if (features.title) {
        options.title = {
            text: config.title,
            visible: config.titleVisible,
        };
    }

    if (features.legend) {
        options.legend = config.legendVisible
            ? {
                visible: true,
                position: config.legendPosition,
            }
            : false;
    }

    if (features.axes) {
        options.axis = {
            x: {
                visible: config.axesVisible,
                title: config.axisX || undefined,
            },
            y: {
                visible: config.axesVisible,
                title: config.axisY || undefined,
            },
        };
    }

    if (features.grid) {
        options.grid = config.gridVisible;
    }

    if (features.animation) {
        options.animation = config.animationEnabled;
    }

    return options;
}
