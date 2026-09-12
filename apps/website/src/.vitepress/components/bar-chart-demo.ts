import {
    numberFormat,
    numberMaxOf,
} from '@ripl/utilities';

import {
    scaleBand,
    scaleContinuous,
} from '@ripl/web';

/** One month's revenue. */
export interface BarChartDatum {
    /** The month the figure is for. */
    month: string;
    /** Revenue for the month. */
    value: number;
}

/** The surface the chart is drawn on. */
export interface BarChartSize {
    /** Surface width in pixels. */
    width: number;
    /** Surface height in pixels. */
    height: number;
}

/** The rectangle the plot is drawn into, inside the margins. */
export interface BarChartPlot {
    /** Left edge in pixels. */
    x: number;
    /** Top edge in pixels. */
    y: number;
    /** Plot width in pixels. */
    width: number;
    /** Plot height in pixels. */
    height: number;
}

/** One gridline and its axis label. */
export interface BarChartTick {
    /** The value the tick sits at. */
    value: number;
    /** The tick's y position in pixels. */
    y: number;
    /** The value formatted for the axis. */
    label: string;
}

/** One bar and the label above it. */
export interface BarChartBar {
    /** The month, used as the element key. */
    key: string;
    /** Left edge in pixels. */
    x: number;
    /** Top edge in pixels. */
    y: number;
    /** Bar width in pixels. */
    width: number;
    /** Bar height in pixels. */
    height: number;
    /** The value formatted for the label above the bar. */
    valueLabel: string;
}

/** Everything the demos need to draw, derived from the data and the surface size. */
export interface BarChartLayout {
    /** The rectangle the plot is drawn into. */
    plot: BarChartPlot;
    /** The y position of the zero line. */
    baseline: number;
    /** The gridlines and their axis labels. */
    ticks: BarChartTick[];
    /** The bars and their labels. */
    bars: BarChartBar[];
}

/** The months the demo cycles through. */
export const MONTHS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
];

/** The space left around the plot for the axes and the labels above the bars. */
export const MARGIN = {
    top: 28,
    right: 16,
    bottom: 34,
    left: 44,
};

/** How many gridlines to aim for. */
export const TICK_COUNT = 5;

/** Rounds the top of each bar and leaves the base square. */
export const BAR_RADIUS = [4, 4, 0, 0];

/** The fewest months the demo will plot. */
export const MIN_BARS = 3;

/** The fill of a bar that is neither hovered nor selected. */
export const BAR_COLOR = '#3a86ff';

/** The fill of the bar under the pointer. */
export const HOVER_COLOR = '#5c9cff';

/** The fill of the selected bar. */
export const SELECTED_COLOR = '#ff006e';

// Mid-tones rather than `#666`: canvas colours do not follow the page theme, and these hold on both.
/** The colour of every label the chart draws. */
export const TEXT_COLOR = '#8b93a1';

/** The colour of the gridlines above the axis. */
export const GRID_COLOR = 'rgba(140, 150, 165, 0.35)';

/** The colour of the zero line. */
export const AXIS_COLOR = 'rgba(140, 150, 165, 0.55)';

/** The font of the axis and month labels. */
export const AXIS_FONT = '11px sans-serif';

/** The font of the value label above each bar. */
export const VALUE_FONT = '600 11px sans-serif';

/** How far left of the plot the axis labels sit. */
export const TICK_LABEL_OFFSET = 8;

/** How far above its bar a value label sits. */
export const VALUE_LABEL_OFFSET = 8;

/** How far below the plot the month labels sit. */
export const MONTH_LABEL_OFFSET = 10;

// Mirrors ANIMATION_REFERENCE in @ripl/charts, so the adapter demos move like the rest of Ripl.
/** How long a bar takes to grow in, and the span its stagger fans out over. */
export const ENTER_DURATION = 1000;

/** How long a bar takes to move to a new value. */
export const UPDATE_DURATION = 1000;

/** How long a bar takes to collapse out. */
export const EXIT_DURATION = 450;

/** How long the gridlines take to settle on a new scale. */
export const AXIS_DURATION = 500;

// `narrowSymbol`, or a non-US reader gets `US$7.4k`: the default currency display is locale-derived.
const COMPACT_CURRENCY = {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
    notation: 'compact',
    maximumFractionDigits: 1,
} as const;

