import {
    getDefaultTheme,
} from './theme';

import type {
    Ease,
} from '@ripl/core';

import {
    easeInCubic,
    easeInOutCubic,
    easeInOutQuad,
    easeInOutQuart,
    easeInOutQuint,
    easeInQuad,
    easeInQuart,
    easeInQuint,
    easeLinear,
    easeOutCubic,
    easeOutQuad,
    easeOutQuart,
    easeOutQuint,
} from '@ripl/core';

import type {
    NumberFormatOptions,
} from '@ripl/utilities';

import {
    numberFormat,
    typeIsBoolean,
    typeIsString,
} from '@ripl/utilities';

// ---------------------------------------------------------------------------
// Ease
// ---------------------------------------------------------------------------

/** Named easing function identifiers. */
export type EaseName =
    | 'easeLinear'
    | 'easeInQuad'
    | 'easeOutQuad'
    | 'easeInOutQuad'
    | 'easeInCubic'
    | 'easeOutCubic'
    | 'easeInOutCubic'
    | 'easeInQuart'
    | 'easeOutQuart'
    | 'easeInOutQuart'
    | 'easeInQuint'
    | 'easeOutQuint'
    | 'easeInOutQuint';

const EASE_MAP: Record<EaseName, Ease> = {
    easeLinear,
    easeInQuad,
    easeOutQuad,
    easeInOutQuad,
    easeInCubic,
    easeOutCubic,
    easeInOutCubic,
    easeInQuart,
    easeOutQuart,
    easeInOutQuart,
    easeInQuint,
    easeOutQuint,
    easeInOutQuint,
};

/** Resolves an ease name or function to an `Ease` function, defaulting to `easeOutCubic`. */
export function resolveEase(value?: EaseName | Ease): Ease {
    if (!value) {
        return easeOutCubic;
    }

    if (typeIsString(value)) {
        return EASE_MAP[value as EaseName] ?? easeOutCubic;
    }

    return value;
}

// ---------------------------------------------------------------------------
// Padding helper
// ---------------------------------------------------------------------------

/** Padding expressed as a uniform number or a [top, right, bottom, left] tuple. */
export type PaddingInput = number | [number, number, number, number];

/** Resolved padding with explicit top, right, bottom, and left values. */
export interface Padding {
    /** Top padding, in pixels. */
    top: number;
    /** Right padding, in pixels. */
    right: number;
    /** Bottom padding, in pixels. */
    bottom: number;
    /** Left padding, in pixels. */
    left: number;
}

/** Normalizes a padding input into a `Padding` object, or returns `undefined` if no input. */
export function normalizePadding(value?: PaddingInput): Padding | undefined {
    if (value === undefined) {
        return undefined;
    }

    if (typeof value === 'number') {
        return {
            top: value,
            right: value,
            bottom: value,
            left: value,
        };
    }

    return {
        top: value[0],
        right: value[1],
        bottom: value[2],
        left: value[3],
    };
}

// ---------------------------------------------------------------------------
// Title
// ---------------------------------------------------------------------------

/** Position of the chart title relative to the chart area. */
export type TitlePosition = 'top' | 'bottom' | 'left' | 'right';

/** Fully resolved chart title options. */
export interface ChartTitleOptions {
    /** Whether the title is rendered. */
    visible: boolean;
    /** The title text to display. */
    text: string;
    /** Space around the title text, uniform or per-edge, in pixels. */
    padding: PaddingInput;
    /** CSS font shorthand for the title text. */
    font: string;
    /** Colour of the title text. */
    fontColor: string;
    /** Which side of the chart the title occupies. */
    position: TitlePosition;
}

/** Title input accepting a plain string or partial options object. */
export type ChartTitleInput = string | Partial<ChartTitleOptions>;

const TITLE_DEFAULTS: ChartTitleOptions = {
    visible: true,
    text: '',
    padding: 16,
    font: 'bold 16px sans-serif',
    fontColor: '#333333',
    position: 'top',
};

/** Normalizes a title input into fully resolved `ChartTitleOptions`. */
export function normalizeTitle(input?: ChartTitleInput): ChartTitleOptions | undefined {
    if (input === undefined) {
        return undefined;
    }

    const theme = getDefaultTheme();

    if (typeIsString(input)) {
        return {
            ...TITLE_DEFAULTS,
            fontColor: theme.textColor,
            text: input,
        };
    }

    return {
        ...TITLE_DEFAULTS,
        fontColor: theme.textColor,
        ...input,
    };
}

