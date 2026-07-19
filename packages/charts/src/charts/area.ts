import type {
    NumericAccessor,
} from '../core/data';

import type {
    AxisTooltipSnapshot,
    CartesianChartOptions,
} from '../core/cartesian';

import {
    CartesianChart,
} from '../core/cartesian';

import type {
    ChartAxisInput,
    ChartCrosshairInput,
    ChartDataLabelsInput,
    ChartGridInput,
    ChartLegendInput,
    ChartTooltipInput,
    ValueFormatInput,
} from '../core/options';

import {
    normalizeDataLabels,
    resolveFormatLabel,
    resolveValueFormat,
} from '../core/options';

import type {
    LineStyle,
} from '../core/options';

import {
    cumulativeExtent,
    resolveAccessor,
} from '../core/data';

import {
    axisTickCount,
    createValueScale,
} from '../core/scales';

import {
    AreaSeriesRenderer,
} from '../core/series/area-series';

import type {
    AreaSeriesContext,
    SeriesEventPhase,
    SeriesInteractionEvent,
} from '../core/series/context';

import type {
    ChartNavigatorSeries,
} from '../components/navigator';

import type {
    ChartArea,
} from '../core/layout';

import type {
    LegendItem,
} from '../components/legend';

import type {
    Context,
    EventMap,
    PolylineRenderer,
    Scale,
} from '@ripl/core';

import {
    Box,
} from '@ripl/core';

import {
    functionIdentity,
    numberExtent,
} from '@ripl/utilities';

/** Maps a pointer interaction phase to the corresponding area-chart marker event name. */
const MARKER_EVENTS = {
    enter: 'markerenter',
    leave: 'markerleave',
    click: 'markerclick',
} as const;

/** Configuration for an individual area chart series. */
export interface AreaChartSeriesOptions<TData> {
    /** Unique identifier for the series, used for colour assignment, legend, and data joins. */
    id: string;
    /** Explicit series colour; falls back to the chart's generated palette when omitted. */
    color?: string;
    /** Accessor for the series' value at each data item, or a constant applied to every item. */
    value: NumericAccessor<TData> | number;
    /** Human-readable series name shown in the legend and tooltips. */
    label: string;
    /** Renderer used to draw the line/area top edge (e.g. straight or curved); defaults to straight segments. */
    lineType?: PolylineRenderer;
    /** Line dash style: `'solid'` (default), `'dashed'`, `'dotted'`, or a custom dash array. */
    lineStyle?: LineStyle;
    /** Width in pixels of the series line. */
    lineWidth?: number;
    /** Fill opacity of the area band. Defaults to 0.3. */
    fillOpacity?: number;
    /** Show point markers at each data value. Defaults to true. */
    markers?: boolean;
    /**
     * Which y-axis this series binds to — an index into `axis.y` or a y-axis `id`. Defaults to the
     * primary axis. When the chart is stacked, series stack only with other series bound to the
     * same axis.
     */
    axis?: number | string;
}

/** Options for configuring an {@link AreaChart}. */
export interface AreaChartOptions<TData = unknown> extends CartesianChartOptions<TData> {
    /** The dataset rendered by the chart. */
    data: TData[];
    /** The series to draw from each data item. */
    series: AreaChartSeriesOptions<TData>[];
    /** Accessor for each item's category key (the value plotted along the x axis). */
    key: keyof TData | ((item: TData) => string);
    /**
     * Stack series cumulatively instead of overlaying them. Defaults to false. With multiple
     * y-axes, stacking applies per axis group — series stack only with the other series bound to
     * the same axis, and each axis's extent covers its own group's cumulative total.
     *
     * Pass `'percent'` for a 100%-stacked chart: each category's values are normalized to their
     * share of the category's positive total across all active series (negative values contribute
     * zero), the value axis is fixed to 0–100%, and values default to percentage formatting.
     * Intended for single-axis charts.
     */
    stacked?: boolean | 'percent';
    /** Background grid configuration (`true`/`false` or detailed grid options). */
    grid?: ChartGridInput;
    /** Crosshair overlay configuration (`true`/`false` or detailed crosshair options). */
    crosshair?: ChartCrosshairInput;
    /** Hover tooltip configuration (`true`/`false` or detailed tooltip options). */
    tooltip?: ChartTooltipInput;
    /** Legend configuration (`true`/`false`, a position, or detailed legend options). */
    legend?: ChartLegendInput;
    /** Axis configuration for the x and y axes. */
    axis?: ChartAxisInput<TData>;
    /** Show value labels next to each marker. `true` uses the default anchor; a string sets the anchor side. */
    labels?: ChartDataLabelsInput;
    /** Format applied to marker values shown as text (tooltips and labels). */
    format?: ValueFormatInput;
}

