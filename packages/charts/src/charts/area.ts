import {
    BaseChartOptions,
    Chart,
} from '../core/chart';

import {
    getColorGenerator,
} from '../constants/colors';

import {
    ChartXAxis,
    ChartYAxis,
} from '../components/axis';

import {
    Tooltip,
} from '../components/tooltip';

import {
    Grid,
} from '../components/grid';

import {
    Crosshair,
} from '../components/crosshair';

import {
    Legend,
    LegendItem,
} from '../components/legend';

import {
    Box,
    Circle,
    CircleState,
    Context,
    createCircle,
    createGroup,
    createPolyline,
    easeOutCubic,
    easeOutQuart,
    getExtent,
    Group,
    interpolatePath,
    Point,
    Polyline,
    PolylineRenderer,
    PolylineState,
    Scale,
    scaleContinuous,
    setColorAlpha,
} from '@ripl/core';

import {
    arrayFlatMap,
    arrayForEach,
    arrayJoin,
    arrayMap,
    functionIdentity,
    typeIsFunction,
} from '@ripl/utilities';

export interface AreaChartSeriesOptions<TData> {
    id: string;
    color?: string;
    valueBy: keyof TData | number | ((item: TData) => number);
    label: string;
    lineType?: PolylineRenderer;
    lineWidth?: number;
    opacity?: number;
    showMarkers?: boolean;
}

export interface AreaChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    series: AreaChartSeriesOptions<TData>[];
    keyBy: keyof TData | ((item: TData) => string);
    showGrid?: boolean;
    showCrosshair?: boolean;
    showLegend?: boolean;
    stacked?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formatXLabel?: (value: any) => string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formatYLabel?: (value: any) => string;
}

export class AreaChart<TData = unknown> extends Chart<AreaChartOptions<TData>> {

    private areaGroups: Group[] = [];
    private yScale!: Scale;
    private xScale!: Scale<string>;
    private colorGenerator = getColorGenerator();
    private xAxis!: ChartXAxis;
    private yAxis!: ChartYAxis;
    private tooltip!: Tooltip;
    private grid?: Grid;
    private crosshair?: Crosshair;
    private legend?: Legend;
    private seriesColors: Map<string, string> = new Map();

    constructor(target: string | HTMLElement | Context, options: AreaChartOptions<TData>) {
        super(target, options);

        this.tooltip = new Tooltip({
            scene: this.scene,
            renderer: this.renderer,
        });

        this.xAxis = new ChartXAxis({
            scene: this.scene,
            renderer: this.renderer,
            bounds: Box.empty(),
            scale: scaleContinuous([0, 1], [0, 1]),
            formatLabel: options.formatXLabel,
        });

        this.yAxis = new ChartYAxis({
            scene: this.scene,
            renderer: this.renderer,
            bounds: Box.empty(),
            scale: scaleContinuous([0, 1], [0, 1]),
            formatLabel: options.formatYLabel,
        });

        if (options.showGrid !== false) {
            this.grid = new Grid({
                scene: this.scene,
                renderer: this.renderer,
            });
        }

        if (options.showCrosshair !== false) {
            this.crosshair = new Crosshair({
                scene: this.scene,
                renderer: this.renderer,
            });
        }

        this.init();
    }

    private resolveSeriesColors() {
        arrayForEach(this.options.series, srs => {
            if (!this.seriesColors.has(srs.id)) {
                this.seriesColors.set(srs.id, srs.color ?? this.colorGenerator.next().value!);
            }

            if (srs.color) {
                this.seriesColors.set(srs.id, srs.color);
            }
        });
    }

    private getSeriesColor(seriesId: string): string {
        return this.seriesColors.get(seriesId) ?? '#a1afc4';
    }

    private async drawAreas(baseline: number) {
        const {
            data,
            series,
            keyBy,
            stacked,
        } = this.options;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const getKey = typeIsFunction(keyBy) ? keyBy : (item: any) => item[keyBy] as string;

        const {
            left: seriesEntries,
            inner: seriesUpdates,
            right: seriesExits,
        } = arrayJoin(series, this.areaGroups, 'id');

        arrayForEach(seriesExits, group => group.destroy());

        // Precompute cumulative stacked values per data point
        const stackedValues: number[][] = [];

        if (stacked) {
            arrayForEach(data, (item, dataIndex) => {
                stackedValues[dataIndex] = [];
                let cumulative = 0;

                arrayForEach(series, (srs, seriesIndex) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const getValue = typeIsFunction(srs.valueBy) ? srs.valueBy : (i: any) => i[srs.valueBy] as number;
                    cumulative += getValue(item);
                    stackedValues[dataIndex][seriesIndex] = cumulative;
                });
            });
        }

