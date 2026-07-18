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
}

/** Options for configuring an {@link AreaChart}. */
export interface AreaChartOptions<TData = unknown> extends CartesianChartOptions<TData> {
    /** The dataset rendered by the chart. */
    data: TData[];
    /** The series to draw from each data item. */
    series: AreaChartSeriesOptions<TData>[];
    /** Accessor for each item's category key (the value plotted along the x axis). */
    key: keyof TData | ((item: TData) => string);
    /** Stack series cumulatively instead of overlaying them. Defaults to false. */
    stacked?: boolean;
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

    private _emitMarker(phase: SeriesEventPhase, event: SeriesInteractionEvent): void {
        this.emit(MARKER_EVENTS[phase], event);
    }

    /** Builds the per-series overview data (id, colour, type, values) for the navigator strip. */
    private _overviewSeries(): ChartNavigatorSeries[] {
        const { data, series } = this.options;

        return this.buildOverviewSeries(series, data, () => 'area', (srs, item) => this._seriesValue(srs, item));
    }

    private _seriesContext(plot: ChartArea): AreaSeriesContext<TData> {
        return {
            data: this.options.data,
            getKey: resolveAccessor<TData, string>(this.options.key),
            yScale: this._yScale,
            xScale: this._xScale,
            stacked: this.options.stacked ?? false,
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
            const { data, series, key, stacked } = this.options;

            this.resolveSeriesColors(series);
            this.prepareAxes();

            const getKey = resolveAccessor<TData, string>(key);
            const keys = data.map(getKey);

            let dataExtent: number[];

            if (stacked) {
                dataExtent = cumulativeExtent(series, data, (srs, item) => this._seriesValue(srs, item));
            } else {
                const seriesExtents = series
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

            this._yScale = createValueScale(this.yAxisOptions, dataExtent, [bottom, top]);
            this.yAxis.scale = this._yScale;
            this.yAxis.bounds = new Box(top, left, bottom, right);

            const yAxisBox = this.yAxis.getBoundingBox();

            this._xScale = this.pointScale(keys, yAxisBox.right, right);
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
            this.renderGrid([], this._yScale.ticks(axisTickCount(this.yAxisOptions)).map(tick => this._yScale(tick)), plot);
            this.setupCrosshair(plot);

            this.renderAnnotations({ y: this._yScale }, plot);

            const seriesRender = this._series.render(series, this._seriesContext(plot));
            this.registerHighlightGroups(this._series.groups);

            this.renderNavigator(navBand, navBand ? this._overviewSeries() : [], [dataExtent[0], dataExtent[1]], stacked ?? false);

            return Promise.all([
                this.xAxis.visible ? this.xAxis.render() : Promise.resolve(),
                this.yAxis.visible ? this.yAxis.render() : Promise.resolve(),
                seriesRender,
            ]);
        });
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
