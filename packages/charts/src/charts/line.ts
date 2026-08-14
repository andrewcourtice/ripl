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
    ChartDataLabelsInput,
    ValueFormatInput,
} from '../core/options';

import {
    normalizeDataLabels,
    resolveValueFormat,
} from '../core/options';

import type {
    LineStyleInput,
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
    /** Unique identifier for the series, used for color assignment, legend, and data joins. */
    id: string;
    /** Explicit series color; falls back to the chart's generated palette when omitted. */
    color?: string;
    /** Accessor for the series' value at each data item, or a constant applied to every item. */
    value: NumericAccessor<TData> | number;
    /** Series name shown in the legend and tooltips (or a per-item function). */
    label: string | ((item: TData) => string);
    /** Renderer used to draw the line (e.g. straight or curved); defaults to straight segments. */
    lineType?: PolylineRenderer;
    /** Width in pixels of the series line. */
    lineWidth?: number;
    /** Line dash style: `'solid'` (default), `'dashed'`, `'dotted'`, a custom dash array, or key-anchored spans each with their own style. */
    lineStyle?: LineStyleInput<TData>;
    /** Show point markers along the line. Defaults to `true`; set `false` to hide them (toggling animates them in/out). */
    markers?: boolean;
    /** Radius in pixels of each point marker. Defaults to 3. */
    markerRadius?: number;
    /** Marker symbol shape: `'circle'` (default), `'square'`, `'diamond'`, or `'triangle'`. Non-circle symbols are sized to the same visual area as the circle. */
    marker?: SymbolType;
    /** The `id` of the y-axis this series binds to. Defaults to the primary axis. */
    yAxis?: string;
}

/** Options for configuring a {@link LineChart}. */
export interface LineChartOptions<TData = unknown> extends CartesianChartOptions<TData> {
    /** The dataset rendered by the chart. */
    data: TData[];
    /** The series to draw from each data item. */
    series: LineChartSeriesOptions<TData>[];
    /** Accessor for each item's category key (the value plotted along the x axis). */
    key: keyof TData | ((item: TData) => string);
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
 * Supports customizable line renderers (e.g. curved, stepped), interactive crosshair, tooltips,
 * legend, grid, chart title, and animated entry/update/exit transitions. Entry animations draw
 * lines progressively while markers appear with staggered delays.
 *
 * @typeParam TData - The type of each data item in the dataset.
 */
export class LineChart<TData = unknown> extends CartesianChart<LineChartOptions<TData>, TData, LineChartEventMap> {

    private _series = new LineSeriesRenderer<TData>();
    private _yScale!: Scale;
    private _xScale!: Scale<string>;

    /** The event types a line chart can emit. */
    public get $events(): (keyof LineChartEventMap)[] {
        return [
            'markerclick',
            'markerenter',
            'markerleave',
        ];
    }

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

    /** Builds the per-series overview data (id, color, type, values) for the navigator strip. */
    private _overviewSeries(): ChartNavigatorSeries[] {
        const { data, series } = this.options;

        return this.buildOverviewSeries(this.filterActive(series), data, () => 'line', (srs, item) => resolveAccessor<TData, number>(srs.value)(item));
    }

