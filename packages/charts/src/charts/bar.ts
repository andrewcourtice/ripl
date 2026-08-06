import type {
    NumericAccessor,
} from '../core/data';

import type {
    AxisTooltipSnapshot,
    CartesianChartOptions,
    CartesianSetup,
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
    scaleBand,
} from '@ripl/core';

import {
    functionIdentity,
    numberExtent,
    numberSum,
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
    /** Unique identifier for the series, used for color assignment, legend, and data joins. */
    id: string;
    /** Explicit series color; falls back to the chart's generated palette when omitted. */
    color?: string;
    /** Accessor for the series' value at each data item, or a constant applied to every item. */
    value: NumericAccessor<TData> | number;
    /** Human-readable series name shown in the legend and tooltips. */
    label: string;
    /**
     * The `id` of the y-axis this series binds to. Defaults to the primary axis. Takes effect for
     * vertical grouped bars; stacked/percent modes and horizontal orientation always render against
     * the primary axis.
     */
    yAxis?: string;
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

    private _percentSeries(series: BarChartSeriesOptions<TData>[], data: TData[]): BarChartSeriesOptions<TData>[] {
        const totals = new Map<TData, number>(data.map(item => [
            item,
            numberSum(series, srs => Math.max(0, this._seriesValue(srs, item))),
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
     * (horizontal lines for vertical bars, vertical lines for horizontal bars), re-resolved each
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

    /** Builds the per-series overview data (id, color, type, values) for the navigator strip. */
    private _overviewSeries(): ChartNavigatorSeries[] {
        const { data, series } = this.options;

        return this.buildOverviewSeries(this.filterActive(series), data, () => 'bar', (srs, item) => this._seriesValue(srs, item));
    }

    // Axis-tooltip content for the hovered plot x. Vertical only; horizontal keeps item tooltips.
    private _axisTooltipSnapshot(
        plotX: number,
        keys: string[],
        series: BarChartSeriesOptions<TData>[],
        categoryScale: Scale<string>,
        scaleFor: (series: BarChartSeriesOptions<TData>) => Scale
    ): AxisTooltipSnapshot | null {
        if (keys.length === 0 || series.length === 0) {
            return null;
        }

        let nearest = 0;
        let best = Number.POSITIVE_INFINITY;

        keys.forEach((key, index) => {
            const distance = Math.abs(categoryScale(key) - plotX);

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
            const scale = scaleFor(srs);

            // The tallest bar top is the highest (smallest-y) of every series' bar edge at the category.
            anchorY = Math.min(anchorY, scale(Math.max(0, value)), scale(0));

            return {
                label: srs.label,
                value: formatValue(value),
            };
        });

        return {
            title: key,
            rows,
            x: categoryScale(key),
            y: Number.isFinite(anchorY) ? anchorY : 0,
        };
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
            // In axis-trigger mode the shared tooltip owns the pointer; per-item tooltips stay quiet.
            tooltip: this.tooltipTrigger === 'axis' ? undefined : this.tooltip,
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

            // Reserve the navigator band before the axes are measured
            const navBand = this.reserveNavigatorBand(layout);

            const area = layout.area;
            const left = area.x;
            const top = area.y;
            const right = area.x + area.width;
            const bottom = area.y + area.height;

            // Multi-axis is vertical grouped only: stacked can't mix scales, horizontal has no right band
            if (this.yAxes.length > 1 && !this._isHorizontal && !this._isStacked) {
                return this._renderMultiAxis({
                    series: activeSeries,
                    keys,
                    navBand,
                    left,
                    top,
                    right,
                    bottom,
                });
            }

            if (this._isHorizontal) {
                // Categories on Y, values on X.
                let categoryScale!: BandScale<string>;
                let adjustedValueScale!: Scale;

                const horizontalPlot = this.resolveCartesianPlot(area, candidate => {
                    adjustedValueScale = createValueScale(this.xAxisOptions, dataExtent, [candidate.x, candidate.x + candidate.width]);
                    this.xAxis.scale = adjustedValueScale;

                    categoryScale = scaleBand(keys, [candidate.y, candidate.y + candidate.height], {
                        outerPadding: 0.15,
                        innerPadding: 0.2,
                    });

                    this.yAxis.scale = this.bandCenterScale(categoryScale, keys);
                });

                const viewedCategoryScale = this.applyViewToScale(categoryScale, 'y');
                this.yAxis.scale = this.bandCenterScale(viewedCategoryScale, keys);

                this.clipPlot(horizontalPlot);
                // Null resolver tears down listeners from a prior vertical render so a stale snapshot can't fire
                this.setupAxisTooltip(horizontalPlot, () => null);

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
                    this.xAxis.visible ? this.xAxis.render() : this.xAxis.hide(),
                    this.yAxis.visible ? this.yAxis.render() : this.yAxis.hide(),
                    seriesRender,
                ]);
            }

            // Categories on X, values on Y.
            let categoryScale!: BandScale<string>;
            let adjustedValueScale!: Scale;

            const verticalPlot = this.resolveCartesianPlot(area, candidate => {
                adjustedValueScale = createValueScale(this.yAxisOptions, dataExtent, [candidate.y + candidate.height, candidate.y]);
                this.yAxis.scale = adjustedValueScale;

                categoryScale = scaleBand(keys, [candidate.x, candidate.x + candidate.width], {
                    outerPadding: 0.15,
                    innerPadding: 0.2,
                });

                this.xAxis.scale = this.bandCenterScale(categoryScale, keys);
            });

            const viewedCategoryScale = this.applyViewToScale(categoryScale, 'x');
            const categoryCenterScale = this.bandCenterScale(viewedCategoryScale, keys);
            this.xAxis.scale = categoryCenterScale;

            this.clipPlot(verticalPlot);
            this.setupAxisTooltip(verticalPlot, plotX => this._axisTooltipSnapshot(plotX, keys, activeSeries, categoryCenterScale, () => adjustedValueScale));

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
                this.xAxis.visible ? this.xAxis.render() : this.xAxis.hide(),
                this.yAxis.visible ? this.yAxis.render() : this.yAxis.hide(),
                seriesRender,
            ]);
        });
    }

    private _renderMultiAxis(ctx: {
        series: BarChartSeriesOptions<TData>[];
        keys: string[];
        navBand?: ChartArea;
        left: number;
        top: number;
        right: number;
        bottom: number;
    }): Promise<unknown> {
        const { series, keys, navBand, left, top, right, bottom } = ctx;

        // Independent value extent per axis over the active series bound to it.
        const extents = this.groupSeriesByAxis(series).map(group => numberExtent(group
            .flatMap(srs => numberExtent(this.options.data, item => this._seriesValue(srs, item)))
            .concat(0), functionIdentity));

        // Before the plot is resolved, so an axis nothing binds to reserves no band either.
        this.hideUnboundAxes(series);

        let scales: Scale[] = [];
        let categoryScale!: BandScale<string>;

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

            categoryScale = scaleBand(keys, [candidate.x, candidate.x + candidate.width], {
                outerPadding: 0.15,
                innerPadding: 0.2,
            });

            this.xAxis.scale = this.bandCenterScale(categoryScale, keys);
        });

        // The navigator windows the category axis only.
        const viewedCategoryScale = this.applyViewToScale(categoryScale, 'x');
        const categoryCenterScale = this.bandCenterScale(viewedCategoryScale, keys);
        this.xAxis.scale = categoryCenterScale;

        const scaleBySeries = new Map(series.map(srs => [srs.id, scales[this.resolveSeriesAxisIndex(srs.yAxis)] ?? scales[0]]));
        const scaleFor = (srs: { id: string }) => scaleBySeries.get(srs.id) ?? scales[0];

        this.clipPlot(plot);
        this.setupAxisTooltip(plot, plotX => this._axisTooltipSnapshot(plotX, keys, series, categoryCenterScale, scaleFor));
        this.renderGrid([], this.gridTicks(scales[0], axisTickCount(this.yAxesOptions[0])), plot);
        this.renderAnnotations({ y: scales[0] }, plot);

        const barCtx = this._seriesContext(viewedCategoryScale, scales[0], plot);

        barCtx.resolveScale = scaleFor;

        const seriesRender = this._series.render(series, barCtx);

        this.registerHighlightGroups(this._series.groups);
        this.renderNavigator(navBand, navBand ? this._overviewSeries() : [], [extents[0][0], extents[0][1]], false);

        return Promise.all([
            this.xAxis.visible ? this.xAxis.render() : this.xAxis.hide(),
            ...this.yAxes.map(axis => axis.visible ? axis.render() : axis.hide()),
            seriesRender,
        ]);
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
