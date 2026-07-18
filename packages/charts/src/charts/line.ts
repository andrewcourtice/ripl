import type {
    NumericAccessor,
} from '../core/data';

import type {
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
    resolveValueFormat,
} from '../core/options';

import type {
    LineStyle,
} from '../core/options';

import {
    resolveAccessor,
} from '../core/data';

import {
    axisTickCount,
    createValueScale,
} from '../core/scales';

import {
    LineSeriesRenderer,
} from '../core/series/line-series';

import type {
    LineSeriesContext,
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
    SymbolType,
} from '../components/symbols';

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
    typeIsFunction,
} from '@ripl/utilities';

/** Maps a pointer interaction phase to the corresponding line-chart marker event name. */
const MARKER_EVENTS = {
    enter: 'markerenter',
    leave: 'markerleave',
    click: 'markerclick',
} as const;

/** Configuration for an individual line chart series. */
export interface LineChartSeriesOptions<TData> {
    /** Unique identifier for the series, used for colour assignment, legend, and data joins. */
    id: string;
    /** Explicit series colour; falls back to the chart's generated palette when omitted. */
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
    /** Show point markers along the line. Defaults to `true`; set `false` to hide them (toggling animates them in/out). */
    markers?: boolean;
    /** Radius in pixels of each point marker. Defaults to 3. */
    markerRadius?: number;
    /** Marker symbol shape: `'circle'` (default), `'square'`, `'diamond'`, or `'triangle'`. Non-circle symbols are sized to the same visual area as the circle. */
    marker?: SymbolType;
    /** Which y-axis this series binds to — an index into `axis.y` or a y-axis `id`. Defaults to the primary axis. */
    axis?: number | string;
}

/** Options for configuring a {@link LineChart}. */
export interface LineChartOptions<TData = unknown> extends CartesianChartOptions<TData> {
    /** The dataset rendered by the chart. */
    data: TData[];
    /** The series to draw from each data item. */
    series: LineChartSeriesOptions<TData>[];
    /** Accessor for each item's category key (the value plotted along the x axis). */
    key: keyof TData | ((item: TData) => string);
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

/** Payload emitted for line marker interaction events. */
export interface LineChartMarkerEvent {
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

/** Events emitted by a {@link LineChart} that consumers can subscribe to via `chart.on(...)`. */
export interface LineChartEventMap extends EventMap {
    /** Emitted when a marker is clicked. */
    markerclick: LineChartMarkerEvent;
    /** Emitted when the pointer enters a marker. */
    markerenter: LineChartMarkerEvent;
    /** Emitted when the pointer leaves a marker. */
    markerleave: LineChartMarkerEvent;
}

/**
 * Line chart rendering one or more series as polylines with optional markers.
 *
 * Supports customisable line renderers (e.g. curved, stepped), interactive crosshair, tooltips,
 * legend, grid, chart title, and animated entry/update/exit transitions. Entry animations draw
 * lines progressively while markers appear with staggered delays.
 *
 * @typeParam TData - The type of each data item in the dataset.
 */
export class LineChart<TData = unknown> extends CartesianChart<LineChartOptions<TData>, TData, LineChartEventMap> {

    private _series = new LineSeriesRenderer<TData>();
    private _series2 = new LineSeriesRenderer<TData>();
    private _yScale!: Scale;
    private _xScale!: Scale<string>;

    constructor(target: string | HTMLElement | Context, options: LineChartOptions<TData>) {
        super(target, options);

        this.setupCartesian({
            grid: { horizontal: true },
            crosshair: true,
        });

        this.init();
    }

    /** Line charts are category-on-x, so the navigator windows the x axis (bottom scrub bar). */
    protected override navigationAxis(): 'x' {
        return 'x';
    }

    private _emitMarker(phase: SeriesEventPhase, event: SeriesInteractionEvent): void {
        this.emit(MARKER_EVENTS[phase], event);
    }

    /** Builds the per-series overview data (id, colour, type, values) for the navigator strip. */
    private _overviewSeries(): ChartNavigatorSeries[] {
        const { data, series } = this.options;

        return this.buildOverviewSeries(this.filterActive(series), data, () => 'line', (srs, item) => resolveAccessor<TData, number>(srs.value)(item));
    }

