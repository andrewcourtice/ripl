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
    LineStyle,
    ValueFormatInput,
} from '../core/options';

import {
    normalizeDataLabels,
    resolveValueFormat,
} from '../core/options';

import {
    cumulativeExtent,
    positiveNegativeExtent,
    resolveAccessor,
} from '../core/data';

import {
    AreaSeriesRenderer,
} from '../core/series/area-series';

import {
    BarSeriesRenderer,
} from '../core/series/bar-series';

import {
    LineSeriesRenderer,
} from '../core/series/line-series';

import type {
    AreaSeriesContext,
    BarSeriesContext,
    LineSeriesContext,
    SeriesEventPhase,
    SeriesInteractionEvent,
    SeriesRenderContext,
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
    scaleBand,
    scaleContinuous,
} from '@ripl/core';

import {
    functionIdentity,
    numberExtent,
    typeIsFunction,
} from '@ripl/utilities';

/** Maps a pointer interaction phase to the corresponding trend-chart marker event name. */
const MARKER_EVENTS = {
    enter: 'markerenter',
    leave: 'markerleave',
    click: 'markerclick',
} as const;

/** Maps a pointer interaction phase to the corresponding trend-chart bar event name. */
const BAR_EVENTS = {
    enter: 'barenter',
    leave: 'barleave',
    click: 'barclick',
} as const;

/** Supported series visualization types within a trend chart. */
export type TrendSeriesType = 'line' | 'bar' | 'area';

/** Configuration shared by every trend chart series type. */
export interface TrendChartBaseSeriesOptions<TData> {
    /** Unique identifier for the series, used for colour assignment, legend, and data joins. */
    id: string;
    /** Which visualization type to render this series as. */
    type: TrendSeriesType;
    /** Explicit series colour; falls back to the chart's generated palette when omitted. */
    color?: string;
    /** Accessor for the series' value at each data item, or a constant applied to every item. */
    value: NumericAccessor<TData> | number;
    /** Series name shown in the legend and tooltips (or a per-item function). */
    label: string | ((item: TData) => string);
}

/** Series options for a line-type series within a trend chart. */
export interface TrendChartLineSeriesOptions<TData> extends TrendChartBaseSeriesOptions<TData> {
    /** Discriminant marking this as a line series. */
    type: 'line';
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

/** Series options for an area-type series within a trend chart. */
export interface TrendChartAreaSeriesOptions<TData> extends TrendChartBaseSeriesOptions<TData> {
    /** Discriminant marking this as an area series. */
    type: 'area';
    /** Renderer used to draw the area top edge (e.g. straight or curved); defaults to straight segments. */
    lineType?: PolylineRenderer;
    /** Width in pixels of the series line. */
    lineWidth?: number;
    /** Line dash style: `'solid'` (default), `'dashed'`, `'dotted'`, or a custom dash array. */
    lineStyle?: LineStyle;
    /** Fill opacity of the area band. Defaults to 0.3. */
    opacity?: number;
    /** Show point markers at each data value. Defaults to `true`. */
    markers?: boolean;
}

/** Series options for a bar-type series within a trend chart. */
export interface TrendChartBarSeriesOptions<TData> extends TrendChartBaseSeriesOptions<TData> {
    /** Discriminant marking this as a bar series. */
    type: 'bar';
}

/** Discriminated union of all trend chart series option types. */
export type TrendChartSeriesOptions<TData> = TrendChartLineSeriesOptions<TData>
| TrendChartAreaSeriesOptions<TData>
| TrendChartBarSeriesOptions<TData>;

/** Options for configuring a {@link TrendChart}. */
export interface TrendChartOptions<TData = unknown> extends CartesianChartOptions<TData> {
    /** The dataset plotted across all series. */
    data: TData[];
    /** The series to render, mixing line, bar, and area types on shared axes. */
    series: TrendChartSeriesOptions<TData>[];
    /** Accessor for each item's category key (the value plotted along the x axis). */
    key: keyof TData | ((item: TData) => string);
    /** Stack same-type series cumulatively (bars among bars, areas among areas). Defaults to false. */
    stacked?: boolean;
    /** Corner radius in pixels applied to each bar. Defaults to 2. */
    borderRadius?: number;
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
    /** Show value labels next to each mark. `true` uses the default anchor; a string sets the anchor side. */
    labels?: ChartDataLabelsInput;
    /** Format applied to values shown as text (tooltips and labels). */
    format?: ValueFormatInput;
}

/** Payload emitted for trend bar interaction events. */
export interface TrendChartBarEvent {
    /** The x coordinate (in chart pixels) of the bar's anchor point. */
    x: number;
    /** The y coordinate (in chart pixels) of the bar's anchor point. */
    y: number;
    /** The category key of the interacted bar. */
    xValue: string;
    /** The numeric value of the interacted bar. */
    yValue: number;
    /** The id of the series the bar belongs to. */
    seriesId: string;
}

/** Payload emitted for trend line/area marker interaction events. */
export interface TrendChartMarkerEvent {
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

/** Events emitted by a {@link TrendChart} that consumers can subscribe to via `chart.on(...)`. */
export interface TrendChartEventMap extends EventMap {
    /** Emitted when a bar is clicked. */
    barclick: TrendChartBarEvent;
    /** Emitted when the pointer enters a bar. */
    barenter: TrendChartBarEvent;
    /** Emitted when the pointer leaves a bar. */
    barleave: TrendChartBarEvent;
    /** Emitted when a line/area marker is clicked. */
    markerclick: TrendChartMarkerEvent;
    /** Emitted when the pointer enters a line/area marker. */
    markerenter: TrendChartMarkerEvent;
    /** Emitted when the pointer leaves a line/area marker. */
    markerleave: TrendChartMarkerEvent;
}

/**
 * Trend chart combining line, bar, and area series on shared categorical/value axes.
 *
 * A true mixed cartesian chart: each series declares a `type` (`line`, `bar`, or `area`) plus the
 * options specific to that type, and the chart reuses the same renderers as the standalone line,
 * bar, and area charts. Series paint back-to-front as area → bar → line so lines never hide behind
 * fills or bars, and overlaid areas are drawn largest-first so smaller areas stay visible. Same-type
 * series can be stacked, the optional {@link CartesianChartOptions.overview} strip windows the visible
 * x-range, and every cartesian feature (axes, grid, legend, crosshair, tooltip, navigator) is
 * inherited from {@link CartesianChart}.
 *
 * @typeParam TData - The type of each data item in the dataset.
 */
export class TrendChart<TData = unknown> extends CartesianChart<TrendChartOptions<TData>, TData, TrendChartEventMap> {

