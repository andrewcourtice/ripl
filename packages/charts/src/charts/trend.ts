import type {
    BaseChartOptions,
} from '../core/chart';
import {
    Chart,
} from '../core/chart';

import type {
    ChartAxisInput,
    ChartGridInput,
    ChartLegendInput,
    ChartTooltipInput,
} from '../core/options';

import {
    formatNumber,
    normalizeAxis,
    normalizeAxisItem,
    normalizeGrid,
    normalizeTooltip,
    normalizeYAxisItem,
    resolveFormatLabel,
} from '../core/options';

import {
    ChartXAxis,
    ChartYAxis,
} from '../components/axis';

import {
    Tooltip,
} from '../components/tooltip';

import {
    applyHoverHighlight,
} from '../core/interaction';

import {
    correspondence,
    keysDiffer,
} from '../core/morph';

import type {
    LegendItem,
} from '../components/legend';

import {
    Grid,
} from '../components/grid';

import type {
    BandScale,
    Circle,
    CircleState,
    Context,
    EventMap,
    Group,
    Point,
    Polyline,
    PolylineRenderer,
    PolylineState,
    Rect,
    RectState,
    Scale,
} from '@ripl/core';
import {
    Box,
    createCircle,
    createGroup,
    createPolyline,
    createRect,
    createScale,
    easeOutCubic,
    easeOutQuart,
    getExtent,
    interpolatePath,
    interpolatePoints,
    max,
    queryAll,
    scaleBand,
    scaleContinuous,
    setColorAlpha,
} from '@ripl/core';

import {
    arrayJoin,
    functionIdentity,
    typeIsFunction,
} from '@ripl/utilities';

/** Supported series visualization types within a trend chart. */
export type SeriesType = 'bar' | 'line' | 'area';

/** Base configuration shared by all trend chart series types. */
export interface BaseTrendChartSeriesOptions<TData> {
    id: string;
    type: SeriesType;
    color?: string;
    value: keyof TData | number | ((item: TData) => number);
    label: string | ((item: TData) => string);
}

/** Series options for bar-type series within a trend chart. */
export interface TrendChartBarSeriesOptions<TData> extends BaseTrendChartSeriesOptions<TData> {
    type: 'bar';
}

/** Series options for area-type series within a trend chart. */
export interface TrendChartAreaSeriesOptions<TData> extends BaseTrendChartSeriesOptions<TData> {
    type: 'area';
    filled: boolean;
}

/** Series options for line-type series within a trend chart. */
export interface TrendChartLineSeriesOptions<TData> extends BaseTrendChartSeriesOptions<TData> {
    type: 'line';
    lineType?: PolylineRenderer;
}

/** Discriminated union of all trend chart series option types. */
export type TrendChartSeriesOptions<TData> = TrendChartBarSeriesOptions<TData>
| TrendChartAreaSeriesOptions<TData>
| TrendChartLineSeriesOptions<TData>;

/** Options for configuring a {@link TrendChart}. */
export interface TrendChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    series: TrendChartSeriesOptions<TData>[];
    key: keyof TData | ((item: TData) => string);
    grid?: ChartGridInput;
    tooltip?: ChartTooltipInput;
    legend?: ChartLegendInput;
    axis?: ChartAxisInput<TData>;
}

/** Payload emitted for trend bar/marker interaction events. */
export interface TrendChartValueEvent {
    x: number;
    y: number;
    value: number;
}

/** Events emitted by a {@link TrendChart} that consumers can subscribe to via `chart.on(...)`. */
export interface TrendChartEventMap extends EventMap {
    barclick: TrendChartValueEvent;
    barenter: TrendChartValueEvent;
    barleave: TrendChartValueEvent;
    markerclick: TrendChartValueEvent;
    markerenter: TrendChartValueEvent;
    markerleave: TrendChartValueEvent;
}

/**
 * Trend chart combining bar and line series on shared categorical/value axes.
 *
 * Renders bar series as grouped rectangles and line series as polylines with
 * markers on the same chart area. Supports tooltips, legend, grid, and
 * animated entry/update/exit transitions for both series types.
 *
 * @typeParam TData - The type of each data item in the dataset.
 */
export class TrendChart<TData = unknown> extends Chart<TrendChartOptions<TData>, TrendChartEventMap> {

