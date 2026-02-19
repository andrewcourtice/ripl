import {
    BaseChartOptions,
    Chart,
} from '../core/chart';

import {
    ChartXAxis,
    ChartYAxis,
} from '../components/axis';

import {
    Tooltip,
} from '../components/tooltip';

import {
    Legend,
    LegendItem,
} from '../components/legend';

import {
    Grid,
} from '../components/grid';

import {
    BandScale,
    Box,
    Circle,
    CircleState,
    Context,
    createCircle,
    createGroup,
    createPolyline,
    createRect,
    createScale,
    easeOutCubic,
    easeOutQuart,
    getExtent,
    Group,
    interpolatePath,
    max,
    Point,
    Polyline,
    PolylineRenderer,
    PolylineState,
    queryAll,
    Rect,
    RectState,
    Scale,
    scaleBand,
    scaleContinuous,
    setColorAlpha,
} from '@ripl/core';

import {
    arrayFilter,
    arrayFlatMap,
    arrayForEach,
    arrayJoin,
    arrayMap,
    functionIdentity,
    typeIsFunction,
} from '@ripl/utilities';

export type SeriesType = 'bar' | 'line' | 'area';
export interface BaseTrendChartSeriesOptions<TData> {
    id: string;
    type: SeriesType;
    color?: string;
    valueBy: keyof TData | number | ((item: TData) => number);
    labelBy: string | ((item: TData) => string);
}

export interface TrendChartBarSeriesOptions<TData> extends BaseTrendChartSeriesOptions<TData> {
    type: 'bar';
}

export interface TrendChartAreaSeriesOptions<TData> extends BaseTrendChartSeriesOptions<TData> {
    type: 'area';
    filled: boolean;
}

export interface TrendChartLineSeriesOptions<TData> extends BaseTrendChartSeriesOptions<TData> {
    type: 'line';
    lineType?: PolylineRenderer;
}

export type TrendChartSeriesOptions<TData> = TrendChartBarSeriesOptions<TData>
| TrendChartAreaSeriesOptions<TData>
| TrendChartLineSeriesOptions<TData>;

export interface TrendChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    series: TrendChartSeriesOptions<TData>[];
    keyBy: keyof TData | ((item: TData) => string);
    labelBy: keyof TData | ((item: TData) => string);
    showGrid?: boolean;
    showLegend?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formatXLabel?: (value: any) => string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formatYLabel?: (value: any) => string;
}

export class TrendChart<TData = unknown> extends Chart<TrendChartOptions<TData>> {

    private barGroups: Group[] = [];
    private lineGroups: Group[] = [];
    private yScale!: Scale;
    private xScaleBand!: BandScale<string>;
    private xScalePoint!: Scale<string>;
    private xAxis: ChartXAxis;
    private yAxis: ChartYAxis;
    private tooltip: Tooltip;
    private legend?: Legend;
    private grid?: Grid;
    constructor(target: string | HTMLElement | Context, options: TrendChartOptions<TData>) {
        super(target, options);

        this.xAxis = new ChartXAxis({
            scene: this.scene,
            renderer: this.renderer,
            bounds: Box.empty(),
            scale: this.xScalePoint,
            formatLabel: options.formatXLabel,
        });

        this.yAxis = new ChartYAxis({
            scene: this.scene,
            renderer: this.renderer,
            bounds: Box.empty(),
            scale: this.yScale,
            formatLabel: options.formatYLabel,
        });

        this.tooltip = new Tooltip({
            scene: this.scene,
            renderer: this.renderer,
        });

        if (options.showGrid !== false) {
            this.grid = new Grid({
                scene: this.scene,
                renderer: this.renderer,
                horizontal: true,
                vertical: false,
            });
        }

        this.init();
    }