    private _areaRenderer = new AreaSeriesRenderer<TData>();
    private _barRenderer = new BarSeriesRenderer<TData>();
    private _lineRenderer = new LineSeriesRenderer<TData>();
    private _yScale!: Scale;
    private _xCenter!: Scale<string>;

    constructor(target: string | HTMLElement | Context, options: TrendChartOptions<TData>) {
        super(target, options);

        this.setupCartesian({
            grid: { horizontal: true },
            crosshair: true,
        });

        this.init();
    }

    /** The trend chart is category-on-x, so the navigator windows the x axis (bottom scrub bar). */
    protected override navigationAxis(): 'x' {
        return 'x';
    }

    /** Trend marks (bars, plus line/area markers at band centres) are laid out in category bands. */
    protected override navigatorCategoryLayout(): 'band' {
        return 'band';
    }

    private _seriesValue(series: TrendChartSeriesOptions<TData>, item: TData): number {
        return resolveAccessor<TData, number>(series.value)(item);
    }

    private _emitMarker(phase: SeriesEventPhase, event: SeriesInteractionEvent): void {
        this.emit(MARKER_EVENTS[phase], event);
    }

    private _emitBar(phase: SeriesEventPhase, event: SeriesInteractionEvent): void {
        this.emit(BAR_EVENTS[phase], event);
    }

    /** Builds the per-type overview series (id, colour, type, values) for the navigator strip. */
    private _overviewSeries(): ChartNavigatorSeries[] {
        const { data, series } = this.options;

        return this.buildOverviewSeries(series, data, srs => srs.type, (srs, item) => this._seriesValue(srs, item));
    }

    private _commonContext(plot: ChartArea, emit: (phase: SeriesEventPhase, event: SeriesInteractionEvent) => void): SeriesRenderContext<TData> {
        return {
            data: this.options.data,
            getKey: resolveAccessor<TData, string>(this.options.key),
            yScale: this._yScale,
            plot,
            baseline: this._yScale(0),
            renderer: this.renderer,
            tooltip: this.tooltip,
            getColor: id => this.getSeriesColor(id),
            resolveAnimation: reference => this.resolveAnimation(reference),
            formatValue: resolveValueFormat(this.options.format),
            dataLabels: normalizeDataLabels(this.options.labels, { anchor: 'top' }),
            addContent: elements => this.addPlotContent(elements),
            emit,
        };
    }