    private barGroups: Group[] = [];
    private lineGroups: Group[] = [];
    /** Previous ordered data keys per line series, used to key-reconcile the morph across add/remove. */
    private morphKeys = new Map<string, string[]>();
    private yScale!: Scale;
    private xScaleBand!: BandScale<string>;
    private xScalePoint!: Scale<string>;
    private xAxis: ChartXAxis;
    private yAxis: ChartYAxis;
    private tooltip!: Tooltip;
    private grid?: Grid;
    constructor(target: string | HTMLElement | Context, options: TrendChartOptions<TData>) {
        super(target, options);

        const axisOpts = normalizeAxis(options.axis);
        const xAxis = normalizeAxisItem(axisOpts.x);
        const yAxis = normalizeYAxisItem(
            Array.isArray(axisOpts.y) ? axisOpts.y[0] : axisOpts.y
        );
        const gridOpts = normalizeGrid(options.grid);
        const tooltipOpts = normalizeTooltip(options.tooltip);

        this.xAxis = new ChartXAxis({
            scene: this.scene,
            renderer: this.renderer,
            bounds: Box.empty(),
            scale: this.xScalePoint,
            labelFont: xAxis.font,
            labelColor: xAxis.fontColor,
            formatLabel: resolveFormatLabel(xAxis.format),
            title: xAxis.title,
        });

        this.yAxis = new ChartYAxis({
            scene: this.scene,
            renderer: this.renderer,
            bounds: Box.empty(),
            scale: this.yScale,
            labelFont: yAxis.font,
            labelColor: yAxis.fontColor,
            formatLabel: resolveFormatLabel(yAxis.format),
            title: yAxis.title,
        });

        if (tooltipOpts.visible) {
            this.tooltip = new Tooltip({
                scene: this.scene,
                renderer: this.renderer,
                font: tooltipOpts.font,
                fontColor: tooltipOpts.fontColor,
                backgroundColor: tooltipOpts.backgroundColor,
            });
        }

        if (gridOpts.visible) {
            this.grid = new Grid({
                scene: this.scene,
                renderer: this.renderer,
                horizontal: true,
                vertical: false,
                stroke: gridOpts.lineColor,
                lineWidth: gridOpts.lineWidth,
                lineDash: gridOpts.lineDash,
            });
        }

        this.init();
    }

    /**
     * Wires hover highlight + tooltip onto a line marker. Uses {@link applyHoverHighlight} so
     * prior listeners are disposed on re-apply — calling this on every update no longer leaks.
     */
    private attachMarkerHover(marker: Circle, value: number, color: string) {
        const payload = (point: { x: number;
            y: number; }): TrendChartValueEvent => ({
            x: point.x,
            y: point.y,
            value,
        });

        applyHoverHighlight(marker, {
            renderer: this.renderer,
            duration: this.getAnimationDuration(300),
            ease: easeOutQuart,
            tooltip: this.tooltip,
            anchor: () => ({
                x: marker.cx,
                y: marker.cy,
            }),
            content: () => formatNumber(value),
            onEnter: point => this.emit('markerenter', payload(point)),
            onLeave: point => this.emit('markerleave', payload(point)),
            onClick: point => this.emit('markerclick', payload(point)),
            highlight: {
                fill: color,
                radius: 5,
            },
            restore: {
                fill: '#FFFFFF',
                radius: 3,
            },
        });
    }

    /**
     * Wires hover highlight + tooltip onto a bar. Uses {@link applyHoverHighlight} so prior
     * listeners are disposed on re-apply — calling this on every update no longer leaks.
     */
    private attachBarHover(bar: Rect, value: number, fill: string) {
        const payload = (point: { x: number;
            y: number; }): TrendChartValueEvent => ({
            x: point.x,
            y: point.y,
            value,
        });

        applyHoverHighlight(bar, {
            renderer: this.renderer,
            duration: this.getAnimationDuration(300),
            ease: easeOutQuart,
            tooltip: this.tooltip,
            anchor: () => ({
                x: bar.x + bar.width / 2,
                y: bar.y,
            }),
            content: () => formatNumber(value),
            onEnter: point => this.emit('barenter', payload(point)),
            onLeave: point => this.emit('barleave', payload(point)),
            onClick: point => this.emit('barclick', payload(point)),
            highlight: {
                fill,
            },
            restore: {
                fill: setColorAlpha(fill, 0.7),
            },
        });
    }