// ---------------------------------------------------------------------------
// Animation
// ---------------------------------------------------------------------------

/** Fully resolved chart animation options. */
export interface ChartAnimationOptions {
    /** Whether entry/update/exit transitions are animated. */
    enabled: boolean;
    /** Base animation duration in milliseconds; scales every transition kind. */
    duration: number;
    /** Easing applied to transitions, as a named ease or a custom easing function. */
    ease: EaseName | Ease;
}

/** Animation input accepting a boolean toggle or partial options object. */
export type ChartAnimationInput = boolean | Partial<ChartAnimationOptions>;

const ANIMATION_DEFAULTS: ChartAnimationOptions = {
    enabled: true,
    duration: 1000,
    ease: 'easeOutCubic',
};

/** Normalizes animation input into fully resolved `ChartAnimationOptions`. */
export function normalizeAnimation(input?: ChartAnimationInput, defaults?: Partial<ChartAnimationOptions>): ChartAnimationOptions {
    const base = {
        ...ANIMATION_DEFAULTS,
        ...defaults,
    };

    if (input === undefined) {
        return { ...base };
    }

    if (typeIsBoolean(input)) {
        return {
            ...base,
            enabled: input,
        };
    }

    return {
        ...base,
        ...input,
    };
}

// ---------------------------------------------------------------------------
// Grid
// ---------------------------------------------------------------------------

/** Fully resolved chart grid options. */
export interface ChartGridOptions {
    /** Whether grid lines are drawn. */
    visible: boolean;
    /** Stroke colour of the grid lines. */
    lineColor: string;
    /** Stroke width of the grid lines, in pixels. */
    lineWidth: number;
    /** Canvas dash pattern for the grid lines (`[]` renders a solid line). */
    lineDash: number[];
}

/** Grid input accepting a boolean toggle or partial options object. */
export type ChartGridInput = boolean | Partial<ChartGridOptions>;

const GRID_DEFAULTS: ChartGridOptions = {
    visible: true,
    lineColor: '#e5e7eb',
    lineWidth: 1,
    lineDash: [4, 4],
};

/** Normalizes grid input into fully resolved `ChartGridOptions`. */
export function normalizeGrid(input?: ChartGridInput, defaults?: Partial<ChartGridOptions>): ChartGridOptions {
    const base = {
        ...GRID_DEFAULTS,
        lineColor: getDefaultTheme().gridColor,
        ...defaults,
    };

    if (input === undefined) {
        return { ...base };
    }

    if (typeIsBoolean(input)) {
        return {
            ...base,
            visible: input,
        };
    }

    return {
        ...base,
        ...input,
    };
}

// ---------------------------------------------------------------------------
// Crosshair
// ---------------------------------------------------------------------------

/** Which axis the crosshair tracks. */
export type CrosshairAxis = 'x' | 'y' | 'both';

/** Fully resolved chart crosshair options. */
export interface ChartCrosshairOptions {
    /** Whether the crosshair is shown while hovering the plot. */
    visible: boolean;
    /** Which axis (or both) the crosshair tracks. */
    axis: CrosshairAxis;
    /** Stroke colour of the crosshair lines. */
    lineColor: string;
    /** Stroke width of the crosshair lines, in pixels. */
    lineWidth: number;
}

/** Crosshair input accepting a boolean toggle or partial options object. */
export type ChartCrosshairInput = boolean | Partial<ChartCrosshairOptions>;

const CROSSHAIR_DEFAULTS: ChartCrosshairOptions = {
    visible: true,
    axis: 'x',
    lineColor: '#94a3b8',
    lineWidth: 1,
};

/** Normalizes crosshair input into fully resolved `ChartCrosshairOptions`. */
export function normalizeCrosshair(input?: ChartCrosshairInput, defaults?: Partial<ChartCrosshairOptions>): ChartCrosshairOptions {
    const base = {
        ...CROSSHAIR_DEFAULTS,
        lineColor: getDefaultTheme().crosshairColor,
        ...defaults,
    };

    if (input === undefined) {
        return { ...base };
    }

    if (typeIsBoolean(input)) {
        return {
            ...base,
            visible: input,
        };
    }

    return {
        ...base,
        ...input,
    };
}

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

/** Border radius expressed as a uniform number or a per-corner tuple. */
export type BorderRadiusInput = number | [number, number, number, number];

/** What causes a tooltip to show. */
export type ChartTooltipTrigger = 'item' | 'axis';