    public async render() {
        return super.render(async () => {
            const { data, series, key } = this.options;
            const stacked = this.options.stacked ?? false;

            this.resolveSeriesColors(series);
            this.prepareAxes();

            const getKey = resolveAccessor<TData, string>(key);
            const keys = data.map(getKey);

            const areaSeries = series.filter((srs): srs is TrendChartAreaSeriesOptions<TData> => srs.type === 'area');
            const barSeries = series.filter((srs): srs is TrendChartBarSeriesOptions<TData> => srs.type === 'bar');
            const lineSeries = series.filter((srs): srs is TrendChartLineSeriesOptions<TData> => srs.type === 'line');

            // The value domain must cover every series, respecting per-type stacking.
            const extents: number[] = [0];

            if (stacked && barSeries.length > 0) {
                extents.push(...positiveNegativeExtent(barSeries, data, (srs, item) => this._seriesValue(srs, item)));
            } else {
                barSeries.forEach(srs => extents.push(...numberExtent(data, item => this._seriesValue(srs, item))));
            }

            if (stacked && areaSeries.length > 0) {
                extents.push(...cumulativeExtent(areaSeries, data, (srs, item) => this._seriesValue(srs, item)));
            } else {
                areaSeries.forEach(srs => extents.push(...numberExtent(data, item => this._seriesValue(srs, item))));
            }

            lineSeries.forEach(srs => extents.push(...numberExtent(data, item => this._seriesValue(srs, item))));

            const dataExtent = numberExtent(extents, functionIdentity);

            const layout = this.createLayout();
            this.reserveTitle(layout);

            const legendItems: LegendItem[] = series.length > 1
                ? series.map(srs => ({
                    id: srs.id,
                    label: typeIsFunction(srs.label) ? srs.id : srs.label,
                    color: this.getSeriesColor(srs.id),
                    active: true,
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

            // Provisional value scale to measure the y-axis width.
            this._yScale = scaleContinuous(dataExtent, [bottom, top], { padToTicks: 10 });
            this.yAxis.scale = this._yScale;
            this.yAxis.bounds = new Box(top, left, bottom, right);

            const yAxisBox = this.yAxis.getBoundingBox();

            // A band scale positions bars; its centres position line/area markers and the x-axis ticks.
            const xBand = scaleBand(keys, [yAxisBox.right, right], {
                outerPadding: 0.15,
                innerPadding: 0.2,
            });

            this.xAxis.scale = this.bandCenterScale(xBand, keys);
            this.xAxis.bounds = new Box(top, yAxisBox.right, bottom, right);

            const xAxisBox = this.xAxis.getBoundingBox();

            this._yScale = scaleContinuous(dataExtent, [xAxisBox.top, top], { padToTicks: 10 });
            this.yAxis.scale = this._yScale;
            this.yAxis.bounds.bottom = xAxisBox.top;

            // The navigator windows the x (category) axis only — the value axis stays at the full extent.
            const viewedBand = this.applyViewToScale(xBand, 'x');
            this._xCenter = this.bandCenterScale(viewedBand, keys);
            this.xAxis.scale = this._xCenter;

            const plot = {
                x: yAxisBox.right,
                y: top,
                width: right - yAxisBox.right,
                height: xAxisBox.top - top,
            };

            this.clipPlot(plot);
            this.renderGrid([], this._yScale.ticks(10).map(tick => this._yScale(tick)), plot);
            this.setupCrosshair(plot);

            // Draw back-to-front: areas (largest first), then bars, then lines/markers on top.
            const areaContext: AreaSeriesContext<TData> = {
                ...this._commonContext(plot, (phase, event) => this._emitMarker(phase, event)),
                xScale: this._xCenter,
                stacked,
                zIndexBase: 0,
            };

            const barContext: BarSeriesContext<TData> = {
                ...this._commonContext(plot, (phase, event) => this._emitBar(phase, event)),
                categoryScale: viewedBand,
                valueScale: this._yScale,
                orientation: 'vertical',
                stacked,
                borderRadius: this.options.borderRadius ?? 2,
                zIndexBase: areaSeries.length,
            };

            const lineContext: LineSeriesContext<TData> = {
                ...this._commonContext(plot, (phase, event) => this._emitMarker(phase, event)),
                xScale: this._xCenter,
                zIndexBase: areaSeries.length + barSeries.length,
            };

            const areaRender = this._areaRenderer.render(areaSeries, areaContext);
            const barRender = this._barRenderer.render(barSeries, barContext);
            const lineRender = this._lineRenderer.render(lineSeries, lineContext);

            this.registerHighlightGroups([
                ...this._areaRenderer.groups,
                ...this._barRenderer.groups,
                ...this._lineRenderer.groups,
            ]);

            this.renderNavigator(navBand, navBand ? this._overviewSeries() : [], [dataExtent[0], dataExtent[1]], stacked);

            return Promise.all([
                this.xAxis.visible ? this.xAxis.render() : Promise.resolve(),
                this.yAxis.visible ? this.yAxis.render() : Promise.resolve(),
                areaRender,
                barRender,
                lineRender,
            ]);
        });
    }

}

/**
 * Factory function that creates a new {@link TrendChart} instance.
 *
 * @example
 * ```ts
 * createTrendChart(target, {
 *     data: [
 *         { month: 'Jan', revenue: 120, profit: 40, target: 100 },
 *         { month: 'Feb', revenue: 150, profit: 55, target: 130 },
 *     ],
 *     key: 'month',
 *     series: [
 *         { id: 'revenue', type: 'area', label: 'Revenue', value: 'revenue' },
 *         { id: 'profit', type: 'bar', label: 'Profit', value: 'profit' },
 *         { id: 'target', type: 'line', label: 'Target', value: 'target' },
 *     ],
 *     overview: true,
 * });
 * ```
 */
export function createTrendChart<TData = unknown>(target: string | HTMLElement | Context, options: TrendChartOptions<TData>) {
    return new TrendChart<TData>(target, options);
}
