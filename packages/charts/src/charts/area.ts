import {
    BaseChartOptions,
    Chart,
} from '../core/chart';

import type {
    ChartAxisInput,
    ChartCrosshairInput,
    ChartGridInput,
    ChartLegendInput,
    ChartTooltipInput,
} from '../core/options';

import {
    normalizeAxis,
    normalizeAxisItem,
    normalizeCrosshair,
    normalizeGrid,
    normalizeLegend,
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
    Point,
    Polyline,
    PolylineRenderer,
    PolylineState,
    Scale,
    scaleContinuous,
    setColorAlpha,
} from '@ripl/core';

import {
    arrayJoin,
    functionIdentity,
    typeIsFunction,
} from '@ripl/utilities';

/** Configuration for an individual area chart series. */
export interface AreaChartSeriesOptions<TData> {
    id: string;
    color?: string;
    value: keyof TData | number | ((item: TData) => number);
    label: string;
    lineType?: PolylineRenderer;
    lineWidth?: number;
    opacity?: number;
    markers?: boolean;
}

/** Options for configuring an {@link AreaChart}. */
export interface AreaChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    series: AreaChartSeriesOptions<TData>[];
    key: keyof TData | ((item: TData) => string);
    stacked?: boolean;
    grid?: ChartGridInput;
    crosshair?: ChartCrosshairInput;
    tooltip?: ChartTooltipInput;
    legend?: ChartLegendInput;
    axis?: ChartAxisInput<TData>;
}

/**
 * Area chart rendering filled regions beneath series lines.
 *
 * Supports stacked and unstacked modes with optional markers, crosshair,
 * tooltips, legend, and grid. Areas animate upward from the baseline on
 * entry and smoothly transition on update.
 *
 * @typeParam TData - The type of each data item in the dataset.
 */
export class AreaChart<TData = unknown> extends Chart<AreaChartOptions<TData>> {

    private areaGroups: Group[] = [];
    private yScale!: Scale;
    private xScale!: Scale<string>;
    private xAxis!: ChartXAxis;
    private yAxis!: ChartYAxis;
    private tooltip!: Tooltip;
    private grid?: Grid;
    private crosshair?: Crosshair;
    private legend?: Legend;
    constructor(target: string | HTMLElement | Context, options: AreaChartOptions<TData>) {
        super(target, options);

        const axisOpts = normalizeAxis(options.axis);
        const xAxis = normalizeAxisItem(axisOpts.x);
        const yAxis = normalizeYAxisItem(
            Array.isArray(axisOpts.y) ? axisOpts.y[0] : axisOpts.y
        );
        const gridOpts = normalizeGrid(options.grid);
        const crosshairOpts = normalizeCrosshair(options.crosshair);
        const tooltipOpts = normalizeTooltip(options.tooltip);

        if (tooltipOpts.visible) {
            this.tooltip = new Tooltip({
                scene: this.scene,
                renderer: this.renderer,
                padding: typeof tooltipOpts.padding === 'number' ? tooltipOpts.padding : 8,
                font: tooltipOpts.font,
                fontColor: tooltipOpts.fontColor,
                backgroundColor: tooltipOpts.backgroundColor,
                borderRadius: typeof tooltipOpts.borderRadius === 'number' ? tooltipOpts.borderRadius : 6,
            });
        }

        this.xAxis = new ChartXAxis({
            scene: this.scene,
            renderer: this.renderer,
            bounds: Box.empty(),
            scale: scaleContinuous([0, 1], [0, 1]),
            labelFont: xAxis.font,
            labelColor: xAxis.fontColor,
            formatLabel: resolveFormatLabel(xAxis.format),
            title: xAxis.title,
        });

        this.yAxis = new ChartYAxis({
            scene: this.scene,
            renderer: this.renderer,
            bounds: Box.empty(),
            scale: scaleContinuous([0, 1], [0, 1]),
            labelFont: yAxis.font,
            labelColor: yAxis.fontColor,
            formatLabel: resolveFormatLabel(yAxis.format),
            title: yAxis.title,
        });

        if (gridOpts.visible) {
            this.grid = new Grid({
                scene: this.scene,
                renderer: this.renderer,
                strokeStyle: gridOpts.lineColor,
                lineWidth: gridOpts.lineWidth,
                lineDash: gridOpts.lineDash,
            });
        }

        if (crosshairOpts.visible) {
            this.crosshair = new Crosshair({
                scene: this.scene,
                renderer: this.renderer,
                vertical: crosshairOpts.axis === 'x' || crosshairOpts.axis === 'both',
                horizontal: crosshairOpts.axis === 'y' || crosshairOpts.axis === 'both',
                strokeStyle: crosshairOpts.lineColor,
                lineWidth: crosshairOpts.lineWidth,
            });
        }

        this.init();
    }