    private _seriesContext(plot: ChartArea, yScale: Scale = this._yScale): LineSeriesContext<TData> {
        return {
            data: this.options.data,
            getKey: resolveAccessor<TData, string>(this.options.key),
            yScale,
            xScale: this._xScale,
            plot,
            baseline: yScale(0),
            renderer: this.renderer,
            tooltip: this.tooltip,
            getColor: id => this.getSeriesColor(id),
            resolveAnimation: reference => this.resolveAnimation(reference),
            formatValue: resolveValueFormat(this.options.format),
            dataLabels: normalizeDataLabels(this.options.labels, { anchor: 'top' }),
            addContent: elements => this.addPlotContent(elements),
            emit: (phase, event) => this._emitMarker(phase, event),
        };
    }

    public async render() {
        return super.render(async () => {
            const { data, series, key } = this.options;

            this.resolveSeriesColors(series);
            this.prepareAxes();

            const getKey = resolveAccessor<TData, string>(key);
            const keys = data.map(getKey);

            // Legend-hidden series are excluded from extents and rendering, so toggling a series
            // rescales the value axis and animates the series out through the standard exit join.
            const activeSeries = this.filterActive(series);

            const seriesExtents = activeSeries
                .flatMap(srs => numberExtent(data, resolveAccessor<TData, number>(srs.value)))
                .concat(0);

            const dataExtent = numberExtent(seriesExtents, functionIdentity);

            const layout = this.createLayout();
            this.reserveTitle(layout);

            const legendItems: LegendItem[] = series.length > 1
                ? series.map(srs => ({
                    id: srs.id,
                    label: typeIsFunction(srs.label) ? srs.id : srs.label,
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

            // Provisional value scale to measure the y-axis width.
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

            this.renderGrid(
                [],
                this.gridTicks(this._yScale, axisTickCount(this.yAxisOptions)),
                plot
            );

            this.setupCrosshair(plot);

            this.renderAnnotations({ y: this._yScale }, plot);

            const seriesRender = this._series.render(activeSeries, this._seriesContext(plot));

            // A previous render may have drawn series against a since-removed secondary axis —
            // rendering the secondary renderer empty exits those groups.
            const secondaryExit = this._series2.groups.length > 0
                ? this._series2.render([], this._seriesContext(plot))
                : Promise.resolve();

            this.registerHighlightGroups(this._series.groups);

            this.renderNavigator(navBand, navBand ? this._overviewSeries() : [], [dataExtent[0], dataExtent[1]]);

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
     * computed over the active series bound to it, the plot sits between the two axis label bands,
     * and each series group is drawn against its bound axis's scale.
     */
    private _renderSecondaryAxes(ctx: {
        series: LineChartSeriesOptions<TData>[];
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

        // Partition series by the y-axis they bind to.
        const seriesByAxis = this.yAxes.map((_, index) => series.filter(srs => this.resolveSeriesAxisIndex(srs.axis) === index));

        // Independent value extent per axis.
        const extents = seriesByAxis.map(group => numberExtent(group
            .flatMap(srs => numberExtent(this.options.data, resolveAccessor<TData, number>(srs.value)))
            .concat(0), functionIdentity));

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
        this.renderAnnotations({ y: scales[0] }, plot);

        this._yScale = scales[0];

        const primaryRender = this._series.render(seriesByAxis[0], this._seriesContext(plot, scales[0]));
        const secondaryRender = this._series2.render(seriesByAxis[1], this._seriesContext(plot, scales[1]));

        this.registerHighlightGroups([
            ...this._series.groups,
            ...this._series2.groups,
        ]);

        this.renderNavigator(navBand, navBand ? this._overviewSeries() : [], [dataExtent[0], dataExtent[1]]);

        return Promise.all([
            this.xAxis.visible ? this.xAxis.render() : Promise.resolve(),
            ...this.yAxes.map(axis => axis.visible ? axis.render() : Promise.resolve()),
            primaryRender,
            secondaryRender,
        ]);
    }

}

/**
 * Factory function that creates a new {@link LineChart} instance.
 *
 * @example
 * ```ts
 * createLineChart(target, {
 *     data: [
 *         { month: 'Jan', sales: 30 },
 *         { month: 'Feb', sales: 48 },
 *     ],
 *     key: 'month',
 *     series: [
 *         { id: 'sales', label: 'Sales', value: 'sales' },
 *     ],
 * });
 * ```
 */
export function createLineChart<TData = unknown>(target: string | HTMLElement | Context, options: LineChartOptions<TData>) {
    return new LineChart<TData>(target, options);
}