    private async drawLines() {
        const {
            data,
            series,
            key,
        } = this.options;

        const lineSeries = series.filter(srs => srs.type === 'line') as TrendChartLineSeriesOptions<TData>[];

        const {
            left: seriesEntries,
            inner: seriesUpdates,
            right: seriesExits,
        } = arrayJoin(lineSeries, this.lineGroups, 'id');

        seriesExits.forEach(el => el.destroy());

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const getKey = typeIsFunction(key) ? key : (item: any) => item[key] as string;

        const seriesLineValueProducer = ({ id, value: valueBy, label: labelBy }: TrendChartLineSeriesOptions<TData>) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getValue = typeIsFunction(valueBy) ? valueBy : (item: any) => item[valueBy] as number;
            const getLabel = typeIsFunction(labelBy) ? labelBy : () => labelBy;
            const color = this.getSeriesColor(id);

            return (item: TData) => {
                const key = getKey(item);
                const value = getValue(item);
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const label = getLabel(item);

                const x = this.xScalePoint(key);
                const y = this.yScale(value);

                return {
                    id: `${id}-${key}`,
                    point: [x, y] as Point,
                    state: {
                        fill: '#FFFFFF',
                        stroke: color,
                        lineWidth: 2,
                        cx: x,
                        cy: y,
                        radius: 3,
                    } as CircleState,
                };
            };
        };

        const seriesEntryGroups = seriesEntries.map(series => {

            const getMarkerValues = seriesLineValueProducer(series);

            const items = data.map(item => {
                const { id, point, state } = getMarkerValues(item);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const getValue = typeIsFunction(series.value) ? series.value : (item: any) => item[series.value] as number;
                const value = getValue(item);

                const marker = createCircle({
                    id,
                    ...state,
                    radius: 0,
                    data: state,
                });

                this.attachMarkerHover(marker, value, state.stroke as string);

                return {
                    point,
                    marker,
                };
            });

            const line = createPolyline({
                id: `${series.id}-line`,
                lineWidth: 2,
                stroke: this.getSeriesColor(series.id),
                points: items.map(item => item.point),
                renderer: series.lineType,
            });

            this.morphKeys.set(series.id, data.map(getKey));

            return createGroup({
                id: series.id,
                children: [
                    line,
                    ...items.map(item => item.marker),
                ],
            });
        });

        const seriesUpdateGroups = seriesUpdates.map(([series, group]) => {
            const getMarkerValues = seriesLineValueProducer(series);
            const line = group.getElementsByType('polyline')[0] as Polyline;
            const markers = group.getElementsByType('circle') as Circle[];

            const targetPoints = data.map(item => getMarkerValues(item).point);
            const newKeys = data.map(getKey);
            const prevKeys = this.morphKeys.get(series.id);

            // Apply the renderer directly (not via the transition, which would snap it at t=0.5),
            // and key-reconcile the point morph so curved lines stay curved across add/remove.
            line.renderer = series.lineType;

            line.data = {
                points: prevKeys && keysDiffer(prevKeys, newKeys)
                    ? interpolatePoints(line.points, targetPoints, {
                        resolveKeys: () => correspondence(prevKeys, newKeys),
                    })
                    : targetPoints,
            };

            this.morphKeys.set(series.id, newKeys);

            const {
                left: markerEntries,
                inner: markerUpdates,
                right: markerExits,
            } = arrayJoin(data, markers, (item, marker) => marker.id === `${series.id}-${getKey(item)}`);

            markerExits.forEach(el => el.destroy());

            markerEntries.map(item => {
                const { id, state } = getMarkerValues(item);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const getValue = typeIsFunction(series.value) ? series.value : (item: any) => item[series.value] as number;

                const marker = createCircle({
                    id,
                    ...state,
                    radius: 0,
                    data: state,
                });

                this.attachMarkerHover(marker, getValue(item), state.stroke as string);

                group.add(marker);
            });

            markerUpdates.forEach(([item, marker]) => {
                const { state } = getMarkerValues(item);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const getValue = typeIsFunction(series.value) ? series.value : (item: any) => item[series.value] as number;
                const value = getValue(item);

                marker.data = state;

                this.attachMarkerHover(marker, value, state.stroke as string);
            });

            return group;
        });

        this.scene.add(seriesEntryGroups);

        this.lineGroups = [
            ...seriesEntryGroups,
            ...seriesUpdateGroups,
        ];