/** Payload emitted for area marker interaction events. */
export interface AreaChartMarkerEvent {
    /** The x coordinate (in chart pixels) of the marker. */
    x: number;
    /** The y coordinate (in chart pixels) of the marker. */
    y: number;
    /** The category key of the interacted marker. */
    xValue: string;
    /** The numeric value of the interacted marker. */
    yValue: number;
    /** The id of the series the marker belongs to. */
    seriesId: string;
}

/** Events emitted by an {@link AreaChart} that consumers can subscribe to via `chart.on(...)`. */
export interface AreaChartEventMap extends EventMap {
    /** Emitted when a marker is clicked. */
    markerclick: AreaChartMarkerEvent;
    /** Emitted when the pointer enters a marker. */
    markerenter: AreaChartMarkerEvent;
    /** Emitted when the pointer leaves a marker. */
    markerleave: AreaChartMarkerEvent;
}

/**
 * Area chart rendering filled regions beneath series lines.
 *
 * Supports stacked and unstacked modes with optional markers, crosshair, tooltips, legend, chart
 * title, and grid. On entry the line draws on and the fill is revealed left-to-right (a true wipe,
 * not a horizontal stretch); areas transition smoothly on update and fade out on exit. Unstacked
 * areas are painted largest-first so smaller areas are never hidden behind larger ones.
 *
 * @typeParam TData - The type of each data item in the dataset.
 */
export class AreaChart<TData = unknown> extends CartesianChart<AreaChartOptions<TData>, TData, AreaChartEventMap> {

    private _series = new AreaSeriesRenderer<TData>();
    private _series2 = new AreaSeriesRenderer<TData>();
    private _yScale!: Scale;
    private _xScale!: Scale<string>;

    constructor(target: string | HTMLElement | Context, options: AreaChartOptions<TData>) {
        super(target, options);

        this.setupCartesian({
            grid: { horizontal: true },
            crosshair: true,
        });

        this.init();
    }

    /** Area charts are category-on-x, so the navigator windows the x axis (bottom scrub bar). */
    protected override navigationAxis(): 'x' {
        return 'x';
    }

    private _seriesValue(series: AreaChartSeriesOptions<TData>, item: TData): number {
        return resolveAccessor<TData, number>(series.value)(item);
    }

    private get _isPercent() {
        return this.options.stacked === 'percent';
    }

    // Resolves the shared axis-tooltip content for the hovered plot x: the nearest category, one
    // row per active series (share values in percent mode), anchored above the topmost value.
    private _axisTooltipSnapshot(
        plotX: number,
        keys: string[],
        series: AreaChartSeriesOptions<TData>[],
        scaleFor: (srs: AreaChartSeriesOptions<TData>) => Scale
    ): AxisTooltipSnapshot | null {
        if (keys.length === 0 || series.length === 0) {
            return null;
        }

        let nearest = 0;
        let best = Number.POSITIVE_INFINITY;

        keys.forEach((key, index) => {
            const distance = Math.abs(this._xScale(key) - plotX);

            if (distance < best) {
                best = distance;
                nearest = index;
            }
        });

        const item = this.options.data[nearest];
        const key = keys[nearest];
        const formatValue = resolveValueFormat(this.options.format ?? (this._isPercent ? 'percentage' : undefined));

        let anchorY = Number.POSITIVE_INFINITY;

        const rows = series.map(srs => {
            const value = this._seriesValue(srs, item);

            anchorY = Math.min(anchorY, scaleFor(srs)(value));

            return {
                label: srs.label,
                value: formatValue(value),
            };
        });

        return {
            title: key,
            rows,
            x: this._xScale(key),
            y: Number.isFinite(anchorY) ? anchorY : 0,
        };
    }