/** Fully resolved chart tooltip options. */
export interface ChartTooltipOptions {
    /** Whether tooltips are shown on hover. */
    visible: boolean;
    /** What triggers the tooltip: `'item'` (default) shows it when hovering an individual mark; `'axis'` shows a shared tooltip listing every active series' value at the hovered category (cartesian charts). */
    trigger: ChartTooltipTrigger;
    /** Inner padding between the tooltip text and its box, in pixels. */
    padding: PaddingInput;
    /** CSS font shorthand for the tooltip text. */
    font: string;
    /** Colour of the tooltip text. */
    fontColor: string;
    /** Fill colour of the tooltip box. */
    backgroundColor: string;
    /** Corner radius of the tooltip box, uniform or per-corner. */
    borderRadius: BorderRadiusInput;
    /** Maximum tooltip width before content wraps, in pixels. */
    maxWidth: number;
    /** Whether long content wraps onto multiple lines. */
    wrap: boolean;
}

/** Tooltip input accepting a boolean toggle or partial options object. */
export type ChartTooltipInput = boolean | Partial<ChartTooltipOptions>;

const TOOLTIP_DEFAULTS: ChartTooltipOptions = {
    visible: true,
    trigger: 'item',
    padding: 8,
    font: '12px sans-serif',
    fontColor: '#FFFFFF',
    backgroundColor: '#1a1a1a',
    borderRadius: 6,
    maxWidth: 200,
    wrap: false,
};

/** Normalizes tooltip input into fully resolved `ChartTooltipOptions`. */
export function normalizeTooltip(input?: ChartTooltipInput, defaults?: Partial<ChartTooltipOptions>): ChartTooltipOptions {
    const theme = getDefaultTheme();

    const base = {
        ...TOOLTIP_DEFAULTS,
        fontColor: theme.tooltipColor,
        backgroundColor: theme.tooltipBackground,
        ...defaults,
    };

    if (input === undefined) {
        return { ...base };
    }

    if (typeIsBoolean(input)) {
        return {
            ...base,
            visible: input,
        };
    }

    return {
        ...base,
        ...input,
    };
}

// ---------------------------------------------------------------------------
// Legend
// ---------------------------------------------------------------------------

/** Position of the chart legend relative to the chart area. */
export type LegendPosition = 'top' | 'bottom' | 'left' | 'right';

/** Fully resolved chart legend options. */
export interface ChartLegendOptions {
    /** Whether the legend is rendered. */
    visible: boolean;
    /** Which side of the chart the legend occupies. */
    position: LegendPosition;
    /** Space around the legend, uniform or per-edge, in pixels. */
    padding: PaddingInput;
    /** CSS font shorthand for the legend labels. */
    font: string;
    /** Colour of the legend labels. */
    fontColor: string;
    /** Whether hovering a legend entry highlights its series and clicking toggles its visibility. */
    highlight: boolean;
}

/** Legend input accepting a boolean, position string, or partial options object. */
export type ChartLegendInput = boolean | LegendPosition | Partial<ChartLegendOptions>;

const LEGEND_DEFAULTS: ChartLegendOptions = {
    visible: true,
    position: 'bottom',
    padding: 16,
    font: '11px sans-serif',
    fontColor: '#333333',
    highlight: true,
};

/** Normalizes legend input into fully resolved `ChartLegendOptions`. */
export function normalizeLegend(input?: ChartLegendInput, defaults?: Partial<ChartLegendOptions>): ChartLegendOptions {
    const base = {
        ...LEGEND_DEFAULTS,
        fontColor: getDefaultTheme().legendColor,
        ...defaults,
    };

    if (input === undefined) {
        return {
            ...base,
            visible: defaults?.visible ?? false,
        };
    }

    if (typeIsBoolean(input)) {
        return {
            ...base,
            visible: input,
        };
    }

    if (typeIsString(input)) {
        return {
            ...base,
            position: input as LegendPosition,
        };
    }

    return {
        ...base,
        ...input,
    };
}

// ---------------------------------------------------------------------------
// Axis
// ---------------------------------------------------------------------------

/** Built-in axis label format types. */
export type AxisFormatType = 'number' | 'percentage' | 'date' | 'string';

/** The scale family an axis maps its domain through. Value axes accept `'linear'`/`'log'`/`'pow'`/`'sqrt'`; category and time axes are selected by the chart. */
export type AxisScaleType = 'linear' | 'log' | 'pow' | 'sqrt' | 'time' | 'band' | 'point';