        const entryTransitions = seriesEntryGroups.map(group => {
            const markers = group.queryAll('circle') as Circle[];
            const line = group.query('polyline') as Polyline;

            const lineTransition = this.renderer.transition(line, {
                duration: this.getAnimationDuration(1000),
                ease: easeOutCubic,
                state: {
                    points: interpolatePath(line.points),
                },
            });

            const markersTransition = this.renderer.transition(markers, (element, index, length) => ({
                duration: this.getAnimationDuration(1000),
                delay: index * (this.getAnimationDuration(1000) / length),
                ease: easeOutCubic,
                state: element.data as CircleState,
            }));

            return [
                lineTransition,
                markersTransition,
            ];
        });

        const updateTransitions = seriesUpdateGroups.map(group => {
            const markers = group.queryAll('circle') as Circle[];
            const line = group.query('polyline') as Polyline;

            const lineTransition = this.renderer.transition(line, {
                duration: this.getAnimationDuration(1000),
                ease: easeOutCubic,
                state: line.data as PolylineState,
            });

            const markersTransition = this.renderer.transition(markers, (element) => ({
                duration: this.getAnimationDuration(1000),
                ease: easeOutCubic,
                state: element.data as CircleState,
            }));

            return [
                lineTransition,
                markersTransition,
            ];
        });

