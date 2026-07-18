import type {
    NumericAccessor,
} from '../core/data';

import type {
    CartesianChartOptions,
    CartesianSetup,
} from '../core/cartesian';

import {
    CartesianChart,
} from '../core/cartesian';

import type {
    ChartAxisInput,
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

import {
    positiveNegativeExtent,
    resolveAccessor,
} from '../core/data';

import {
    axisTickCount,
    createValueScale,
} from '../core/scales';

import {
    BarSeriesRenderer,
} from '../core/series/bar-series';

import type {
    BarSeriesContext,
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
    BandScale,
    Context,
    EventMap,
    Scale,
} from '@ripl/core';

import {
    Box,
    scaleBand,
} from '@ripl/core';

import {
    functionIdentity,
    numberExtent,
} from '@ripl/utilities';

/** Whether bars are laid out vertically (default) or horizontally. */
export type BarChartOrientation = 'vertical' | 'horizontal';

/** Maps a pointer interaction phase to the corresponding bar-chart event name. */
const BAR_EVENTS = {
    enter: 'barenter',
    leave: 'barleave',
    click: 'barclick',
} as const;

/** Configuration for an individual bar chart series. */
export interface BarChartSeriesOptions<TData> {
    /** Unique identifier for the series, used for colour assignment, legend, and data joins. */
    id: string;
    /** Explicit series colour; falls back to the chart's generated palette when omitted. */
    color?: string;
    /** Accessor for the series' value at each data item, or a constant applied to every item. */
    value: NumericAccessor<TData> | number;
    /** Human-readable series name shown in the legend and tooltips. */
    label: string;
}

/** Options for configuring a {@link BarChart}. */
export interface BarChartOptions<TData = unknown> extends CartesianChartOptions<TData> {
    /** The dataset rendered by the chart. */
    data: TData[];
    /** The series to draw from each data item. */
    series: BarChartSeriesOptions<TData>[];
    /** Accessor for each item's category key (the value plotted along the categorical axis). */
    key: keyof TData | ((item: TData) => string);
    /** Whether bars run vertically (default) or horizontally. */
    orientation?: BarChartOrientation;
    /**
     * Whether multiple series are stacked into a single bar per category (`true`) or grouped side
     * by side (default `false`). Pass `'percent'` for a 100%-stacked chart: each category's values
     * are normalized to their share of the category's positive total (negative values contribute
     * zero), the value axis is fixed to 0–100%, and values default to percentage formatting.
     */
    stacked?: boolean | 'percent';
    /** Background grid configuration (`true`/`false` or detailed grid options). */
    grid?: ChartGridInput;
    /** Hover tooltip configuration (`true`/`false` or detailed tooltip options). */
    tooltip?: ChartTooltipInput;
    /** Legend configuration (`true`/`false`, a position, or detailed legend options). */
    legend?: ChartLegendInput;
    /** Axis configuration for the categorical and value axes. */
    axis?: ChartAxisInput<TData>;
    /** Corner radius in pixels applied to each bar. Defaults to 2. */
    borderRadius?: number;
    /** Show value labels next to each bar. `true` uses the default anchor; a string sets the anchor side. */
    labels?: ChartDataLabelsInput;
    /** Format applied to bar values shown as text (tooltips and labels). */
    format?: ValueFormatInput;
}

/** Payload emitted for bar interaction events. */
export interface BarChartBarEvent {
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

/** Events emitted by a {@link BarChart} that consumers can subscribe to via `chart.on(...)`. */
export interface BarChartEventMap extends EventMap {
    /** Emitted when a bar is clicked. */
    barclick: BarChartBarEvent;
    /** Emitted when the pointer enters a bar. */
    barenter: BarChartBarEvent;
    /** Emitted when the pointer leaves a bar. */
    barleave: BarChartBarEvent;
}

/**
 * Bar chart supporting vertical/horizontal orientation and grouped/stacked modes.
 *
 * Uses band scales for categorical axes and continuous scales for value axes. Supports multiple
 * series with grouped or stacked bar rendering, interactive tooltips, legend, grid, chart title,
 * and animated entry/update/exit transitions. In stacked mode only the outermost segment is
 * rounded (on its outer corners) and the column reveals as a single rising fill on entry rather
 * than each segment animating separately.
 *
 * @typeParam TData - The type of each data item in the dataset.
 */
export class BarChart<TData = unknown> extends CartesianChart<BarChartOptions<TData>, TData, BarChartEventMap> {

    private _series = new BarSeriesRenderer<TData>();

    constructor(target: string | HTMLElement | Context, options: BarChartOptions<TData>) {
        super(target, options);

        this.setupCartesian();

        this.init();
    }

    private get _isHorizontal() {
        return this.options.orientation === 'horizontal';
    }

    private get _isStacked() {
        return this.options.stacked === true || this._isPercent;
    }

    private get _isPercent() {
        return this.options.stacked === 'percent';
    }

    // Wraps each series' value accessor to return its share of the category's positive total,
    // computed over the ACTIVE series so legend toggling renormalizes the remaining shares.
    private _percentSeries(series: BarChartSeriesOptions<TData>[], data: TData[]): BarChartSeriesOptions<TData>[] {
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

    /**
     * Derives the cartesian setup from the current `orientation` so grid lines run across the bars
     * (horizontal lines for vertical bars, vertical lines for horizontal bars) — re-resolved each
     * render so `chart.update({ orientation })` flips the grid direction too.
     */
    protected override resolveCartesianSetup(): CartesianSetup {
        return {
            grid: {
                horizontal: !this._isHorizontal,
                vertical: this._isHorizontal,
            },
        };
    }

    /** Bar charts window their category axis: y when horizontal (side strip), x otherwise (bottom strip). */
    protected override navigationAxis(): 'x' | 'y' {
        return this._isHorizontal ? 'y' : 'x';
    }

    /** Bars are laid out in padded category bands, so the overview strip mirrors that band placement. */
    protected override navigatorCategoryLayout(): 'band' {
        return 'band';
    }

    private _seriesValue(series: BarChartSeriesOptions<TData>, item: TData): number {
        return resolveAccessor<TData, number>(series.value)(item);
    }

    private _emitBar(phase: SeriesEventPhase, event: SeriesInteractionEvent): void {
        this.emit(BAR_EVENTS[phase], event);
    }

    /** Builds the per-series overview data (id, colour, type, values) for the navigator strip. */
    private _overviewSeries(): ChartNavigatorSeries[] {
        const { data, series } = this.options;

        return this.buildOverviewSeries(this.filterActive(series), data, () => 'bar', (srs, item) => this._seriesValue(srs, item));
    }

    private _seriesContext(categoryScale: BandScale<string>, valueScale: Scale, plot: ChartArea): BarSeriesContext<TData> {
        return {
            data: this.options.data,
            getKey: resolveAccessor<TData, string>(this.options.key),
            yScale: valueScale,
            valueScale,
            categoryScale,
            orientation: this._isHorizontal ? 'horizontal' : 'vertical',
            stacked: this._isStacked,
            borderRadius: this.options.borderRadius ?? 2,
            plot,
            baseline: valueScale(0),
            renderer: this.renderer,
            tooltip: this.tooltip,
            getColor: id => this.getSeriesColor(id),
            resolveAnimation: reference => this.resolveAnimation(reference),
            formatValue: resolveValueFormat(this.options.format ?? (this._isPercent ? 'percentage' : undefined)),
            dataLabels: normalizeDataLabels(this.options.labels, { anchor: this._isHorizontal ? 'right' : 'top' }),
            addContent: elements => this.addPlotContent(elements),
            emit: (phase, event) => this._emitBar(phase, event),
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
            // Percent mode additionally wraps the active series' value accessors in share space.
            const activeSeries = this._isPercent
                ? this._percentSeries(this.filterActive(series), data)
                : this.filterActive(series);

            const seriesExtents = activeSeries.flatMap(srs => numberExtent(data, item => this._seriesValue(srs, item))).concat(0);
            let dataExtent = numberExtent(seriesExtents, functionIdentity);

            if (this._isPercent) {
                dataExtent = [0, 1];
            } else if (this._isStacked) {
                dataExtent = positiveNegativeExtent(activeSeries, data, (srs, item) => this._seriesValue(srs, item));
            }

            if (this._isPercent) {
                const valueAxis = this._isHorizontal ? this.xAxis : this.yAxis;

                valueAxis.formatLabel ??= resolveFormatLabel('percentage');
            }

            // Shared layout pass: title and legend reserve their bands first.
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

            // Reserve the overview strip band before the axes are measured (a side band for a horizontal
            // bar chart, a bottom band for a vertical one).
            const navBand = this.reserveNavigatorBand(layout);

            const area = layout.area;
            const left = area.x;
            const top = area.y;
            const right = area.x + area.width;
            const bottom = area.y + area.height;

            if (this._isHorizontal) {
                // Categories on Y, values on X.
                const valueScale = createValueScale(this.xAxisOptions, dataExtent, [left, right]);

                this.xAxis.scale = valueScale;
                this.xAxis.bounds = new Box(top, left, bottom, right);

                const xAxisBox = this.xAxis.getBoundingBox();

                const categoryScale = scaleBand(keys, [top, xAxisBox.top], {
                    outerPadding: 0.15,
                    innerPadding: 0.2,
                });

                this.yAxis.scale = this.bandCenterScale(categoryScale, keys);
                this.yAxis.bounds = new Box(top, left, xAxisBox.top, right);

                const yAxisBox = this.yAxis.getBoundingBox();

                const adjustedValueScale = createValueScale(this.xAxisOptions, dataExtent, [yAxisBox.right, right]);
                this.xAxis.scale = adjustedValueScale;
                this.xAxis.bounds = new Box(top, yAxisBox.right, bottom, right);

                // The navigator windows the y (category) axis only — the value axis (x) stays at the full
                // extent, so the side strip scrubs vertically without rescaling the value domain.
                const viewedCategoryScale = this.applyViewToScale(categoryScale, 'y');
                this.yAxis.scale = this.bandCenterScale(viewedCategoryScale, keys);

                const horizontalPlot = {
                    x: yAxisBox.right,
                    y: top,
                    width: right - yAxisBox.right,
                    height: xAxisBox.top - top,
                };

                this.clipPlot(horizontalPlot);

                this.renderGrid(
                    this.gridTicks(adjustedValueScale, axisTickCount(this.xAxisOptions)),
                    [],
                    horizontalPlot
                );

                this.renderAnnotations({ x: adjustedValueScale }, horizontalPlot);

                const seriesRender = this._series.render(activeSeries, this._seriesContext(viewedCategoryScale, adjustedValueScale, horizontalPlot));
                this.registerHighlightGroups(this._series.groups);

                this.renderNavigator(navBand, navBand ? this._overviewSeries() : [], [dataExtent[0], dataExtent[1]], this._isStacked);

                return Promise.all([
                    this.xAxis.visible ? this.xAxis.render() : Promise.resolve(),
                    this.yAxis.visible ? this.yAxis.render() : Promise.resolve(),
                    seriesRender,
                ]);
            }

            // Categories on X, values on Y.
            const valueScale = createValueScale(this.yAxisOptions, dataExtent, [bottom, top]);

            this.yAxis.scale = valueScale;
            this.yAxis.bounds = new Box(top, left, bottom, right);

            const yAxisBox = this.yAxis.getBoundingBox();

            const categoryScale = scaleBand(keys, [yAxisBox.right, right], {
                outerPadding: 0.15,
                innerPadding: 0.2,
            });

            this.xAxis.scale = this.bandCenterScale(categoryScale, keys);
            this.xAxis.bounds = new Box(top, yAxisBox.right, bottom, right);

            const xAxisBox = this.xAxis.getBoundingBox();

            const adjustedValueScale = createValueScale(this.yAxisOptions, dataExtent, [xAxisBox.top, top]);
            this.yAxis.scale = adjustedValueScale;
            this.yAxis.bounds = new Box(top, left, xAxisBox.top, right);

            // The navigator windows the x (category) axis only — the value axis (y) stays at the full
            // extent, so the bottom strip scrubs horizontally without rescaling the value domain.
            const viewedCategoryScale = this.applyViewToScale(categoryScale, 'x');
            this.xAxis.scale = this.bandCenterScale(viewedCategoryScale, keys);

            const verticalPlot = {
                x: yAxisBox.right,
                y: top,
                width: right - yAxisBox.right,
                height: xAxisBox.top - top,
            };

            this.clipPlot(verticalPlot);

            this.renderGrid(
                [],
                this.gridTicks(adjustedValueScale, axisTickCount(this.yAxisOptions)),
                verticalPlot
            );

            this.renderAnnotations({ y: adjustedValueScale }, verticalPlot);

            const seriesRender = this._series.render(activeSeries, this._seriesContext(viewedCategoryScale, adjustedValueScale, verticalPlot));
            this.registerHighlightGroups(this._series.groups);

            this.renderNavigator(navBand, navBand ? this._overviewSeries() : [], [dataExtent[0], dataExtent[1]], this._isStacked);

            return Promise.all([
                this.xAxis.visible ? this.xAxis.render() : Promise.resolve(),
                this.yAxis.visible ? this.yAxis.render() : Promise.resolve(),
                seriesRender,
            ]);
        });
    }

}

/**
 * Factory function that creates a new {@link BarChart} instance.
 *
 * @example
 * ```ts
 * createBarChart(target, {
 *     data: [
 *         { quarter: 'Q1', revenue: 120 },
 *         { quarter: 'Q2', revenue: 155 },
 *     ],
 *     key: 'quarter',
 *     series: [
 *         { id: 'revenue', label: 'Revenue', value: 'revenue' },
 *     ],
 * });
 * ```
 */
export function createBarChart<TData = unknown>(target: string | HTMLElement | Context, options: BarChartOptions<TData>) {
    return new BarChart<TData>(target, options);
}