/** Options for a single axis (x or y). */
// `TData` is retained for symmetry across the axis option family (ChartYAxisItemOptions, ChartAxisInput, etc.).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface ChartAxisItemOptions<TData = unknown> {
    /** Whether the axis line, ticks, and labels are rendered. */
    visible: boolean;
    /** CSS font shorthand for the tick labels. */
    font: string;
    /** Colour of the tick labels. */
    fontColor: string;
    /** Optional axis title drawn alongside the tick labels. */
    title?: string;
    /** How tick values are formatted — a built-in {@link AxisFormatType}, an Intl number-format options object, or a custom formatter. */
    format?: ValueFormatInput;
    /** Scale family for this axis. Value axes default to `'linear'`. See {@link AxisScaleType}. */
    scale?: AxisScaleType;
    /** Expands the value domain to round, tick-aligned bounds. `true` (default) nices to the tick count, a number nices to that many segments, `false` disables it. */
    nice?: boolean | number;
    /** Target number of ticks and grid lines along the axis. Defaults to 10. */
    ticks?: number;
    /** Tick label rotation in degrees — positive tilts labels counterclockwise (like `rotate(45)` slanting labels up to the right). Applied to the x-axis; the label band grows to fit and fewer labels are dropped on overflow. */
    labelRotation?: number;
    /** Explicit lower bound of the value domain (overrides the data extent). */
    min?: number;
    /** Explicit upper bound of the value domain (overrides the data extent). */
    max?: number;
    /** Logarithm base for a `'log'` scale. Defaults to 10. */
    base?: number;
    /** Exponent for a `'pow'` scale. Defaults to 1. */
    exponent?: number;
}

/** Y-axis specific options extending the base axis item with a left/right position. */
export interface ChartYAxisItemOptions<TData = unknown> extends ChartAxisItemOptions<TData> {
    /** Which side of the chart the y-axis is drawn on. */
    position: 'left' | 'right';
    /** Stable identifier a series can bind to via its `axis` option. Defaults to the axis index. */
    id?: string;
}

/** Combined x and y axis configuration. */
export interface ChartAxisOptions<TData = unknown> {
    /** X-axis configuration, or a boolean toggling its visibility. */
    x?: boolean | Partial<ChartAxisItemOptions<TData>>;
    /** Y-axis configuration (an array configures multiple y-axes), or a boolean toggling visibility. */
    y?: boolean | Partial<ChartYAxisItemOptions<TData>> | Partial<ChartYAxisItemOptions<TData>>[];
}

/** Axis input accepting a boolean toggle or a full axis options object. */
export type ChartAxisInput<TData = unknown> = boolean | ChartAxisOptions<TData>;

const AXIS_ITEM_DEFAULTS: ChartAxisItemOptions = {
    visible: true,
    font: '12px sans-serif',
    fontColor: '#777777',
};

const Y_AXIS_ITEM_DEFAULTS: ChartYAxisItemOptions = {
    ...AXIS_ITEM_DEFAULTS,
    position: 'left',
};

/** Normalizes a single axis item input into fully resolved options. */
export function normalizeAxisItem<TData = unknown>(
    input?: boolean | Partial<ChartAxisItemOptions<TData>>,
    defaults?: Partial<ChartAxisItemOptions<TData>>
): ChartAxisItemOptions<TData> {
    const theme = getDefaultTheme();

    const base = {
        ...AXIS_ITEM_DEFAULTS,
        font: theme.font,
        fontColor: theme.axisColor,
        ...defaults,
    };

    if (input === undefined) {
        return { ...base } as ChartAxisItemOptions<TData>;
    }

    if (typeIsBoolean(input)) {
        return {
            ...base,
            visible: input,
        } as ChartAxisItemOptions<TData>;
    }

    return {
        ...base,
        ...input,
    } as ChartAxisItemOptions<TData>;
}

/** Normalizes a Y-axis item input into fully resolved options with position. */
export function normalizeYAxisItem<TData = unknown>(
    input?: boolean | Partial<ChartYAxisItemOptions<TData>>,
    defaults?: Partial<ChartYAxisItemOptions<TData>>
): ChartYAxisItemOptions<TData> {
    const theme = getDefaultTheme();

    const base = {
        ...Y_AXIS_ITEM_DEFAULTS,
        font: theme.font,
        fontColor: theme.axisColor,
        ...defaults,
    };

    if (input === undefined) {
        return { ...base } as ChartYAxisItemOptions<TData>;
    }

    if (typeIsBoolean(input)) {
        return {
            ...base,
            visible: input,
        } as ChartYAxisItemOptions<TData>;
    }

    return {
        ...base,
        ...input,
    } as ChartYAxisItemOptions<TData>;
}