        return Promise.all([
            ...entryTransitions,
            ...updateTransitions,
        ].flat());
    }

    private async drawBars() {
        const {
            data,
            series,
            key,
        } = this.options;

        const barSeries = series.filter(srs => srs.type === 'bar') as TrendChartBarSeriesOptions<TData>[];

        const {
            left: seriesEntries,
            inner: seriesUpdates,
            right: seriesExits,
        } = arrayJoin(barSeries, this.barGroups, 'id');

        seriesExits.forEach(el => el.destroy());

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const getKey = typeIsFunction(key) ? key : (item: any) => item[key] as string;
        const baseline = this.yScale(0);

        const xScaleSeries = scaleBand(barSeries.map(srs => srs.id), [0, this.xScaleBand.bandwidth], {
            innerPadding: 0.25,
        });

        const seriesBarValueProducer = ({ id, value: valueBy, label: labelBy }: TrendChartBarSeriesOptions<TData>) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getValue = typeIsFunction(valueBy) ? valueBy : (item: any) => item[valueBy] as number;
            const getLabel = typeIsFunction(labelBy) ? labelBy : () => labelBy;
            const color = this.getSeriesColor(id);

            return (item: TData) => {
                const key = getKey(item);
                const value = getValue(item);
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const label = getLabel(item);

                const x = this.xScaleBand(key) + xScaleSeries(id);
                const y = this.yScale(max(0, value));
                const width = xScaleSeries.bandwidth;
                const height = Math.abs(baseline - this.yScale(value));

                return {
                    id: `${id}-${key}`,
                    state: {
                        fill: color,
                        x,
                        y,
                        width,
                        height,
                    } as RectState,
                };
            };
        };

        const seriesEntryGroups = seriesEntries.map((series) => {

            const getBarValues = seriesBarValueProducer(series);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getValue = typeIsFunction(series.value) ? series.value : (item: any) => item[series.value] as number;

            const children = data.map(item => {
                const { id, state } = getBarValues(item);
                const value = getValue(item);

                const bar = createRect({
                    id,
                    ...state,
                    fill: setColorAlpha(state.fill as string, 0.7),
                    y: baseline,
                    height: 0,
                    data: {
                        ...state,
                        fill: setColorAlpha(state.fill as string, 0.7),
                    },
                });

                this.attachBarHover(bar, value, state.fill as string);

                return bar;
            });

            return createGroup({
                id: series.id,
                children,
            });
        });

        const seriesUpdateGroups = seriesUpdates.map(([series, group]) => {
            const getBarValues = seriesBarValueProducer(series);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getValue = typeIsFunction(series.value) ? series.value : (item: any) => item[series.value] as number;
            const bars = group.getElementsByType('rect') as Rect[];

            const {
                left: barEntries,
                inner: barUpdates,
                right: barExits,
            } = arrayJoin(data, bars, (item, bar) => bar.id === `${series.id}-${getKey(item)}`);

            barExits.forEach(el => el.destroy());

            barEntries.map(item => {
                const { id, state } = getBarValues(item);

                const rect = createRect({
                    id,
                    ...state,
                    y: baseline,
                    height: 0,
                    data: state,
                });

                this.attachBarHover(rect, getValue(item), state.fill as string);

                group.add(rect);
            });

            barUpdates.forEach(([item, bar]) => {
                const { state } = getBarValues(item);
                const value = getValue(item);

                bar.data = {
                    ...state,
                    fill: setColorAlpha(state.fill as string, 0.7),
                };

                this.attachBarHover(bar, value, state.fill as string);
            });

            return group;
        });

        this.scene.add(seriesEntryGroups);

        this.barGroups = [
            ...seriesEntryGroups,
            ...seriesUpdateGroups,
        ];

        const barEntries = (queryAll(seriesEntryGroups, 'rect') as Rect[]).sort((a, b) => a.x - b.x);

        const entriesTransition = this.renderer.transition(barEntries, (element, index, length) => ({
            duration: this.getAnimationDuration(1000),
            delay: index * (this.getAnimationDuration(1000) / length),
            ease: easeOutCubic,
            state: element.data as RectState,
        }));

        const updatesTransition = this.renderer.transition(queryAll(seriesUpdateGroups, 'rect') as Rect[], element => ({
            duration: this.getAnimationDuration(1000),
            ease: easeOutCubic,
            state: element.data as RectState,
        }));

        return Promise.all([
            entriesTransition,
            updatesTransition,
        ]);
    }

    public async render() {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        return super.render((scene, renderer) => {
            const {
                data,
                series,
                key,
            } = this.options;

            this.resolveSeriesColors(series);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getKey = typeIsFunction(key) ? key : (item: any) => item[key] as string;
            const keys = data.map(getKey);
            const seriesExtents = series.flatMap(({ value: valueAccessor }) => {
                const getValue = typeIsFunction(valueAccessor)
                    ? valueAccessor
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    : (item: any) => item[valueAccessor] as number;

                return getExtent(data, getValue);
            }).concat(0);

            const dataExtent = getExtent(seriesExtents, functionIdentity);

            // Shared layout pass: reserve title and legend bands.
            const layout = this.createLayout();
            this.reserveTitle(layout);

            const legendItems: LegendItem[] = series.length > 1
                ? series.map(srs => ({
                    id: srs.id,
                    label: typeIsFunction(srs.label) ? srs.id : srs.label as string,
                    color: this.getSeriesColor(srs.id),
                    active: true,
                }))
                : [];

            this.reserveLegend(layout, legendItems, this.options.legend);

            const area = layout.area;
            const chartTop = area.y;
            const chartBottom = area.y + area.height;
            const chartRight = area.x + area.width;

            this.yScale = scaleContinuous(dataExtent, [chartBottom, chartTop], {
                padToTicks: 10,
            });

            this.yAxis.scale = this.yScale;
            this.yAxis.bounds = new Box(
                chartTop,
                area.x,
                chartBottom,
                chartRight
            );

            const yAxisBoundingBox = this.yAxis.getBoundingBox();

            this.xScaleBand = scaleBand(keys, [yAxisBoundingBox.right, chartRight], {
                outerPadding: 0.25,
                innerPadding: 0.25,
            });

            this.xScalePoint = createScale({
                domain: this.xScaleBand.domain,
                range: this.xScaleBand.range,
                convert: value => this.xScaleBand(value) + this.xScaleBand.bandwidth / 2,
                invert: value => this.xScaleBand.inverse(value),
            });

            this.xAxis.scale = this.xScalePoint;
            this.xAxis.bounds = new Box(
                chartTop,
                yAxisBoundingBox.right,
                chartBottom,
                chartRight
            );

            const xAxisBoundingBox = this.xAxis.getBoundingBox();

            this.yScale = scaleContinuous(dataExtent, [xAxisBoundingBox.top, chartTop], {
                padToTicks: 10,
            });

            this.yAxis.scale = this.yScale;
            this.yAxis.bounds.bottom = xAxisBoundingBox.top;

            // Render grid
            if (this.grid) {
                const yTicks = this.yScale.ticks(10);
                const yTickPositions = yTicks.map(tick => this.yScale(tick));

                this.grid.render(
                    [],
                    yTickPositions,
                    yAxisBoundingBox.right,
                    chartTop,
                    chartRight - yAxisBoundingBox.right,
                    xAxisBoundingBox.top - chartTop
                );
            }

            return Promise.all([
                this.xAxis.render(),
                this.yAxis.render(),
                this.drawBars(),
                this.drawLines(),
            ]);
        });
    }

}

/** Factory function that creates a new {@link TrendChart} instance. */
export function createTrendChart<TData = unknown>(target: string | HTMLElement | Context, options: TrendChartOptions<TData>) {
    return new TrendChart<TData>(target, options);
}
