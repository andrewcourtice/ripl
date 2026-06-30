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
    interpolatePath,
    interpolateWaypoint,
    Interpolator,
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

/**
 * Builds an interpolator that reveals a filled area band left→right. At each position it grows a
 * closed polygon from the left edge to a moving front, following the real top boundary and closing
 * back along the lower boundary — a true wipe, unlike `interpolatePath` on the closed polygon
 * (which would trace the outline) or a horizontal scale (which stretches the series).
 */
function interpolateAreaReveal(top: Point[], bottom: Point[]): Interpolator<Point[]> {
    const lastIndex = top.length - 1;
    const topAt = interpolateWaypoint(top);
    const bottomAt = interpolateWaypoint(bottom);

    return position => {
        if (position >= 1) {
            return [...top, ...bottom.slice().reverse()];
        }

        const count = Math.ceil(lastIndex * position);
        const revealedTop = top.slice(0, count).concat([topAt(position)]);
        const revealedBottom = bottom.slice(0, count).concat([bottomAt(position)]);

        return [...revealedTop, ...revealedBottom.reverse()];
    };
}

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
 * title, and grid. On entry the line draws on and the fill is revealed left-to-right (a true wipe,
 * not a horizontal stretch); areas transition smoothly on update and fade out on exit.
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
            anchor: () => ({
                x,
                y,
            }),
            content: () => `${label}: ${value}`,
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

    private async drawAreas(baseline: number, plot: { x: number;
        y: number;
        width: number;
        height: number; }) {
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
            const bottomPoints: Point[] = [];

            data.forEach((item, dataIndex) => {
                const x = this.xScale(getKey(item));
                const y = this.yScale(getSeriesValue(srs, item, dataIndex));
                // Lower boundary: the previous series' cumulative top when stacked, else the baseline.
                const bottomY = stacked ? this.yScale(getPrevSeriesValue(srs, dataIndex)) : baseline;

                linePoints.push([x, y]);
                bottomPoints.push([x, bottomY]);
            });

            // Closed band polygon: top edge left→right, then the lower boundary right→left.
            const areaPoints: Point[] = [
                ...linePoints,
                ...bottomPoints.slice().reverse(),
            ];

            return {
                linePoints,
                bottomPoints,
                areaPoints,
            };
        };

        // Builds a marker circle for a data item (radius animates from 0 up to its rest size).
        const buildMarker = (srs: AreaChartSeriesOptions<TData>) => {
            const color = this.getSeriesColor(srs.id);

            return (item: TData, dataIndex: number) => {
                const x = this.xScale(getKey(item));
                const y = this.yScale(getSeriesValue(srs, item, dataIndex));

                const state: CircleState = {
                    fill: '#FFFFFF',
                    stroke: color,
                    lineWidth: 2,
                    cx: x,
                    cy: y,
                    radius: 3,
                };

                const marker = createCircle({
                    id: `${srs.id}-marker-${getKey(item)}`,
                    ...state,
                    radius: 0,
                    data: state,
                });

                this.attachMarkerHover(marker, srs.label, this.seriesValue(srs, item), color, x, y);

                return marker;
            };
        };

        // Top/bottom boundaries per entering series, used to drive the left→right reveal.
        const entryReveal = new Map<string, { linePoints: Point[];
            bottomPoints: Point[]; }>();

        const seriesEntryGroups = seriesEntries.map(srs => {
            const color = this.getSeriesColor(srs.id);
            const opacity = srs.opacity ?? 0.3;
            const showMarkers = srs.markers !== false;
            const { linePoints, bottomPoints, areaPoints } = buildPoints(srs);
            const makeMarker = buildMarker(srs);

            entryReveal.set(srs.id, {
                linePoints,
                bottomPoints,
            });

            const markerElements: Circle[] = showMarkers
                ? data.map((item, dataIndex) => makeMarker(item, dataIndex))
                : [];

            // Areas/lines are created at their final geometry; the entry transition reveals them
            // left→right by progressively drawing their points (see the entry transitions below).
            const areaFill = createPolyline({
                id: `${srs.id}-area`,
                fill: setColorAlpha(color, opacity),
                stroke: undefined,
                points: areaPoints,
                renderer: srs.lineType,
                data: {
                    points: areaPoints,
                } as PolylineState,
            });

            areaFill.autoStroke = false;

            const line = createPolyline({
                id: `${srs.id}-line`,
                lineWidth: srs.lineWidth ?? 2,
                stroke: color,
                points: linePoints,
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
            const polylines = group.getElementsByType('polyline') as Polyline[];
            const areaFill = polylines[0];
            const line = polylines[1];
            const markers = group.getElementsByType('circle') as Circle[];
            const { linePoints, areaPoints } = buildPoints(srs);

            line.data = {
                points: linePoints,
                renderer: srs.lineType,
            } as PolylineState;
            areaFill.data = { points: areaPoints } as PolylineState;

            // Diff markers by key so new data points add markers and removed ones exit,
            // instead of the previous index-based update that ignored points beyond the
            // original marker count.
            const makeMarker = buildMarker(srs);

            const {
                left: markerEntries,
                inner: markerUpdates,
                right: markerExits,
            } = arrayJoin(data, markers, (item, marker) => marker.id === `${srs.id}-marker-${getKey(item)}`);

            markerExits.forEach(marker => exitElement(this.renderer, marker, exitAnimation, {
                radius: 0,
                opacity: 0,
            }));

            if (srs.markers !== false) {
                markerEntries.forEach(item => group.add(makeMarker(item, data.indexOf(item))));
            }

            markerUpdates.forEach(([item, marker]) => {
                const dataIndex = data.indexOf(item);
                const x = this.xScale(getKey(item));
                const y = this.yScale(getSeriesValue(srs, item, dataIndex));

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

        // Updates morph polylines/markers to their new data in place.
        const updateTransitions = seriesUpdateGroups.flatMap(group => {
            const markers = group.getElementsByType('circle') as Circle[];
            const polylines = group.getElementsByType('polyline') as Polyline[];

            return [
                ...polylines.map(polyline => this.renderer.transition(polyline, {
                    duration: update.duration,
                    ease: update.ease,
                    state: polyline.data as PolylineState,
                })),
                ...(markers.length > 0
                    ? [this.renderer.transition(markers, element => ({
                        duration: update.duration,
                        ease: update.ease,
                        state: element.data as CircleState,
                    }))]
                    : []),
            ];
        });

        // Entry: progressively draw the line and fill in from the left (a true left→right wipe,
        // not a horizontal stretch) while each marker pops in as the reveal front passes its x.
        const entryTransitions = seriesEntryGroups.flatMap(group => {
            const markers = group.getElementsByType('circle') as Circle[];
            const reveal = entryReveal.get(group.id);
            // Group children are created as [areaFill, line, ...markers].
            const polylines = group.getElementsByType('polyline') as Polyline[];
            const areaFill = polylines[0];
            const line = polylines[1];

            const polylineTransitions = [];

            if (line && reveal) {
                polylineTransitions.push(this.renderer.transition(line, {
                    duration: enter.duration,
                    ease: enter.ease,
                    state: { points: interpolatePath(reveal.linePoints) },
                }));
            }

            if (areaFill && reveal) {
                polylineTransitions.push(this.renderer.transition(areaFill, {
                    duration: enter.duration,
                    ease: enter.ease,
                    state: { points: interpolateAreaReveal(reveal.linePoints, reveal.bottomPoints) },
                }));
            }

            return [
                ...polylineTransitions,
                ...(markers.length > 0
                    ? [this.renderer.transition(markers, element => {
                        const fraction = plot.width > 0
                            ? Math.min(Math.max(((element as Circle).cx - plot.x) / plot.width, 0), 1)
                            : 0;

                        return {
                            duration: enter.duration * 0.4,
                            delay: fraction * enter.duration,
                            ease: enter.ease,
                            state: element.data as CircleState,
                        };
                    })]
                    : []),
            ];
        });

        return Promise.all([
            ...entryTransitions,
            ...updateTransitions,
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
            const plot = {
                x: yAxisBox.right,
                y: top,
                width: right - yAxisBox.right,
                height: xAxisBox.top - top,
            };

            this.renderGrid([], this.yScale.ticks(10).map(tick => this.yScale(tick)), plot);
            this.setupCrosshair(plot);

            return Promise.all([
                this.xAxis.visible ? this.xAxis.render() : Promise.resolve(),
                this.yAxis.visible ? this.yAxis.render() : Promise.resolve(),
                this.drawAreas(baseline, plot),
            ]);
        });
    }

}

/** Factory function that creates a new {@link AreaChart} instance. */
export function createAreaChart<TData = unknown>(target: string | HTMLElement | Context, options: AreaChartOptions<TData>) {
    return new AreaChart<TData>(target, options);
}
