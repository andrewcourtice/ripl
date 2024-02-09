import {
    BaseChartOptions,
    Chart,
    ChartOptions,
} from '../core/chart';

import {
    BandScale,
    Circle,
    CircleState,
    Context,
    createCircle,
    createGroup,
    createPolyline,
    createRect,
    createScale,
    easeOutCubic,
    getExtent,
    Group,
    interpolatePath,
    max,
    Point,
    Polyline,
    PolylineState,
    queryAll,
    Rect,
    RectState,
    Scale,
    scaleBand,
    scaleContinuous,
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
import {
    getColorGenerator,
} from '../constants/colors';

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
    lineType?: 'linear' | 'spline';
}

export type TrendChartSeriesOptions<TData> = TrendChartBarSeriesOptions<TData>
| TrendChartAreaSeriesOptions<TData>
| TrendChartLineSeriesOptions<TData>;

export interface TrendChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    series: TrendChartSeriesOptions<TData>[];
    keyBy: keyof TData | ((item: TData) => string);
    labelBy: keyof TData | ((item: TData) => string);
}

export class TrendChart<TData = unknown> extends Chart<TrendChartOptions<TData>> {

    private barGroups: Group[] = [];
    private lineGroups: Group[] = [];
    private yScale!: Scale;
    private xScaleBand!: BandScale<string>;
    private xScalePoint!: Scale<string>;
    private colorGenerator = getColorGenerator();

    constructor(target: string | HTMLElement | Context, options: ChartOptions<TrendChartOptions<TData>>) {
        super(target, options);
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

        const getKey = typeIsFunction(keyBy) ? keyBy : (item: unknown) => item[keyBy] as string;

        arrayForEach(seriesExits, series => series.destroy());

        const seriesLineValueProducer = ({ id, valueBy, labelBy, color }: TrendChartLineSeriesOptions<TData>) => {
            const getValue = typeIsFunction(valueBy) ? valueBy : (item: unknown) => item[valueBy] as number;
            const getLabel = typeIsFunction(labelBy) ? labelBy : () => labelBy;

            return (item: TData) => {
                const key = getKey(item);
                const value = getValue(item);
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
            series.color ??= this.colorGenerator.next().value;

            const getMarkerValues = seriesLineValueProducer(series);

            const items = arrayMap(data, item => {
                const { id, point, state } = getMarkerValues(item);

                const marker = createCircle({
                    id,
                    ...state,
                    radius: 0,
                    data: state,
                });

                return {
                    point,
                    marker,
                };
            });

            const line = createPolyline({
                id: `${series.id}-line`,
                lineWidth: 2,
                strokeStyle: series.color,
                points: arrayMap(items, item => item.point),
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

                marker.data = state;
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
                duration: 1000,
                ease: easeOutCubic,
                state: {
                    points: interpolatePath(line.points),
                },
            });

            const markersTransition = this.renderer.transition(markers, (element, index, length) => ({
                duration: 1000,
                delay: index * (1000 / length),
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
                duration: 1000,
                ease: easeOutCubic,
                state: line.data as PolylineState,
            });

            const markersTransition = this.renderer.transition(markers, (element) => ({
                duration: 1000,
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

        const getKey = typeIsFunction(keyBy) ? keyBy : (item: unknown) => item[keyBy] as string;
        const baseline = this.yScale(0);

        const xScaleSeries = scaleBand(arrayMap(barSeries, srs => srs.id), [0, this.xScaleBand.bandwidth], {
            innerPadding: 0.25,
        });

        arrayForEach(seriesExits, series => series.destroy());

        const seriesBarValueProducer = ({ id, color, valueBy, labelBy }: TrendChartBarSeriesOptions<TData>) => {
            const getValue = typeIsFunction(valueBy) ? valueBy : (item: unknown) => item[valueBy] as number;
            const getLabel = typeIsFunction(labelBy) ? labelBy : () => labelBy;

            return (item: TData) => {
                const key = getKey(item);
                const value = getValue(item);
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
            series.color ??= this.colorGenerator.next().value;

            const getBarValues = seriesBarValueProducer(series);

            const children = arrayMap(data, item => {
                const { id, state } = getBarValues(item);

                return createRect({
                    id,
                    ...state,
                    y: baseline,
                    height: 0,
                    data: state,
                });
            });

            return createGroup({
                id: series.id,
                children,
            });
        });

        const seriesUpdateGroups = arrayMap(seriesUpdates, ([series, group]) => {
            const getBarValues = seriesBarValueProducer(series);
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

                bar.data = state;
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
            duration: 1000,
            delay: index * (1000 / length),
            ease: easeOutCubic,
            state: element.data as RectState,
        }));

        const updatesTransition = this.renderer.transition(queryAll(seriesUpdateGroups, 'rect') as Rect[], element => ({
            duration: 1000,
            ease: easeOutCubic,
            state: element.data as RectState,
        }));

        return Promise.all([
            entriesTransition,
            updatesTransition,
        ]);
    }

    public async render() {
        return super.render((scene, renderer) => {
            const {
                data,
                series,
                keyBy,
            } = this.options;

            const getKey = typeIsFunction(keyBy) ? keyBy : (item: unknown) => item[keyBy] as string;
            const keys = arrayMap(data, getKey);
            const seriesExtents = arrayFlatMap(series, ({ valueBy }) => {
                const getValue = typeIsFunction(valueBy) ? valueBy : (item: unknown) => item[valueBy] as number;

                return getExtent(data, getValue);
            }).concat(0);

            this.yScale = scaleContinuous(getExtent(seriesExtents, functionIdentity), [scene.height - 20, 20]);

            this.xScaleBand = scaleBand(keys, [0, this.scene.width], {
                outerPadding: 0.5,
                innerPadding: 0.25,
            });

            this.xScalePoint = createScale({
                domain: this.xScaleBand.domain,
                range: this.xScaleBand.range,
                convert: value => this.xScaleBand(value) + this.xScaleBand.bandwidth / 2,
                invert: value => this.xScaleBand.inverse(value),
            });

            return Promise.all([
                this.drawBars(),
                this.drawLines(),
            ]);
        });
    }

}

export function createTrendChart<TData = unknown>(target: string | HTMLElement | Context, options: ChartOptions<TrendChartOptions<TData>>) {
    return new TrendChart<TData>(target, options);
}