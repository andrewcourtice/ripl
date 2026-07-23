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

/** Registered theme names a chart demo can switch between. */
export type ChartConfigTheme = 'auto' | 'light' | 'dark' | 'colorblind';

/** Which axis a crosshair tracks. */
export type CrosshairAxisMode = 'x' | 'y' | 'both';

/** Value-axis scale families exposed by the axis controls. */
export type AxisScaleMode = 'linear' | 'log' | 'pow' | 'sqrt';

/** Preset value formatters selectable in the drawer (`'none'` leaves the chart default). */
export type ValueFormatKey = 'none' | 'number' | 'percentage' | 'date' | 'string';

/** Which common feature controls a chart demo exposes in its config drawer. */
export interface ChartConfigFeatures {
    title?: boolean;
    legend?: boolean;
    axes?: boolean;
    grid?: boolean;
    animation?: boolean;
    /** Exposes a pan/zoom navigator toggle (cartesian charts only). */
    navigator?: boolean;
    /** Exposes a tooltip visibility toggle. */
    tooltip?: boolean;
    /** Exposes crosshair visibility + tracked-axis controls (cartesian charts). */
    crosshair?: boolean;
    /** Exposes a data-label visibility toggle (bar/trend). */
    dataLabels?: boolean;
    /** Exposes a theme selector (light/dark/colourblind/auto). */
    theme?: boolean;
    /** Exposes a value-format preset selector, applied to the chart's `format`. */
    format?: boolean;
    /** Exposes enriched value-axis controls (scale/ticks/min/max/format) — numeric-Y charts. */
    axisScale?: boolean;
    /** Exposes a sample-annotations toggle (charts that render annotations). */
    annotations?: boolean;
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
    navigatorEnabled?: boolean;
    navigatorSensitivity?: number;
    tooltipVisible?: boolean;
    crosshairVisible?: boolean;
    crosshairAxis?: CrosshairAxisMode;
    dataLabelsVisible?: boolean;
    theme?: ChartConfigTheme;
    valueFormat?: ValueFormatKey;
    axisScale?: AxisScaleMode;
    axisTicks?: number;
    axisMin?: number;
    axisMax?: number;
    axisYFormat?: ValueFormatKey;
    annotationsVisible?: boolean;
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
    navigatorEnabled: boolean;
    navigatorSensitivity: number;
    tooltipVisible: boolean;
    crosshairVisible: boolean;
    crosshairAxis: CrosshairAxisMode;
    dataLabelsVisible: boolean;
    theme: ChartConfigTheme;
    valueFormat: ValueFormatKey;
    axisScale: AxisScaleMode;
    axisTicks: number;
    /** Explicit value-axis lower bound; `undefined` = auto. */
    axisMin: number | undefined;
    /** Explicit value-axis upper bound; `undefined` = auto. */
    axisMax: number | undefined;
    axisYFormat: ValueFormatKey;
    annotationsVisible: boolean;
    colors: Record<string, string>;
}

/** Remembers each config's resolved defaults so {@link resetChartConfig} can restore them. */
const CONFIG_DEFAULTS = new WeakMap<ChartConfig, ChartConfig>();

/** Deep-enough clone of a config's values (features + colours are the only nested objects). */
function snapshotConfig(config: ChartConfig): ChartConfig {
    return {
        ...config,
        features: {
            ...config.features,
        },
        colors: {
            ...config.colors,
        },
    };
}

/**
 * Creates a reactive config object backing a chart demo's customization drawer. Pair it with
 * {@link buildCommonOptions} to translate the config into chart options, and a deep `watch` that
 * calls `chart.update(...)` whenever the config changes — charts reconcile their furniture (title,
 * legend, axes, grid, tooltip, crosshair, theme, navigator) at runtime. The one shared exception is
 * `legendPosition`: legend orientation is fixed when the legend is created, so demos pair the
 * update watch with a chart rebuild when the position changes.
 */
export function useChartConfig(defaults: ChartConfigDefaults = {}): ChartConfig {
    const features = defaults.features ?? {};

    const config = reactive<ChartConfig>({
        features: {
            title: features.title ?? false,
            legend: features.legend ?? false,
            axes: features.axes ?? false,
            grid: features.grid ?? false,
            animation: features.animation ?? true,
            navigator: features.navigator ?? false,
            tooltip: features.tooltip ?? false,
            crosshair: features.crosshair ?? false,
            dataLabels: features.dataLabels ?? false,
            theme: features.theme ?? false,
            format: features.format ?? false,
            axisScale: features.axisScale ?? false,
            annotations: features.annotations ?? false,
        },
        title: defaults.title ?? '',
        titleVisible: defaults.titleVisible ?? !!defaults.title,
        legendVisible: defaults.legendVisible ?? true,
        legendPosition: defaults.legendPosition ?? 'bottom',
        axesVisible: defaults.axesVisible ?? true,
        axisX: defaults.axisX ?? '',
        axisY: defaults.axisY ?? '',
        gridVisible: defaults.gridVisible ?? true,
        animationEnabled: defaults.animationEnabled ?? true,
        navigatorEnabled: defaults.navigatorEnabled ?? false,
        navigatorSensitivity: defaults.navigatorSensitivity ?? 0.5,
        tooltipVisible: defaults.tooltipVisible ?? true,
        crosshairVisible: defaults.crosshairVisible ?? true,
        crosshairAxis: defaults.crosshairAxis ?? 'x',
        dataLabelsVisible: defaults.dataLabelsVisible ?? false,
        theme: defaults.theme ?? 'auto',
        valueFormat: defaults.valueFormat ?? 'none',
        axisScale: defaults.axisScale ?? 'linear',
        axisTicks: defaults.axisTicks ?? 10,
        axisMin: defaults.axisMin,
        axisMax: defaults.axisMax,
        axisYFormat: defaults.axisYFormat ?? 'none',
        annotationsVisible: defaults.annotationsVisible ?? false,
        colors: {
            ...(defaults.colors ?? {}),
        },
    });

    CONFIG_DEFAULTS.set(config, snapshotConfig(config));

    return config;
}