    // Wraps each series' value accessor to return its share of the category's positive total,
    // computed over the ACTIVE series so legend toggling renormalizes the remaining shares.
    private _percentSeries(series: AreaChartSeriesOptions<TData>[], data: TData[]): AreaChartSeriesOptions<TData>[] {
        const totals = new Map<TData, number>(data.map(item => [
            item,
            series.reduce((total, srs) => total + Math.max(0, this._seriesValue(srs, item)), 0),
        ]));

        return series.map(srs => {
            const rawValue = resolveAccessor<TData, number>(srs.value);

            return {
                ...srs,
                value: (item: TData) => {
                    const total = totals.get(item) ?? 0;

                    return total > 0
                        ? Math.max(0, rawValue(item)) / total
                        : 0;
                },
            };
        });
    }

    private _emitMarker(phase: SeriesEventPhase, event: SeriesInteractionEvent): void {
        this.emit(MARKER_EVENTS[phase], event);
    }

    /** Builds the per-series overview data (id, colour, type, values) for the navigator strip. */
    private _overviewSeries(): ChartNavigatorSeries[] {
        const { data, series } = this.options;

        return this.buildOverviewSeries(this.filterActive(series), data, () => 'area', (srs, item) => this._seriesValue(srs, item));
    }

    private _seriesContext(plot: ChartArea, yScale: Scale = this._yScale): AreaSeriesContext<TData> {
        return {
            data: this.options.data,
            getKey: resolveAccessor<TData, string>(this.options.key),
            yScale,
            xScale: this._xScale,
            stacked: !!this.options.stacked,
            plot,
            baseline: yScale(0),
            renderer: this.renderer,
            // In axis-trigger mode the shared tooltip owns the pointer — per-item tooltips stay quiet.
            tooltip: this.tooltipTrigger === 'axis' ? undefined : this.tooltip,
            getColor: id => this.getSeriesColor(id),
            resolveAnimation: reference => this.resolveAnimation(reference),
            formatValue: resolveValueFormat(this.options.format ?? (this._isPercent ? 'percentage' : undefined)),
            dataLabels: normalizeDataLabels(this.options.labels, { anchor: 'top' }),
            addContent: elements => this.addPlotContent(elements),
            emit: (phase, event) => this._emitMarker(phase, event),
        };
    }