    private async drawAreas(baseline: number) {
        const {
            data,
            series,
            key,
            stacked,
        } = this.options;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const getKey = typeIsFunction(key) ? key : (item: any) => item[key] as string;

        const {
            left: seriesEntries,
            inner: seriesUpdates,
            right: seriesExits,
        } = arrayJoin(series, this.areaGroups, 'id');

        seriesExits.forEach(el => el.destroy());

        // Precompute cumulative stacked values per data point
        const stackedValues: number[][] = [];

        if (stacked) {
            data.forEach((item, dataIndex) => {
                stackedValues[dataIndex] = [];
                let cumulative = 0;

                series.forEach((srs, seriesIndex) => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const getValue = typeIsFunction(srs.value) ? srs.value : (i: any) => i[srs.value] as number;
                    cumulative += getValue(item);
                    stackedValues[dataIndex][seriesIndex] = cumulative;
                });
            });
        }

        const getSeriesValue = (srs: AreaChartSeriesOptions<TData>, item: TData, dataIndex: number) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getValue = typeIsFunction(srs.value) ? srs.value : (i: any) => i[srs.value] as number;
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

        const seriesEntryGroups = seriesEntries.map(srs => {
            const color = this.getSeriesColor(srs.id);
            const opacity = srs.opacity ?? 0.3;
            const showMarkers = srs.markers !== false;

            const linePoints: Point[] = [];
            const areaPoints: Point[] = [];
            const markerElements: Circle[] = [];

            data.forEach((item, dataIndex) => {
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
                    const rawGetValue = typeIsFunction(srs.value) ? srs.value : (i: any) => i[srs.value] as number;
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

                    markerElements.push(marker);
                }
            });

            // Create baseline-flattened points for entry animation
            const baselineLinePoints: Point[] = linePoints.map(([x]) => [x, baseline]);
            const baselineAreaPoints: Point[] = areaPoints.map(([x]) => [x, baseline]);

            const areaFill = createPolyline({
                id: `${srs.id}-area`,
                fillStyle: setColorAlpha(color, opacity),
                strokeStyle: undefined,
                points: baselineAreaPoints,
                renderer: srs.lineType,
                data: {
                    points: areaPoints,
                } as PolylineState,
            });

            areaFill.autoStroke = false;

            const line = createPolyline({
                id: `${srs.id}-line`,
                lineWidth: srs.lineWidth ?? 2,
                strokeStyle: color,
                points: baselineLinePoints,
                renderer: srs.lineType,
                data: {
                    points: linePoints,
                } as PolylineState,
            });

            return createGroup({
                id: srs.id,
                children: [
                    areaFill,
                    line,
                    ...markerElements,
                ],
            });
        });

        const seriesUpdateGroups = seriesUpdates.map(([srs, group]) => {
            const color = this.getSeriesColor(srs.id);
            const line = group.getElementsByType('polyline')[1] as Polyline;
            const areaFill = group.getElementsByType('polyline')[0] as Polyline;
            const existingMarkers = group.getElementsByType('circle') as Circle[];

            const linePoints: Point[] = [];
            const areaPoints: Point[] = [];

            data.forEach((item, dataIndex) => {
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
            existingMarkers.forEach((marker, index) => {
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

        const entryTransitions = seriesEntryGroups.map(group => {
            const markers = group.queryAll('circle') as Circle[];
            const polylines = group.getElementsByType('polyline') as Polyline[];
            const areaFill = polylines[0];
            const line = polylines[1];

            const lineTransition = line ? this.renderer.transition(line, {
                duration: this.getAnimationDuration(1000),
                ease: easeOutCubic,
                state: line.data as PolylineState,
            }) : Promise.resolve();

            const areaTransition = areaFill ? this.renderer.transition(areaFill, {
                duration: this.getAnimationDuration(1000),
                ease: easeOutCubic,
                state: areaFill.data as PolylineState,
            }) : Promise.resolve();

            const markersTransition = markers.length > 0 ? this.renderer.transition(markers, (element) => ({
                duration: this.getAnimationDuration(1000),
                ease: easeOutCubic,
                state: element.data as CircleState,
            })) : Promise.resolve();

            return [lineTransition, areaTransition, markersTransition];
        });

        const updateTransitions = seriesUpdateGroups.map(group => {
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
                key,
                stacked,
            } = this.options;

            this.resolveSeriesColors(series);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getKey = typeIsFunction(key) ? key : (item: any) => item[key] as string;
            const keys = data.map(getKey);

            let dataExtent: number[];

            if (stacked) {
                // For stacked, compute cumulative min and max
                let stackedMax = 0;
                let stackedMin = 0;

                data.forEach(item => {
                    let cumulative = 0;
                    let cumulativeMax = 0;
                    let cumulativeMin = 0;

                    series.forEach(srs => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const getValue = typeIsFunction(srs.value) ? srs.value : (i: any) => i[srs.value] as number;
                        cumulative += getValue(item);
                        cumulativeMax = Math.max(cumulativeMax, cumulative);
                        cumulativeMin = Math.min(cumulativeMin, cumulative);
                    });

                    stackedMax = Math.max(stackedMax, cumulativeMax);
                    stackedMin = Math.min(stackedMin, cumulativeMin);
                });

                dataExtent = [stackedMin, stackedMax];
            } else {
                const seriesExtents = series.flatMap(({ value: valueAccessor }) => {
                    const getValue = typeIsFunction(valueAccessor)
                        ? valueAccessor
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        : (item: any) => item[valueAccessor] as number;

                    return getExtent(data, getValue);
                }).concat(0);

                dataExtent = getExtent(seriesExtents, functionIdentity);
            }

            const padding = this.getPadding();

            // Compute legend bounds early to reserve space
            let legendHeight = 0;

            if (normalizeLegend(this.options.legend).visible !== false && series.length > 1) {
                const legendItems: LegendItem[] = series.map(srs => ({
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
                chartTop,
                yAxisBoundingBox.right,
                scene.height - padding.bottom,
                scene.width - padding.right
            );

            const xAxisBoundingBox = this.xAxis.getBoundingBox();

            this.yScale = scaleContinuous(dataExtent, [xAxisBoundingBox.top, chartTop], {
                padToTicks: 10,
            });

            this.yAxis.scale = this.yScale;
            this.yAxis.bounds.bottom = xAxisBoundingBox.top;

            const baseline = this.yScale(0);

            // Render grid
            if (this.grid) {
                const yTicks = this.yScale.ticks(10);
                const yTickPositions = yTicks.map(tick => this.yScale(tick));

                this.grid.render(
                    [],
                    yTickPositions,
                    yAxisBoundingBox.right,
                    chartTop,
                    scene.width - padding.right - yAxisBoundingBox.right,
                    xAxisBoundingBox.top - chartTop
                );
            }

            // Setup crosshair
            this.crosshair?.setup(
                yAxisBoundingBox.right,
                chartTop,
                scene.width - padding.right - yAxisBoundingBox.right,
                xAxisBoundingBox.top - chartTop
            );

            // Render legend
            if (this.legend && legendHeight > 0) {
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

/** Factory function that creates a new {@link AreaChart} instance. */
export function createAreaChart<TData = unknown>(target: string | HTMLElement | Context, options: AreaChartOptions<TData>) {
    return new AreaChart<TData>(target, options);
}