const FULL_CURRENCY = {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
    maximumFractionDigits: 0,
} as const;

function randomValue(): number {
    return Math.round((2 + Math.random() * 14) * 1000);
}

/**
 * Builds a fresh series of the given length.
 *
 * @param count - How many months to generate.
 * @returns The generated months.
 */
export function createData(count: number): BarChartDatum[] {
    return MONTHS.slice(0, count).map(month => ({
        month,
        value: randomValue(),
    }));
}

/**
 * Gives every month a new value, keeping the series the same length.
 *
 * @param data - The current series.
 * @returns The re-rolled series.
 */
export function randomiseData(data: BarChartDatum[]): BarChartDatum[] {
    return data.map(item => ({
        ...item,
        value: randomValue(),
    }));
}

/**
 * Appends the next month, leaving the existing values alone.
 *
 * @param data - The current series.
 * @returns The extended series, or the original one once every month is plotted.
 */
export function addMonth(data: BarChartDatum[]): BarChartDatum[] {
    if (data.length >= MONTHS.length) {
        return data;
    }

    return [
        ...data,
        {
            month: MONTHS[data.length],
            value: randomValue(),
        },
    ];
}

/**
 * Drops the last month, leaving the remaining values alone.
 *
 * @param data - The current series.
 * @returns The shortened series, or the original one at the minimum length.
 */
export function removeMonth(data: BarChartDatum[]): BarChartDatum[] {
    return data.length <= MIN_BARS
        ? data
        : data.slice(0, -1);
}

/**
 * Formats a value for the label above a bar and for the axis.
 *
 * @param value - The value to format.
 * @returns The compact currency string, such as `$7.4K`.
 */
export function formatCompact(value: number): string {
    return numberFormat(value, COMPACT_CURRENCY);
}

/**
 * Formats a value for the readout under the chart.
 *
 * @param value - The value to format.
 * @returns The full currency string, such as `$7,400`.
 */
export function formatFull(value: number): string {
    return numberFormat(value, FULL_CURRENCY);
}

/**
 * Picks a bar's fill from its interaction state.
 *
 * @param month - The bar's month.
 * @param hovered - The month under the pointer, if any.
 * @param selected - The selected month, if any.
 * @returns The colour to fill the bar with.
 */
export function fillFor(month: string, hovered?: string, selected?: string): string {
    if (month === selected) {
        return SELECTED_COLOR;
    }

    return month === hovered
        ? HOVER_COLOR
        : BAR_COLOR;
}

/**
 * Derives the plot rectangle, the scales and every bar and tick from the data and the surface size.
 *
 * @param data - The months to plot.
 * @param size - The surface's current size.
 * @returns The layout, or `undefined` while the surface is too small to plot into.
 */
export function createBarLayout(data: BarChartDatum[], size: BarChartSize): BarChartLayout | undefined {
    const plot = {
        x: MARGIN.left,
        y: MARGIN.top,
        width: Math.max(0, size.width - MARGIN.left - MARGIN.right),
        height: Math.max(0, size.height - MARGIN.top - MARGIN.bottom),
    };

    if (plot.width <= 0 || plot.height <= 0) {
        return undefined;
    }

    // Bottom-to-top, because pixel y grows downward; that also puts `valueScale(0)` on the axis.
    const valueScale = scaleContinuous(
        [0, numberMaxOf(data, item => item.value)],
        [plot.y + plot.height, plot.y],
        { padToTicks: TICK_COUNT }
    );

    const categoryScale = scaleBand(
        data.map(item => item.month),
        [plot.x, plot.x + plot.width],
        {
            innerPadding: 0.28,
            outerPadding: 0.14,
        }
    );

    const baseline = valueScale(0);

    return {
        plot,
        baseline,
        ticks: valueScale.ticks(TICK_COUNT).map(value => ({
            value,
            y: valueScale(value),
            label: formatCompact(value),
        })),
        bars: data.map(item => ({
            key: item.month,
            x: categoryScale(item.month),
            width: categoryScale.bandwidth,
            y: valueScale(item.value),
            height: Math.max(0, baseline - valueScale(item.value)),
            valueLabel: formatCompact(item.value),
        })),
    };
}