/** Normalizes axis input into a full `ChartAxisOptions` object with both x and y. */
export function normalizeAxis<TData = unknown>(input?: ChartAxisInput<TData>): ChartAxisOptions<TData> {
    // Return minimal partials (no colours) so the per-item normalizers apply the active theme's
    // colours; pre-filling here would shadow the theme for the default/boolean cases.
    if (input === undefined) {
        return {
            x: {},
            y: {},
        };
    }

    if (typeIsBoolean(input)) {
        return {
            x: { visible: input },
            y: { visible: input },
        };
    }

    return input;
}

// ---------------------------------------------------------------------------
// Value format
// ---------------------------------------------------------------------------

/**
 * A value formatter accepted anywhere a chart renders a raw value as text (tooltips, data
 * labels, pie segment labels, axis ticks). Either a built-in {@link AxisFormatType}, an Intl
 * number-format options object (e.g. `{ style: 'currency', currency: 'USD' }`), or a custom callback.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ValueFormatInput = AxisFormatType | NumberFormatOptions | ((value: any) => string);

const TIME_SPAN_DAY = 24 * 60 * 60 * 1000;
const TIME_SPAN_MONTH = 30 * TIME_SPAN_DAY;
const TIME_SPAN_YEAR = 365 * TIME_SPAN_DAY;

/**
 * Formats a time-axis tick for display, adapting the format to the domain span — multi-year spans
 * show the year, month-scale spans show abbreviated month and year, day-scale spans show dates,
 * and anything shorter shows times. An explicit axis `format` always wins over this default.
 *
 * @param value - The tick's date value.
 * @param spanMs - The axis domain span in milliseconds.
 * @returns The formatted label.
 */
export function formatTimeLabel(value: Date, spanMs: number): string {
    if (spanMs >= TIME_SPAN_YEAR * 3) {
        return String(value.getFullYear());
    }

    if (spanMs >= TIME_SPAN_MONTH * 2) {
        return value.toLocaleDateString(undefined, {
            month: 'short',
            year: 'numeric',
        });
    }

    if (spanMs >= TIME_SPAN_DAY * 2) {
        return value.toLocaleDateString();
    }

    return value.toLocaleTimeString();
}

/**
 * Resolves a value formatter into a function, always returning a usable formatter (falling back
 * to `String` when no custom format is supplied). Convenience wrapper over {@link resolveFormatLabel}
 * for the value-as-text sites that always need to print something.
 */
export function resolveValueFormat(format?: ValueFormatInput): (value: unknown) => string {
    const resolved = resolveFormatLabel(format);
    // Fall back to the shared precision-capped number formatter (rather than raw `String`) so
    // untyped numeric values still respect the default 2-decimal cap.
    return resolved ?? (value => numberFormat(value, { precision: 2 }));
}

// ---------------------------------------------------------------------------
// Line style (dash pattern)
// ---------------------------------------------------------------------------

/** How a series line is stroked: a preset, or a custom canvas dash array. */
export type LineStyle = 'solid' | 'dashed' | 'dotted' | number[];

/** Dash arrays for the named line-style presets (`solid` is the implicit `[]` default). */
const LINE_DASH_PRESETS: Record<string, number[]> = {
    dashed: [6, 4],
    dotted: [2, 3],
};

/** Resolves a {@link LineStyle} into a `lineDash` array (`[]` for a solid line). */
export function resolveLineDash(style?: LineStyle): number[] {
    if (Array.isArray(style)) {
        return style;
    }

    return (style && LINE_DASH_PRESETS[style]) ?? [];
}

// ---------------------------------------------------------------------------
// Data labels
// ---------------------------------------------------------------------------

/** Where a data label is anchored relative to its marker/bar. */
export type LabelAnchor = 'top' | 'left' | 'bottom' | 'right';

/** Fully resolved data label options. */
export interface ChartDataLabelsOptions {
    /** Whether data labels are drawn. */
    visible: boolean;
    /** Which side of each marker/bar the label sits on. */
    anchor: LabelAnchor;
    /** CSS font shorthand for the label text. */
    font: string;
    /** Colour of the label text. */
    fontColor: string;
}

/**
 * Data label input: a boolean toggle, a {@link LabelAnchor} string selecting where labels sit,
 * or a partial options object.
 */
export type ChartDataLabelsInput = boolean | LabelAnchor | Partial<ChartDataLabelsOptions>;

