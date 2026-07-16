/**
 * Shared context and series shapes for the series-renderer layer.
 *
 * A {@link SeriesRenderContext} bundles everything a series renderer needs from its host chart —
 * the resolved scales, plot rectangle, colour lookup, animation resolver, tooltip, formatter, and
 * the callbacks for adding marks and emitting interaction events — so that the line/area/bar
 * geometry can be shared verbatim between the standalone charts and the mixed trend chart. Each
 * renderer widens the context with the extra inputs its geometry needs (an x point scale for
 * line/area, a category band scale for bars).
 */

import type {
    NumericAccessor,
} from '../data';

import type {
    ResolvedAnimation,
} from '../animation';

import type {
    ChartArea,
} from '../layout';

import type {
    ChartDataLabelsOptions,
    LineStyle,
} from '../options';

import type {
    Tooltip,
} from '../../components/tooltip';

import type {
    BandScale,
    Element,
    PolylineRenderer,
    Scale,
    Renderer,
} from '@ripl/core';

import type {
    OneOrMore,
} from '@ripl/utilities';

/** Which phase of a pointer interaction produced a series event. */
export type SeriesEventPhase = 'enter' | 'leave' | 'click';

/** Normalised payload emitted for a mark (marker or bar) interaction, mapped by the host to its own event names. */
export interface SeriesInteractionEvent {
    /** The x coordinate (in chart pixels) of the interacted mark. */
    x: number;
    /** The y coordinate (in chart pixels) of the interacted mark. */
    y: number;
    /** The category key of the interacted mark. */
    xValue: string;
    /** The numeric value of the interacted mark. */
    yValue: number;
    /** The id of the series the mark belongs to. */
    seriesId: string;
}

/**
 * The host-chart state a series renderer draws against. Built fresh each render by the owning chart
 * and passed to the renderer, so renderers hold no reference to the chart itself.
 *
 * @typeParam TData - The type of each data item in the dataset.
 */
export interface SeriesRenderContext<TData> {
    /** The dataset being plotted, shared by every series. */
    data: TData[];
    /** Resolves each data item to its category key (the value plotted along the x axis). */
    getKey: (item: TData) => string;
    /** The value scale mapping a numeric value to its y pixel position. */
    yScale: Scale;
    /** The plot rectangle marks are drawn into. */
    plot: ChartArea;
    /** The y pixel position of the value baseline (`yScale(0)`). */
    baseline: number;
    /** The renderer driving transitions. */
    renderer: Renderer;
    /** The shared hover tooltip, when the chart has one. */
    tooltip?: Tooltip;
    /** Resolves a series id to its palette (or explicit) colour. */
    getColor: (seriesId: string) => string;
    /** Resolves the chart's animation for a given reference duration. */
    resolveAnimation: (reference?: number) => ResolvedAnimation;
    /** Formats a numeric value for tooltips and data labels. */
    formatValue: (value: unknown) => string;
    /** The resolved data-label options for the chart. */
    dataLabels: ChartDataLabelsOptions;
    /** Adds entering marks to the chart's plot-clipped content container. */
    addContent: (elements: OneOrMore<Element>) => void;
    /** Emits a normalised interaction event, which the host maps to its typed event map. */
    emit: (phase: SeriesEventPhase, event: SeriesInteractionEvent) => void;
    /**
     * Base z-index for this renderer's series groups. When set (mixed charts), the renderer assigns
     * each group an explicit z-index from this base so cross-type paint order is deterministic; when
     * omitted (standalone charts) groups keep their natural insertion order.
     */
    zIndexBase?: number;
}

/** Context for the {@link LineSeriesRenderer}: adds the categorical x point scale. */
export interface LineSeriesContext<TData> extends SeriesRenderContext<TData> {
    /** The point scale mapping a category key to its x pixel position. */
    xScale: Scale<string>;
}

/** Context for the {@link AreaSeriesRenderer}: adds the x point scale and the stack toggle. */
export interface AreaSeriesContext<TData> extends SeriesRenderContext<TData> {
    /** The point scale mapping a category key to its x pixel position. */
    xScale: Scale<string>;
    /** Whether area series are stacked cumulatively instead of overlaid. */
    stacked: boolean;
}

/** Context for the {@link BarSeriesRenderer}: adds the category band scale, value scale, orientation, and stacking. */
export interface BarSeriesContext<TData> extends SeriesRenderContext<TData> {
    /** The band scale mapping a category key to its slot on the categorical axis. */
    categoryScale: BandScale<string>;
    /** The continuous scale mapping a value to its position along the value axis (y for vertical bars, x for horizontal). */
    valueScale: Scale;
    /** Whether bars run vertically (default) or horizontally. */
    orientation: 'vertical' | 'horizontal';
    /** Whether bar series are stacked into a single column instead of grouped side by side. */
    stacked: boolean;
    /** Corner radius in pixels applied to each bar. */
    borderRadius: number;
}

/** The line/area series fields the line renderer reads. Both the standalone and trend option shapes satisfy it. */
export interface LineSeriesLike<TData> {
    /** Unique identifier for the series. */
    id: string;
    /** Explicit series colour; falls back to the generated palette when omitted. */
    color?: string;
    /** Accessor for the series' value at each data item, or a constant applied to every item. */
    value: NumericAccessor<TData> | number;
    /** Series name shown in the legend and tooltips (or a per-item function). */
    label: string | ((item: TData) => string);
    /** Renderer used to draw the line (e.g. straight or curved); defaults to straight segments. */
    lineType?: PolylineRenderer;
    /** Width in pixels of the series line. */
    lineWidth?: number;
    /** Line dash style: `'solid'` (default), `'dashed'`, `'dotted'`, or a custom dash array. */
    lineStyle?: LineStyle;
    /** Show point markers along the line. Defaults to `true`. */
    markers?: boolean;
    /** Radius in pixels of each point marker. Defaults to 3. */
    markerRadius?: number;
}

/** The area series fields the area renderer reads (line fields plus a fill opacity). */
export interface AreaSeriesLike<TData> extends LineSeriesLike<TData> {
    /** Fill opacity of the area band. Defaults to 0.3. */
    opacity?: number;
}

/** The bar series fields the bar renderer reads. */
export interface BarSeriesLike<TData> {
    /** Unique identifier for the series. */
    id: string;
    /** Explicit series colour; falls back to the generated palette when omitted. */
    color?: string;
    /** Accessor for the series' value at each data item, or a constant applied to every item. */
    value: NumericAccessor<TData> | number;
    /** Series name shown in the legend and tooltips (or a per-item function). */
    label: string | ((item: TData) => string);
}