    public async render() {
        return super.render(async () => {
            const { data, series, key, stacked } = this.options;

            this.resolveSeriesColors(series);
            this.prepareAxes();

            const getKey = resolveAccessor<TData, string>(key);
            const keys = data.map(getKey);

            // Legend-hidden series are excluded from extents, stacking, and rendering, so toggling a
            // series rescales the value axis (and restacks the remainder) while the hidden series
            // animates out through the standard exit join. Percent mode additionally wraps the
            // active series' value accessors in share space.
            const activeSeries = this._isPercent
                ? this._percentSeries(this.filterActive(series), data)
                : this.filterActive(series);

            let dataExtent: number[];

            if (this._isPercent) {
                dataExtent = [0, 1];
                this.yAxis.formatLabel ??= resolveFormatLabel('percentage');
            } else if (stacked) {
                dataExtent = cumulativeExtent(activeSeries, data, (srs, item) => this._seriesValue(srs, item));
            } else {
                const seriesExtents = activeSeries
                    .flatMap(srs => numberExtent(data, item => this._seriesValue(srs, item)))
                    .concat(0);

                dataExtent = numberExtent(seriesExtents, functionIdentity);
            }

            const layout = this.createLayout();
            this.reserveTitle(layout);

            const legendItems: LegendItem[] = series.length > 1
                ? series.map(srs => ({
                    id: srs.id,
                    label: srs.label,
                    color: this.getSeriesColor(srs.id),
                    active: this.isItemActive(srs.id),
                }))
                : [];

            this.reserveLegend(layout, legendItems);

            // Reserve the overview strip band from the bottom before the axes are measured.
            const navBand = this.reserveNavigatorBand(layout);

            const area = layout.area;
            const left = area.x;
            const top = area.y;
            const right = area.x + area.width;
            const bottom = area.y + area.height;

            if (this.yAxes.length > 1) {
                return this._renderSecondaryAxes({
                    series: activeSeries,
                    keys,
                    dataExtent,
                    navBand,
                    left,
                    top,
                    right,
                    bottom,
                });
            }

            this._yScale = createValueScale(this.yAxisOptions, dataExtent, [bottom, top]);
            this.yAxis.scale = this._yScale;
            this.yAxis.bounds = new Box(top, left, bottom, right);

            const yAxisBox = this.yAxis.getBoundingBox();

            this._xScale = this.categoryScale(keys, yAxisBox.right, right);
            this.xAxis.scale = this._xScale;
            this.xAxis.bounds = new Box(top, yAxisBox.right, bottom, right);

            const xAxisBox = this.xAxis.getBoundingBox();

            this._yScale = createValueScale(this.yAxisOptions, dataExtent, [xAxisBox.top, top]);
            this.yAxis.scale = this._yScale;
            this.yAxis.bounds.bottom = xAxisBox.top;

            // The navigator windows the x (category) axis only — the value axis stays at the full
            // extent, so the strip scrubs horizontally without rescaling the y domain.
            this._xScale = this.applyViewToScale(this._xScale, 'x');
            this.xAxis.scale = this._xScale;

            const plot = {
                x: yAxisBox.right,
                y: top,
                width: right - yAxisBox.right,
                height: xAxisBox.top - top,
            };

            this.clipPlot(plot);
            this.renderGrid([], this.gridTicks(this._yScale, axisTickCount(this.yAxisOptions)), plot);
            this.setupCrosshair(plot);
            this.setupAxisTooltip(plot, plotX => this._axisTooltipSnapshot(plotX, keys, activeSeries, () => this._yScale));

            this.renderAnnotations({ y: this._yScale }, plot);

            const seriesRender = this._series.render(activeSeries, this._seriesContext(plot));

            // A previous render may have drawn series against a since-removed secondary axis —
            // rendering the secondary renderer empty exits those groups.
            const secondaryExit = this._series2.groups.length > 0
                ? this._series2.render([], this._seriesContext(plot))
                : Promise.resolve();

            this.registerHighlightGroups(this._series.groups);

            this.renderNavigator(navBand, navBand ? this._overviewSeries() : [], [dataExtent[0], dataExtent[1]], !!stacked);

            return Promise.all([
                this.xAxis.visible ? this.xAxis.render() : Promise.resolve(),
                this.yAxis.visible ? this.yAxis.render() : Promise.resolve(),
                seriesRender,
                secondaryExit,
            ]);
        });
    }