/**
 * Restores a config created by {@link useChartConfig} to the defaults it was created with. Backs
 * the drawer's "Reset" button; chart-specific state (managed by {@link useChartExtras}) is reset
 * separately.
 */
export function resetChartConfig(config: ChartConfig): void {
    const defaults = CONFIG_DEFAULTS.get(config);

    if (!defaults) {
        return;
    }

    Object.assign(config, snapshotConfig(defaults));
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const y: Record<string, any> = {
            visible: config.axesVisible,
            title: config.axisY || undefined,
        };

        // Enriched numeric value-axis controls (opt-in; only meaningful on a numeric Y).
        if (features.axisScale) {
            y.scale = config.axisScale;
            y.ticks = config.axisTicks;
            y.min = config.axisMin;
            y.max = config.axisMax;

            const axisFormat = resolveValueFormat(config.axisYFormat);

            if (axisFormat) {
                y.format = axisFormat;
            }
        }

        options.axis = {
            x: {
                visible: config.axesVisible,
                title: config.axisX || undefined,
            },
            y,
        };
    }

    if (features.grid) {
        options.grid = config.gridVisible;
    }

    if (features.tooltip) {
        options.tooltip = config.tooltipVisible;
    }

    if (features.crosshair) {
        options.crosshair = config.crosshairVisible
            ? {
                visible: true,
                axis: config.crosshairAxis,
            }
            : false;
    }

    if (features.dataLabels) {
        options.labels = config.dataLabelsVisible;
    }

    if (features.format) {
        // Always emit the key ('none' resolves to undefined) so `chart.update(...)` can clear a
        // previously applied preset back to the chart default. Demos with a bespoke default format
        // re-apply it over this when the key resolves to undefined.
        options.format = resolveValueFormat(config.valueFormat);
    }

    if (features.theme) {
        options.theme = config.theme;
    }

    if (features.animation) {
        options.animation = config.animationEnabled;
    }

    if (features.navigator) {
        // Emit both `overview` (the scrub-bar strip, on category-axis charts — inert elsewhere)
        // and `navigator` (in-plot pan/zoom, with the tuned sensitivity). `overview: true` implies
        // a navigator, but passing the object too keeps the sensitivity; `false` disables both.
        options.overview = config.navigatorEnabled;
        options.navigator = config.navigatorEnabled
            ? {
                zoom: {
                    sensitivity: config.navigatorSensitivity,
                },
                pan: true,
            }
            : false;
    }

    return options;
}

/**
 * Maps a {@link ValueFormatKey} to a chart `format` value. `'none'` resolves to `undefined` so the
 * caller can omit the option and keep the chart's own default; every other key is a built-in
 * `AxisFormatType` that passes straight through.
 */
export function resolveValueFormat(key: ValueFormatKey): Exclude<ValueFormatKey, 'none'> | undefined {
    return key === 'none' ? undefined : key;
}

/** A reactive bag of chart-specific demo controls plus a reset to their initial values. */
export interface ChartExtras<T extends object> {
    /** The reactive control values; bind these with `v-model` in the demo. */
    extras: T;
    /** Restores every control to the value it was created with. */
    reset: () => void;
}

/**
 * Creates a single reactive object for a demo's chart-specific controls, so the demo can bind
 * `v-model="extras.foo"` and use one `watch([config, extras], apply, { deep: true })` instead of a
 * ref per control. Pass `reset` to `RiplChartConfig`'s `extras-reset` prop so the drawer's Reset
 * button clears shared and chart-specific state together.
 *
 * @typeParam T - The shape of the chart-specific controls (flat object of primitives).
 * @param defaults - Initial control values; also the values `reset()` restores.
 */
export function useChartExtras<T extends object>(defaults: T): ChartExtras<T> {
    const initial = {
        ...defaults,
    };
    const extras = reactive(defaults) as T;

    return {
        extras,
        reset() {
            Object.assign(extras, initial);
        },
    };
}