    private async drawLines() {
        const {
            data,
            series,
            keyBy,
        } = this.options;

        const lineSeries = arrayFilter(series, srs => srs.type === 'line') as TrendChartLineSeriesOptions<TData>[];

        const {
            left: seriesEntries,
            inner: seriesUpdates,
            right: seriesExits,
        } = arrayJoin(lineSeries, this.lineGroups, 'id');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const getKey = typeIsFunction(keyBy) ? keyBy : (item: any) => item[keyBy] as string;

        arrayForEach(seriesExits, series => series.destroy());

        const seriesLineValueProducer = ({ id, valueBy, labelBy }: TrendChartLineSeriesOptions<TData>) => {
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
                        fillStyle: '#FFFFFF',
                        strokeStyle: color,
                        lineWidth: 2,
                        cx: x,
                        cy: y,
                        radius: 3,
                    } as CircleState,
                };
            };
        };

        const seriesEntryGroups = arrayMap(seriesEntries, series => {

            const getMarkerValues = seriesLineValueProducer(series);

            const items = arrayMap(data, item => {
                const { id, point, state } = getMarkerValues(item);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const getValue = typeIsFunction(series.valueBy) ? series.valueBy : (item: any) => item[series.valueBy] as number;
                const value = getValue(item);

                const marker = createCircle({
                    id,
                    ...state,
                    radius: 0,
                    data: state,
                });

                marker.on('mouseenter', () => {
                    this.tooltip.show(state.cx, state.cy, value.toString());

                    this.renderer.transition(marker, {
                        duration: this.getAnimationDuration(300),
                        ease: easeOutQuart,
                        state: {
                            fillStyle: state.strokeStyle,
                            radius: 5,
                        },
                    });

                    marker.on('mouseleave', () => {
                        this.tooltip.hide();

                        this.renderer.transition(marker, {
                            duration: this.getAnimationDuration(300),
                            ease: easeOutQuart,
                            state: {
                                fillStyle: '#FFFFFF',
                                radius: 3,
                            },
                        });
                    });
                });

                return {
                    point,
                    marker,
                };
            });

            const line = createPolyline({
                id: `${series.id}-line`,
                lineWidth: 2,
                strokeStyle: this.getSeriesColor(series.id),
                points: arrayMap(items, item => item.point),
                renderer: series.lineType,
            });

            return createGroup({
                id: series.id,
                children: [
                    line,
                    ...arrayMap(items, item => item.marker),
                ],
            });
        });

        const seriesUpdateGroups = arrayMap(seriesUpdates, ([series, group]) => {
            const getMarkerValues = seriesLineValueProducer(series);
            const line = group.getElementsByType('polyline')[0] as Polyline;
            const markers = group.getElementsByType('circle') as Circle[];

            const points = arrayMap(data, item => getMarkerValues(item).point);

            line.data = {
                points,
                renderer: series.lineType,
            } as PolylineState;

            const {
                left: markerEntries,
                inner: markerUpdates,
                right: markerExits,
            } = arrayJoin(data, markers, (item, marker) => marker.id === `${series.id}-${getKey(item)}`);

            arrayForEach(markerExits, marker => marker.destroy());

            arrayMap(markerEntries, item => {
                const { id, state } = getMarkerValues(item);

                const marker = createCircle({
                    id,
                    ...state,
                    radius: 0,
                    data: state,
                });

                group.add(marker);
            });

            arrayForEach(markerUpdates, ([item, marker]) => {
                const { state } = getMarkerValues(item);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const getValue = typeIsFunction(series.valueBy) ? series.valueBy : (item: any) => item[series.valueBy] as number;
                const value = getValue(item);

                marker.data = state;

                // Update hover listeners for new values
                marker.on('mouseenter', () => {
                    this.tooltip.show(state.cx, state.cy, value.toString());

                    this.renderer.transition(marker, {
                        duration: this.getAnimationDuration(300),
                        ease: easeOutQuart,
                        state: {
                            fillStyle: state.strokeStyle,
                            radius: 5,
                        },
                    });

                    marker.on('mouseleave', () => {
                        this.tooltip.hide();

                        this.renderer.transition(marker, {
                            duration: this.getAnimationDuration(300),
                            ease: easeOutQuart,
                            state: {
                                fillStyle: '#FFFFFF',
                                radius: 3,
                            },
                        });
                    });
                });
            });

            return group;
        });

        this.scene.add(seriesEntryGroups);

        this.lineGroups = [
            ...seriesEntryGroups,
            ...seriesUpdateGroups,
        ];

        const entryTransitions = arrayMap(seriesEntryGroups, group => {
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

        const updateTransitions = arrayMap(seriesUpdateGroups, group => {
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
            keyBy,
        } = this.options;

        const barSeries = arrayFilter(series, srs => srs.type === 'bar') as TrendChartBarSeriesOptions<TData>[];

        const {
            left: seriesEntries,
            inner: seriesUpdates,
            right: seriesExits,
        } = arrayJoin(barSeries, this.barGroups, 'id');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const getKey = typeIsFunction(keyBy) ? keyBy : (item: any) => item[keyBy] as string;
        const baseline = this.yScale(0);

        const xScaleSeries = scaleBand(arrayMap(barSeries, srs => srs.id), [0, this.xScaleBand.bandwidth], {
            innerPadding: 0.25,
        });

        arrayForEach(seriesExits, series => series.destroy());

        const seriesBarValueProducer = ({ id, valueBy, labelBy }: TrendChartBarSeriesOptions<TData>) => {
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
                        fillStyle: color,
                        x,
                        y,
                        width,
                        height,
                    } as RectState,
                };
            };
        };

        const seriesEntryGroups = arrayMap(seriesEntries, (series) => {

            const getBarValues = seriesBarValueProducer(series);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getValue = typeIsFunction(series.valueBy) ? series.valueBy : (item: any) => item[series.valueBy] as number;

            const children = arrayMap(data, item => {
                const { id, state } = getBarValues(item);
                const value = getValue(item);

                const bar = createRect({
                    id,
                    ...state,
                    fillStyle: setColorAlpha(state.fillStyle as string, 0.7),
                    y: baseline,
                    height: 0,
                    data: {
                        ...state,
                        fillStyle: setColorAlpha(state.fillStyle as string, 0.7),
                    },
                });

                bar.on('mouseenter', () => {
                    this.tooltip.show(state.x + state.width / 2, state.y, value.toString());

                    this.renderer.transition(bar, {
                        duration: this.getAnimationDuration(300),
                        ease: easeOutQuart,
                        state: {
                            fillStyle: state.fillStyle,
                        },
                    });

                    bar.on('mouseleave', () => {
                        this.tooltip.hide();

                        this.renderer.transition(bar, {
                            duration: this.getAnimationDuration(300),
                            ease: easeOutQuart,
                            state: {
                                fillStyle: setColorAlpha(state.fillStyle as string, 0.7),
                            },
                        });
                    });
                });

                return bar;
            });

            return createGroup({
                id: series.id,
                children,
            });
        });

        const seriesUpdateGroups = arrayMap(seriesUpdates, ([series, group]) => {
            const getBarValues = seriesBarValueProducer(series);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getValue = typeIsFunction(series.valueBy) ? series.valueBy : (item: any) => item[series.valueBy] as number;
            const bars = group.getElementsByType('rect') as Rect[];

            const {
                left: barEntries,
                inner: barUpdates,
                right: barExits,
            } = arrayJoin(data, bars, (item, bar) => bar.id === `${series.id}-${getKey(item)}`);

            arrayForEach(barExits, bar => bar.destroy());

            arrayMap(barEntries, item => {
                const { id, state } = getBarValues(item);

                const rect = createRect({
                    id,
                    ...state,
                    y: baseline,
                    height: 0,
                    data: state,
                });

                group.add(rect);
            });

            arrayForEach(barUpdates, ([item, bar]) => {
                const { state } = getBarValues(item);
                const value = getValue(item);

                bar.data = {
                    ...state,
                    fillStyle: setColorAlpha(state.fillStyle as string, 0.7),
                };

                // Update hover listeners for new values
                bar.on('mouseenter', () => {
                    this.tooltip.show(state.x + state.width / 2, state.y, value.toString());

                    this.renderer.transition(bar, {
                        duration: this.getAnimationDuration(300),
                        ease: easeOutQuart,
                        state: {
                            fillStyle: state.fillStyle,
                        },
                    });

                    bar.on('mouseleave', () => {
                        this.tooltip.hide();

                        this.renderer.transition(bar, {
                            duration: this.getAnimationDuration(300),
                            ease: easeOutQuart,
                            state: {
                                fillStyle: setColorAlpha(state.fillStyle as string, 0.7),
                            },
                        });
                    });
                });
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
                keyBy,
            } = this.options;

            this.resolveSeriesColors(series);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getKey = typeIsFunction(keyBy) ? keyBy : (item: any) => item[keyBy] as string;
            const keys = arrayMap(data, getKey);
            const seriesExtents = arrayFlatMap(series, ({ valueBy }) => {
                const getValue = typeIsFunction(valueBy)
                    ? valueBy
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    : (item: any) => item[valueBy] as number;

                return getExtent(data, getValue);
            }).concat(0);

            const dataExtent = getExtent(seriesExtents, functionIdentity);

            const padding = this.getPadding();

            // Compute legend bounds early to reserve space
            let legendHeight = 0;

            if (this.options.showLegend !== false && series.length > 1) {
                const legendItems: LegendItem[] = arrayMap(series, srs => ({
                    id: srs.id,
                    label: typeIsFunction(srs.labelBy) ? srs.id : srs.labelBy as string,
                    color: this.getSeriesColor(srs.id),
                    active: true,
                }));

                if (!this.legend) {
                    this.legend = new Legend({
                        scene: this.scene,
                        renderer: this.renderer,
                        items: legendItems,
                        position: 'top',
                        onToggle: () => this.render(),
                    });
                } else {
                    this.legend.update(legendItems);
                }

                legendHeight = this.legend.getBoundingBox(scene.width - padding.left - padding.right).height;
            }

            const chartTop = padding.top + legendHeight;

            this.yScale = scaleContinuous(dataExtent, [scene.height - padding.bottom, chartTop], {
                padToTicks: 10,
            });

            this.yAxis.scale = this.yScale;
            this.yAxis.bounds = new Box(
                chartTop,
                padding.left,
                this.scene.height - padding.bottom,
                this.scene.width - padding.right
            );

            const yAxisBoundingBox = this.yAxis.getBoundingBox();

            this.xScaleBand = scaleBand(keys, [yAxisBoundingBox.right, this.scene.width - padding.right], {
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
                this.scene.height - padding.bottom,
                this.scene.width - padding.right
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
                const yTickPositions = arrayMap(yTicks, tick => this.yScale(tick));

                this.grid.render(
                    [],
                    yTickPositions,
                    yAxisBoundingBox.right,
                    chartTop,
                    scene.width - padding.right - yAxisBoundingBox.right,
                    xAxisBoundingBox.top - chartTop
                );
            }

            // Render legend
            if (this.legend && legendHeight > 0) {
                this.legend.render(yAxisBoundingBox.right, 0, scene.width - yAxisBoundingBox.right - padding.right);
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

export function createTrendChart<TData = unknown>(target: string | HTMLElement | Context, options: TrendChartOptions<TData>) {
    return new TrendChart<TData>(target, options);
}