    /**
     * Renders the chart with a secondary (right-hand) y-axis. The (legend-active) series are
     * partitioned by their `axis` binding; each axis gets an independent value extent and scale
     * computed over the active series bound to it (stacking cumulates within each axis group only),
     * the plot sits between the two axis label bands, and each series group is drawn against its
     * bound axis's scale.
     */
    private _renderSecondaryAxes(ctx: {
        series: AreaChartSeriesOptions<TData>[];
        keys: string[];
        dataExtent: number[];
        navBand: ChartArea | undefined;
        left: number;
        top: number;
        right: number;
        bottom: number;
    }): Promise<unknown> {
        const {
            series,
            keys,
            dataExtent,
            navBand,
            left,
            top,
            right,
            bottom,
        } = ctx;

        const stacked = !!this.options.stacked;

        // Partition series by the y-axis they bind to.
        const seriesByAxis = this.yAxes.map((_, index) => series.filter(srs => this.resolveSeriesAxisIndex(srs.axis) === index));

        // Independent value extent per axis; stacked series cumulate within their axis group only.
        const extents = seriesByAxis.map(group => {
            if (stacked) {
                return cumulativeExtent(group, this.options.data, (srs, item) => this._seriesValue(srs, item));
            }

            return numberExtent(group
                .flatMap(srs => numberExtent(this.options.data, item => this._seriesValue(srs, item)))
                .concat(0), functionIdentity);
        });

        // Provisional scales so each axis can measure its label band. Both bounds span the full width
        // so the left axis reserves from the left edge and the right axis from the right edge.
        this.yAxes.forEach((axis, index) => {
            axis.scale = createValueScale(this.yAxesOptions[index], extents[index], [bottom, top]);
            axis.bounds = new Box(top, left, bottom, right);
        });

        const plotLeft = this.yAxes[0].getBoundingBox().right;
        const plotRight = this.yAxes[1].getBoundingBox().left;

        this._xScale = this.categoryScale(keys, plotLeft, plotRight);
        this.xAxis.scale = this._xScale;
        this.xAxis.bounds = new Box(top, plotLeft, bottom, plotRight);

        const xAxisBox = this.xAxis.getBoundingBox();

        // Final scales over the plot height; clamp each axis band above the x-axis labels.
        const scales = this.yAxes.map((axis, index) => {
            const scale = createValueScale(this.yAxesOptions[index], extents[index], [xAxisBox.top, top]);

            axis.scale = scale;
            axis.bounds.bottom = xAxisBox.top;

            return scale;
        });

        this._xScale = this.applyViewToScale(this._xScale, 'x');
        this.xAxis.scale = this._xScale;

        const plot = {
            x: plotLeft,
            y: top,
            width: plotRight - plotLeft,
            height: xAxisBox.top - top,
        };

        this.clipPlot(plot);
        this.renderGrid([], this.gridTicks(scales[0], axisTickCount(this.yAxesOptions[0])), plot);
        this.setupCrosshair(plot);
        this.setupAxisTooltip(plot, plotX => this._axisTooltipSnapshot(plotX, keys, series, srs => scales[this.resolveSeriesAxisIndex(srs.axis)] ?? scales[0]));
        this.renderAnnotations({ y: scales[0] }, plot);

        this._yScale = scales[0];

        const primaryRender = this._series.render(seriesByAxis[0], this._seriesContext(plot, scales[0]));
        const secondaryRender = this._series2.render(seriesByAxis[1], this._seriesContext(plot, scales[1]));

        this.registerHighlightGroups([
            ...this._series.groups,
            ...this._series2.groups,
        ]);

        this.renderNavigator(navBand, navBand ? this._overviewSeries() : [], [dataExtent[0], dataExtent[1]], stacked);

        return Promise.all([
            this.xAxis.visible ? this.xAxis.render() : Promise.resolve(),
            ...this.yAxes.map(axis => axis.visible ? axis.render() : Promise.resolve()),
            primaryRender,
            secondaryRender,
        ]);
    }

}

/**
 * Factory function that creates a new {@link AreaChart} instance.
 *
 * @example
 * ```ts
 * createAreaChart(target, {
 *     data: [
 *         { month: 'Jan', visitors: 820 },
 *         { month: 'Feb', visitors: 932 },
 *     ],
 *     key: 'month',
 *     series: [
 *         { id: 'visitors', label: 'Visitors', value: 'visitors' },
 *     ],
 * });
 * ```
 */
export function createAreaChart<TData = unknown>(target: string | HTMLElement | Context, options: AreaChartOptions<TData>) {
    return new AreaChart<TData>(target, options);
}
