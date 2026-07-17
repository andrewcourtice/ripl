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
    Context,
    EventMap,
    PolylineRenderer,
    Scale,
} from '@ripl/core';

import {
    Box,
    scaleContinuous,
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

        return this.buildOverviewSeries(series, data, () => 'line', (srs, item) => resolveAccessor<TData, number>(srs.value)(item));
    }

    private _seriesContext(plot: ChartArea): LineSeriesContext<TData> {
        return {
            data: this.options.data,
            getKey: resolveAccessor<TData, string>(this.options.key),
            yScale: this._yScale,
            xScale: this._xScale,
            plot,
            baseline: this._yScale(0),
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

            const seriesExtents = series
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

            this._xScale = this.pointScale(keys, yAxisBox.right, right);
            this.xAxis.scale = this._xScale;
            this.xAxis.bounds = new Box(top, yAxisBox.right, bottom, right);

            const xAxisBox = this.xAxis.getBoundingBox();

            this._yScale = scaleContinuous(dataExtent, [xAxisBox.top, top], { padToTicks: 10 });
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
                this._yScale.ticks(10).map(tick => this._yScale(tick)),
                plot
            );

            this.setupCrosshair(plot);

            const seriesRender = this._series.render(series, this._seriesContext(plot));
            this.registerHighlightGroups(this._series.groups);

            this.renderNavigator(navBand, navBand ? this._overviewSeries() : [], [dataExtent[0], dataExtent[1]]);

            return Promise.all([
                this.xAxis.visible ? this.xAxis.render() : Promise.resolve(),
                this.yAxis.visible ? this.yAxis.render() : Promise.resolve(),
                seriesRender,
            ]);
        });
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