const DATA_LABELS_DEFAULTS: ChartDataLabelsOptions = {
    visible: false,
    anchor: 'top',
    font: '11px sans-serif',
    fontColor: '#555555',
};

const LABEL_ANCHORS: LabelAnchor[] = ['top', 'left', 'bottom', 'right'];

/** Normalizes a data label input into fully resolved `ChartDataLabelsOptions`. */
export function normalizeDataLabels(input?: ChartDataLabelsInput, defaults?: Partial<ChartDataLabelsOptions>): ChartDataLabelsOptions {
    const base = {
        ...DATA_LABELS_DEFAULTS,
        fontColor: getDefaultTheme().textColor,
        ...defaults,
    };

    if (input === undefined) {
        return { ...base };
    }

    if (typeIsBoolean(input)) {
        return {
            ...base,
            visible: input,
        };
    }

    if (typeIsString(input) && LABEL_ANCHORS.includes(input as LabelAnchor)) {
        return {
            ...base,
            visible: true,
            anchor: input as LabelAnchor,
        };
    }

    return {
        ...base,
        visible: true,
        ...(input as Partial<ChartDataLabelsOptions>),
    };
}

// ---------------------------------------------------------------------------
// Segment labels (radial charts: pie, polar-area)
// ---------------------------------------------------------------------------

/** Where a radial segment label sits: inside the segment, or outside with a leader line. */
export type SegmentLabelPosition = 'inside' | 'outside';

/** Fully resolved segment-label options for radial charts. */
export interface ChartSegmentLabelsOptions {
    /** Whether segment labels are drawn. */
    visible: boolean;
    /** Whether labels sit inside each segment or outside with a leader line. */
    position: SegmentLabelPosition;
    /** Label font; when omitted the shared segment-label font is used. */
    font?: string;
    /** Label colour; when omitted a sensible default is chosen for the position. */
    fontColor?: string;
}

/**
 * Segment-label input: a boolean toggle, a {@link SegmentLabelPosition} string (which also enables
 * labels), or a partial options object.
 */
export type ChartSegmentLabelsInput = boolean | SegmentLabelPosition | Partial<ChartSegmentLabelsOptions>;

const SEGMENT_LABELS_DEFAULTS: ChartSegmentLabelsOptions = {
    // Hidden by default — the legend is shown by default, so on-segment labels are opt-in.
    visible: false,
    position: 'inside',
};

const SEGMENT_LABEL_POSITIONS: SegmentLabelPosition[] = ['inside', 'outside'];

/** Normalizes a segment-label input into fully resolved {@link ChartSegmentLabelsOptions}. */
export function normalizeSegmentLabels(input?: ChartSegmentLabelsInput, defaults?: Partial<ChartSegmentLabelsOptions>): ChartSegmentLabelsOptions {
    const base = {
        ...SEGMENT_LABELS_DEFAULTS,
        ...defaults,
    };

    if (input === undefined) {
        return { ...base };
    }

    if (typeIsBoolean(input)) {
        return {
            ...base,
            visible: input,
        };
    }

    if (typeIsString(input) && SEGMENT_LABEL_POSITIONS.includes(input as SegmentLabelPosition)) {
        return {
            ...base,
            visible: true,
            position: input as SegmentLabelPosition,
        };
    }

    return {
        ...base,
        visible: true,
        ...(input as Partial<ChartSegmentLabelsOptions>),
    };
}

// ---------------------------------------------------------------------------
// Format helper
// ---------------------------------------------------------------------------


/** Built-in value formatters keyed by {@link AxisFormatType}. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const VALUE_FORMATTERS: Record<AxisFormatType, (value: any) => string> = {
    number: (value: number) => numberFormat(value, { precision: 2 }),
    percentage: (value: number) => numberFormat(value, {
        style: 'percent',
        maximumFractionDigits: 2,
    }),
    date: (value: Date | number) => new Date(value).toLocaleDateString(),
    string: (value: unknown) => String(value),
};

/**
 * Resolves a {@link ValueFormatInput} into a label formatting function. A built-in
 * {@link AxisFormatType} maps to a preset formatter, an Intl number-format options object binds
 * {@link numberFormat} to those options, and a function is returned as-is.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resolveFormatLabel(format?: ValueFormatInput): ((value: any) => string) | undefined {
    if (!format) {
        return undefined;
    }

    if (typeof format === 'function') {
        return format;
    }

    if (typeof format === 'string') {
        return VALUE_FORMATTERS[format];
    }

    return value => numberFormat(value, format);
}
