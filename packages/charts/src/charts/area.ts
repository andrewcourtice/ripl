import {
    CartesianChart,
    CartesianChartOptions,
} from '../core/cartesian';

import type {
    ChartAxisInput,
    ChartCrosshairInput,
    ChartGridInput,
    ChartLegendInput,
    ChartTooltipInput,
} from '../core/options';

import {
    ANIMATION_REFERENCE,
    exitElement,
} from '../core/animation';

import {
    applyHoverHighlight,
} from '../core/interaction';

import {
    resolveAccessor,
} from '../core/data';

import {
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
export interface AreaChartOptions<TData = unknown> extends CartesianChartOptions<TData> {
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
 * Supports stacked and unstacked modes with optional markers, crosshair, tooltips, legend, chart
 * title, and grid. Areas animate upward from the baseline on entry, transition smoothly on update,
 * and fade out on exit.
 *
 * @typeParam TData - The type of each data item in the dataset.
 */
export class AreaChart<TData = unknown> extends CartesianChart<AreaChartOptions<TData>, TData> {

    private areaGroups: Group[] = [];
    private yScale!: Scale;
    private xScale!: Scale<string>;

    constructor(target: string | HTMLElement | Context, options: AreaChartOptions<TData>) {
        super(target, options);

        this.setupCartesian({
            grid: { horizontal: true },
            crosshair: true,
        });

        this.init();
    }

    private seriesValue(series: AreaChartSeriesOptions<TData>, item: TData): number {
        return resolveAccessor<TData, number>(series.value)(item);
    }

    private attachMarkerHover(marker: Circle, label: string, value: number, color: string, x: number, y: number) {
        if (!this.tooltip) {
            return;
        }

        const hover = this.resolveAnimation(ANIMATION_REFERENCE.hover);

        applyHoverHighlight(marker, {
            renderer: this.renderer,
            duration: hover.duration,
            ease: hover.ease,
            tooltip: this.tooltip,
            anchor: () => ({ x, y }),
            content: () => `${label}: ${value}`,
            highlight: { fill: color, radius: 5 },
            restore: { fill: '#FFFFFF', radius: 3 },
        });
    }

    private async drawAreas(baseline: number) {
        const { data, series, key, stacked } = this.options;

        const getKey = resolveAccessor<TData, string>(key);
        const exitAnimation = this.resolveAnimation(ANIMATION_REFERENCE.exit);

        const {
            left: seriesEntries,
            inner: seriesUpdates,
            right: seriesExits,
        } = arrayJoin(series, this.areaGroups, 'id');

        seriesExits.forEach(group => {
            const exits = group.graph(false).map(element => exitElement(this.renderer, element, exitAnimation));
            void Promise.all(exits).then(() => group.destroy());
        });

        // Precompute cumulative stacked values per data point.
        const stackedValues: number[][] = [];

        if (stacked) {
            data.forEach((item, dataIndex) => {
                stackedValues[dataIndex] = [];
                let cumulative = 0;

                series.forEach((srs, seriesIndex) => {
                    cumulative += this.seriesValue(srs, item);
                    stackedValues[dataIndex][seriesIndex] = cumulative;
                });
            });
        }

        const getSeriesValue = (srs: AreaChartSeriesOptions<TData>, item: TData, dataIndex: number) => {
            const rawValue = this.seriesValue(srs, item);
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

        const buildPoints = (srs: AreaChartSeriesOptions<TData>) => {
            const linePoints: Point[] = [];
            const areaPoints: Point[] = [];

            data.forEach((item, dataIndex) => {
                const x = this.xScale(getKey(item));
                const y = this.yScale(getSeriesValue(srs, item, dataIndex));

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
                            areaPoints.push([this.xScale(getKey(data[i])), this.yScale(prevVal)]);
                        }
                    }
                }
            });

            return { linePoints, areaPoints };
        };

        const seriesEntryGroups = seriesEntries.map(srs => {
            const color = this.getSeriesColor(srs.id);
            const opacity = srs.opacity ?? 0.3;
            const showMarkers = srs.markers !== false;
            const { linePoints, areaPoints } = buildPoints(srs);

            const markerElements: Circle[] = showMarkers
                ? data.map((item, dataIndex) => {
                    const x = this.xScale(getKey(item));
                    const y = this.yScale(getSeriesValue(srs, item, dataIndex));
                    const rawValue = this.seriesValue(srs, item);

                    const marker = createCircle({
                        id: `${srs.id}-marker-${getKey(item)}`,
                        fill: '#FFFFFF',
                        stroke: color,
                        lineWidth: 2,
                        cx: x,
                        cy: y,
                        radius: 0,
                        data: {
                            fill: '#FFFFFF',
                            stroke: color,
                            lineWidth: 2,
                            cx: x,
                            cy: y,
                            radius: 3,
                        } as CircleState,
                    });

                    this.attachMarkerHover(marker, srs.label, rawValue, color, x, y);

                    return marker;
                })
                : [];

            const areaFill = createPolyline({
                id: `${srs.id}-area`,
                fill: setColorAlpha(color, opacity),
                stroke: undefined,
                points: areaPoints.map(([x]) => [x, baseline] as Point),
                renderer: srs.lineType,
                data: { points: areaPoints } as PolylineState,
            });

            areaFill.autoStroke = false;

            const line = createPolyline({
                id: `${srs.id}-line`,
                lineWidth: srs.lineWidth ?? 2,
                stroke: color,
                points: linePoints.map(([x]) => [x, baseline] as Point),
                renderer: srs.lineType,
                data: { points: linePoints } as PolylineState,
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
            const polylines = group.getElementsByType('polyline') as Polyline[];
            const areaFill = polylines[0];
            const line = polylines[1];
            const markers = group.getElementsByType('circle') as Circle[];
            const { linePoints, areaPoints } = buildPoints(srs);

            line.data = { points: linePoints, renderer: srs.lineType } as PolylineState;
            areaFill.data = { points: areaPoints } as PolylineState;

            markers.forEach((marker, index) => {
                if (index >= data.length) {
                    return;
                }

                const item = data[index];
                const x = this.xScale(getKey(item));
                const y = this.yScale(getSeriesValue(srs, item, index));

                marker.data = {
                    fill: '#FFFFFF',
                    stroke: color,
                    lineWidth: 2,
                    cx: x,
                    cy: y,
                    radius: 3,
                } as CircleState;

                this.attachMarkerHover(marker, srs.label, this.seriesValue(srs, item), color, x, y);
            });

            return group;
        });

        this.scene.add(seriesEntryGroups);

        this.areaGroups = [
            ...seriesEntryGroups,
            ...seriesUpdateGroups,
        ];

        const enter = this.resolveAnimation(ANIMATION_REFERENCE.enter);
        const update = this.resolveAnimation(ANIMATION_REFERENCE.update);

        const transitionsFor = (groups: Group[], animation: typeof enter) => groups.flatMap(group => {
            const markers = group.getElementsByType('circle') as Circle[];
            const polylines = group.getElementsByType('polyline') as Polyline[];

            return [
                ...polylines.map(polyline => this.renderer.transition(polyline, {
                    duration: animation.duration,
                    ease: animation.ease,
                    state: polyline.data as PolylineState,
                })),
                ...(markers.length > 0
                    ? [this.renderer.transition(markers, element => ({
                        duration: animation.duration,
                        ease: animation.ease,
                        state: element.data as CircleState,
                    }))]
                    : []),
            ];
        });

        return Promise.all([
            ...transitionsFor(seriesEntryGroups, enter),
            ...transitionsFor(seriesUpdateGroups, update),
        ]);
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
                let stackedMax = 0;
                let stackedMin = 0;

                data.forEach(item => {
                    let cumulative = 0;
                    let cumulativeMax = 0;
                    let cumulativeMin = 0;

                    series.forEach(srs => {
                        cumulative += this.seriesValue(srs, item);
                        cumulativeMax = Math.max(cumulativeMax, cumulative);
                        cumulativeMin = Math.min(cumulativeMin, cumulative);
                    });

                    stackedMax = Math.max(stackedMax, cumulativeMax);
                    stackedMin = Math.min(stackedMin, cumulativeMin);
                });

                dataExtent = [stackedMin, stackedMax];
            } else {
                const seriesExtents = series
                    .flatMap(srs => getExtent(data, item => this.seriesValue(srs, item)))
                    .concat(0);

                dataExtent = getExtent(seriesExtents, functionIdentity);
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

            const area = layout.area;
            const left = area.x;
            const top = area.y;
            const right = area.x + area.width;
            const bottom = area.y + area.height;

            this.yScale = scaleContinuous(dataExtent, [bottom, top], { padToTicks: 10 });
            this.yAxis.scale = this.yScale;
            this.yAxis.bounds = new Box(top, left, bottom, right);

            const yAxisBox = this.yAxis.getBoundingBox();

            this.xScale = this.pointScale(keys, yAxisBox.right, right);
            this.xAxis.scale = this.xScale;
            this.xAxis.bounds = new Box(top, yAxisBox.right, bottom, right);

            const xAxisBox = this.xAxis.getBoundingBox();

            this.yScale = scaleContinuous(dataExtent, [xAxisBox.top, top], { padToTicks: 10 });
            this.yAxis.scale = this.yScale;
            this.yAxis.bounds.bottom = xAxisBox.top;

            const baseline = this.yScale(0);
            const plot = { x: yAxisBox.right, y: top, width: right - yAxisBox.right, height: xAxisBox.top - top };

            this.renderGrid([], this.yScale.ticks(10).map(tick => this.yScale(tick)), plot);
            this.setupCrosshair(plot);

            return Promise.all([
                this.xAxis.visible ? this.xAxis.render() : Promise.resolve(),
                this.yAxis.visible ? this.yAxis.render() : Promise.resolve(),
                this.drawAreas(baseline),
            ]);
        });
    }

}

/** Factory function that creates a new {@link AreaChart} instance. */
export function createAreaChart<TData = unknown>(target: string | HTMLElement | Context, options: AreaChartOptions<TData>) {
    return new AreaChart<TData>(target, options);
}