        const getSeriesValue = (srs: AreaChartSeriesOptions<TData>, item: TData, dataIndex: number) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getValue = typeIsFunction(srs.valueBy) ? srs.valueBy : (i: any) => i[srs.valueBy] as number;
            const rawValue = getValue(item);
            const seriesIndex = series.indexOf(srs);

            if (stacked && seriesIndex >= 0) {
                return stackedValues[dataIndex]?.[seriesIndex] ?? rawValue;
            }

            return rawValue;
        };

        const getPrevSeriesValue = (srs: AreaChartSeriesOptions<TData>, dataIndex: number) => {
            const seriesIndex = series.indexOf(srs);

            if (stacked && seriesIndex > 0) {
                return stackedValues[dataIndex]?.[seriesIndex - 1] ?? 0;
            }

            return 0;
        };

        const seriesEntryGroups = arrayMap(seriesEntries, srs => {
            const color = this.getSeriesColor(srs.id);
            const opacity = srs.opacity ?? 0.3;
            const showMarkers = srs.showMarkers !== false;

            const linePoints: Point[] = [];
            const areaPoints: Point[] = [];
            const markers: Circle[] = [];

            arrayForEach(data, (item, dataIndex) => {
                const key = getKey(item);
                const value = getSeriesValue(srs, item, dataIndex);
                const x = this.xScale(key);
                const y = this.yScale(value);

                linePoints.push([x, y]);

                if (dataIndex === 0) {
                    const prevY = stacked ? this.yScale(getPrevSeriesValue(srs, dataIndex)) : baseline;
                    areaPoints.push([x, prevY]);
                }

                areaPoints.push([x, y]);

                if (dataIndex === data.length - 1) {
                    const prevY = stacked ? this.yScale(getPrevSeriesValue(srs, dataIndex)) : baseline;
                    areaPoints.push([x, prevY]);

                    // Close the area by going back along the bottom
                    if (stacked) {
                        for (let i = data.length - 1; i >= 0; i--) {
                            const prevVal = getPrevSeriesValue(srs, i);
                            const prevKey = getKey(data[i]);
                            areaPoints.push([this.xScale(prevKey), this.yScale(prevVal)]);
                        }
                    }
                }

                if (showMarkers) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const rawGetValue = typeIsFunction(srs.valueBy) ? srs.valueBy : (i: any) => i[srs.valueBy] as number;
                    const rawValue = rawGetValue(item);

                    const marker = createCircle({
                        id: `${srs.id}-marker-${key}`,
                        fillStyle: '#FFFFFF',
                        strokeStyle: color,
                        lineWidth: 2,
                        cx: x,
                        cy: y,
                        radius: 0,
                        data: {
                            fillStyle: '#FFFFFF',
                            strokeStyle: color,
                            lineWidth: 2,
                            cx: x,
                            cy: y,
                            radius: 3,
                        } as CircleState,
                    });

                    marker.on('mouseenter', () => {
                        this.tooltip.show(x, y, `${srs.label}: ${rawValue}`);

                        this.renderer.transition(marker, {
                            duration: this.getAnimationDuration(300),
                            ease: easeOutQuart,
                            state: {
                                fillStyle: color,
                                radius: 5,
                            },
                        });

                        marker.once('mouseleave', () => {
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

                    markers.push(marker);
                }
            });

            const areaFill = createPolyline({
                id: `${srs.id}-area`,
                fillStyle: setColorAlpha(color, opacity),
                strokeStyle: undefined,
                points: areaPoints,
                renderer: srs.lineType,
            });

            areaFill.autoStroke = false;

            const line = createPolyline({
                id: `${srs.id}-line`,
                lineWidth: srs.lineWidth ?? 2,
                strokeStyle: color,
                points: linePoints,
                renderer: srs.lineType,
            });

            return createGroup({
                id: srs.id,
                children: [
                    areaFill,
                    line,
                    ...markers,
                ],
            });
        });

        const seriesUpdateGroups = arrayMap(seriesUpdates, ([srs, group]) => {
            const color = this.getSeriesColor(srs.id);
            const line = group.getElementsByType('polyline')[1] as Polyline;
            const areaFill = group.getElementsByType('polyline')[0] as Polyline;
            const existingMarkers = group.getElementsByType('circle') as Circle[];

            const linePoints: Point[] = [];
            const areaPoints: Point[] = [];

            arrayForEach(data, (item, dataIndex) => {
                const key = getKey(item);
                const value = getSeriesValue(srs, item, dataIndex);
                const x = this.xScale(key);
                const y = this.yScale(value);

                linePoints.push([x, y]);

                if (dataIndex === 0) {
                    const prevY = stacked ? this.yScale(getPrevSeriesValue(srs, dataIndex)) : baseline;
                    areaPoints.push([x, prevY]);
                }

                areaPoints.push([x, y]);

                if (dataIndex === data.length - 1) {
                    const prevY = stacked ? this.yScale(getPrevSeriesValue(srs, dataIndex)) : baseline;
                    areaPoints.push([x, prevY]);

                    if (stacked) {
                        for (let i = data.length - 1; i >= 0; i--) {
                            const prevVal = getPrevSeriesValue(srs, i);
                            const prevKey = getKey(data[i]);
                            areaPoints.push([this.xScale(prevKey), this.yScale(prevVal)]);
                        }
                    }
                }
            });

            line.data = {
                points: linePoints,
                renderer: srs.lineType,
            } as PolylineState;

            areaFill.data = {
                points: areaPoints,
            } as PolylineState;

            // Update markers
            arrayForEach(existingMarkers, (marker, index) => {
                if (index < data.length) {
                    const item = data[index];
                    const value = getSeriesValue(srs, item, index);
                    const key = getKey(item);
                    const x = this.xScale(key);
                    const y = this.yScale(value);

                    marker.data = {
                        fillStyle: '#FFFFFF',
                        strokeStyle: color,
                        lineWidth: 2,
                        cx: x,
                        cy: y,
                        radius: 3,
                    } as CircleState;
                }
            });

            return group;
        });

        this.scene.add(seriesEntryGroups);

        this.areaGroups = [
            ...seriesEntryGroups,
            ...seriesUpdateGroups,
        ];

        const entryTransitions = arrayMap(seriesEntryGroups, group => {
            const markers = group.queryAll('circle') as Circle[];
            const polylines = group.getElementsByType('polyline') as Polyline[];
            const line = polylines[1];

            const lineTransition = line ? this.renderer.transition(line, {
                duration: this.getAnimationDuration(1000),
                ease: easeOutCubic,
                state: {
                    points: interpolatePath(line.points),
                },
            }) : Promise.resolve();

            const markersTransition = markers.length > 0 ? this.renderer.transition(markers, (element, index, length) => ({
                duration: this.getAnimationDuration(1000),
                delay: index * (this.getAnimationDuration(1000) / length),
                ease: easeOutCubic,
                state: element.data as CircleState,
            })) : Promise.resolve();

            return [lineTransition, markersTransition];
        });

        const updateTransitions = arrayMap(seriesUpdateGroups, group => {
            const markers = group.queryAll('circle') as Circle[];
            const polylines = group.getElementsByType('polyline') as Polyline[];
            const line = polylines[1];

            const lineTransition = line ? this.renderer.transition(line, {
                duration: this.getAnimationDuration(1000),
                ease: easeOutCubic,
                state: line.data as PolylineState,
            }) : Promise.resolve();

            const areaTransition = polylines[0] ? this.renderer.transition(polylines[0], {
                duration: this.getAnimationDuration(1000),
                ease: easeOutCubic,
                state: polylines[0].data as PolylineState,
            }) : Promise.resolve();

            const markersTransition = markers.length > 0 ? this.renderer.transition(markers, (element) => ({
                duration: this.getAnimationDuration(1000),
                ease: easeOutCubic,
                state: element.data as CircleState,
            })) : Promise.resolve();

            return [lineTransition, areaTransition, markersTransition];
        });

        return Promise.all([
            ...entryTransitions,
            ...updateTransitions,
        ].flat());
    }

    public async render() {
        return super.render(async (scene) => {
            const {
                data,
                series,
                keyBy,
                stacked,
            } = this.options;

            this.resolveSeriesColors();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getKey = typeIsFunction(keyBy) ? keyBy : (item: any) => item[keyBy] as string;
            const keys = arrayMap(data, getKey);

            let dataExtent: number[];

            if (stacked) {
                // For stacked, compute cumulative max
                let stackedMax = 0;

                arrayForEach(data, item => {
                    let total = 0;

                    arrayForEach(series, srs => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const getValue = typeIsFunction(srs.valueBy) ? srs.valueBy : (i: any) => i[srs.valueBy] as number;
                        total += getValue(item);
                    });

                    stackedMax = Math.max(stackedMax, total);
                });

                dataExtent = [0, stackedMax];
            } else {
                const seriesExtents = arrayFlatMap(series, ({ valueBy }) => {
                    const getValue = typeIsFunction(valueBy)
                        ? valueBy
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        : (item: any) => item[valueBy] as number;

                    return getExtent(data, getValue);
                }).concat(0);

                dataExtent = getExtent(seriesExtents, functionIdentity);
            }

            const padding = this.getPadding();

            this.yScale = scaleContinuous(dataExtent, [scene.height - padding.bottom, padding.top], {
                padToTicks: 10,
            });

            this.yAxis.scale = this.yScale;
            this.yAxis.bounds = new Box(
                padding.top,
                padding.left,
                scene.height - padding.bottom,
                scene.width - padding.right
            );

            const yAxisBoundingBox = this.yAxis.getBoundingBox();

            // Build x scale
            const xConvert = (value: string) => {
                const index = keys.indexOf(value);
                return yAxisBoundingBox.right + 20 + (index / Math.max(1, keys.length - 1)) * (scene.width - padding.right - yAxisBoundingBox.right - 20);
            };

            this.xScale = Object.assign(
                (value: string) => xConvert(value),
                {
                    domain: keys,
                    range: [yAxisBoundingBox.right + 20, scene.width - padding.right] as number[],
                    inverse: (value: number) => {
                        const range = scene.width - padding.right - yAxisBoundingBox.right - 20;
                        const index = Math.round(((value - yAxisBoundingBox.right - 20) / range) * (keys.length - 1));
                        return keys[Math.max(0, Math.min(keys.length - 1, index))];
                    },
                    ticks: () => keys,
                    includes: (value: string) => keys.includes(value),
                }
            ) as unknown as Scale<string>;

            this.xAxis.scale = this.xScale;
            this.xAxis.bounds = new Box(
                padding.top,
                yAxisBoundingBox.right,
                scene.height - padding.bottom,
                scene.width - padding.right
            );

            const xAxisBoundingBox = this.xAxis.getBoundingBox();

            this.yScale = scaleContinuous(dataExtent, [xAxisBoundingBox.top, padding.top], {
                padToTicks: 10,
            });

            this.yAxis.scale = this.yScale;
            this.yAxis.bounds.bottom = xAxisBoundingBox.top;

            const baseline = this.yScale(0);

            // Render grid
            if (this.grid) {
                const yTicks = this.yScale.ticks(10);
                const yTickPositions = arrayMap(yTicks, tick => this.yScale(tick));

                this.grid.render(
                    [],
                    yTickPositions,
                    yAxisBoundingBox.right,
                    padding.top,
                    scene.width - padding.right - yAxisBoundingBox.right,
                    xAxisBoundingBox.top - padding.top
                );
            }

            // Setup crosshair
            if (this.crosshair) {
                this.crosshair.setup(
                    yAxisBoundingBox.right,
                    padding.top,
                    scene.width - padding.right - yAxisBoundingBox.right,
                    xAxisBoundingBox.top - padding.top
                );

                this.scene.on('mousemove', (event) => {
                    const { x, y } = event.data;
                    this.crosshair?.show(x, y);
                });

                this.scene.on('mouseleave', () => {
                    this.crosshair?.hide();
                });
            }

            // Render legend
            if (this.options.showLegend !== false && series.length > 1) {
                const legendItems: LegendItem[] = arrayMap(series, srs => ({
                    id: srs.id,
                    label: srs.label,
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

                this.legend.render(yAxisBoundingBox.right, 0, scene.width - yAxisBoundingBox.right - padding.right);
            }

            return Promise.all([
                this.xAxis.render(),
                this.yAxis.render(),
                this.drawAreas(baseline),
            ]);
        });
    }

}

export function createAreaChart<TData = unknown>(target: string | HTMLElement | Context, options: AreaChartOptions<TData>) {
    return new AreaChart<TData>(target, options);
}