    private _axisTooltipSnapshot(
        plotX: number,
        keys: string[],
        series: LineChartSeriesOptions<TData>[],
        scaleFor: (srs: LineChartSeriesOptions<TData>) => Scale
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
        const formatValue = resolveValueFormat(this.options.format);

        let anchorY = Number.POSITIVE_INFINITY;

        const rows = series.map(srs => {
            const value = resolveAccessor<TData, number>(srs.value)(item);

            anchorY = Math.min(anchorY, scaleFor(srs)(value));

            return {
                label: typeIsFunction(srs.label) ? srs.id : srs.label,
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

    private _seriesContext(
        plot: ChartArea,
        yScale: Scale = this._yScale,
        resolveScale?: LineSeriesContext<TData>['resolveScale']
    ): LineSeriesContext<TData> {
        return {
            data: this.options.data,
            getKey: resolveAccessor<TData, string>(this.options.key),
            yScale,
            xScale: this._xScale,
            resolveScale,
            plot,
            baseline: yScale(0),
            renderer: this.renderer,
            // In axis-trigger mode the shared tooltip owns the pointer; per-item tooltips stay quiet.
            tooltip: this.tooltipTrigger === 'axis' ? undefined : this.tooltip,
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
                return this._renderMultiAxis({
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

            const plot = this.resolveCartesianPlot(area, candidate => {
                this._yScale = createValueScale(this.yAxisOptions, dataExtent, [candidate.y + candidate.height, candidate.y]);
                this.yAxis.scale = this._yScale;

                this._xScale = this.categoryScale(keys, candidate.x, candidate.x + candidate.width);
                this.xAxis.scale = this._xScale;
            });

            // The navigator windows the category axis only; the value axis keeps its full extent
            this._xScale = this.applyViewToScale(this._xScale, 'x');
            this.xAxis.scale = this._xScale;

            this.clipPlot(plot);

            this.renderGrid(
                [],
                this.gridTicks(this._yScale, axisTickCount(this.yAxisOptions)),
                plot
            );

            this.setupCrosshair(plot);
            this.setupAxisTooltip(plot, plotX => this._axisTooltipSnapshot(plotX, keys, activeSeries, () => this._yScale));

            this.renderAnnotations({ y: this._yScale }, plot);

            const seriesRender = this._series.render(activeSeries, this._seriesContext(plot));

            this.registerHighlightGroups(this._series.groups);

            this.renderNavigator(navBand, navBand ? this._overviewSeries() : [], [dataExtent[0], dataExtent[1]]);

            return Promise.all([
                this.xAxis.visible ? this.xAxis.render() : this.xAxis.hide(),
                this.yAxis.visible ? this.yAxis.render() : this.yAxis.hide(),
                seriesRender,
            ]);
        });
    }

    /**
     * Renders the chart across N y-axes. The (legend-active) series are partitioned by their `axis`
     * binding; each axis gets an independent value extent and scale computed over the active series
     * bound to it, {@link CartesianChart.layoutYAxes} packs the axis label bands against the two chart
     * edges and returns the plot bounds between them, and one series pass draws every series against
     * its bound axis's scale via the renderer's per-series scale resolver.
     */
    private _renderMultiAxis(ctx: {
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

        // Independent value extent per axis, over the active series bound to it.
        const extents = this.groupSeriesByAxis(series).map(group => numberExtent(group
            .flatMap(srs => numberExtent(this.options.data, resolveAccessor<TData, number>(srs.value)))
            .concat(0), functionIdentity));

        // Before the plot is resolved, so an axis nothing binds to reserves no band either.
        this.hideUnboundAxes(series);

        let scales: Scale[] = [];

        const plot = this.resolveCartesianPlot({
            x: left,
            y: top,
            width: right - left,
            height: bottom - top,
        }, candidate => {
            scales = this.yAxes.map((axis, index) => {
                const scale = createValueScale(this.yAxesOptions[index], extents[index], [candidate.y + candidate.height, candidate.y]);

                axis.scale = scale;

                return scale;
            });

            this._xScale = this.categoryScale(keys, candidate.x, candidate.x + candidate.width);
            this.xAxis.scale = this._xScale;
        });

        this._xScale = this.applyViewToScale(this._xScale, 'x');
        this.xAxis.scale = this._xScale;

        const scaleBySeries = new Map(series.map(srs => [srs.id, scales[this.resolveSeriesAxisIndex(srs.yAxis)] ?? scales[0]]));
        const scaleFor = (srs: { id: string }) => scaleBySeries.get(srs.id) ?? scales[0];

        this.clipPlot(plot);
        this.renderGrid([], this.gridTicks(scales[0], axisTickCount(this.yAxesOptions[0])), plot);
        this.setupCrosshair(plot);
        this.setupAxisTooltip(plot, plotX => this._axisTooltipSnapshot(plotX, keys, series, scaleFor));
        this.renderAnnotations({ y: scales[0] }, plot);

        this._yScale = scales[0];

        const seriesRender = this._series.render(series, this._seriesContext(plot, scales[0], scaleFor));

        this.registerHighlightGroups(this._series.groups);

        this.renderNavigator(navBand, navBand ? this._overviewSeries() : [], [dataExtent[0], dataExtent[1]]);

        return Promise.all([
            this.xAxis.visible ? this.xAxis.render() : this.xAxis.hide(),
            ...this.yAxes.map(axis => axis.visible ? axis.render() : axis.hide()),
            seriesRender,
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
