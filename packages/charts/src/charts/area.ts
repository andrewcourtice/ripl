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
    resolveLineDash,
    resolveValueFormat,
} from '../core/options';

import type {
    LineStyle,
} from '../core/options';

import {
    createDataLabel,
    resolveDataLabelLayout,
} from '../core/labels';

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

import type {
    LegendItem,
} from '../components/legend';

import type {
    Circle,
    CircleState,
    Context,
    EventMap,
    Group,
    Interpolator,
    Point,
    Polyline,
    PolylineRenderer,
    PolylineState,
    Scale,
    Text,
    TextState,
} from '@ripl/core';

import {
    Box,
    createCircle,
    createGroup,
    createPolyline,
    getExtent,
    interpolatePath,
    interpolatePoints,
    interpolateWaypoint,
    scaleContinuous,
    setColorAlpha,
} from '@ripl/core';

import {
    correspondence,
    keysDiffer,
} from '../core/morph';

import {
    areaBandRenderer,
} from '../core/fill';

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
    opacity?: number;
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
 * not a horizontal stretch); areas transition smoothly on update and fade out on exit.
 *
 * @typeParam TData - The type of each data item in the dataset.
 */
export class AreaChart<TData = unknown> extends CartesianChart<AreaChartOptions<TData>, TData, AreaChartEventMap> {

    private _areaGroups: Group[] = [];
    /** Previous ordered data keys per series, used to key-reconcile the line/fill morph across add/remove. */
    private _morphKeys = new Map<string, string[]>();
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

    private _seriesValue(series: AreaChartSeriesOptions<TData>, item: TData): number {
        return resolveAccessor<TData, number>(series.value)(item);
    }

    private _attachMarkerHover(marker: Circle, srs: AreaChartSeriesOptions<TData>, key: string, value: number, color: string, x: number, y: number) {
        const formatValue = resolveValueFormat(this.options.format);

        const payload = (point: { x: number;
            y: number; }): AreaChartMarkerEvent => ({
            x: point.x,
            y: point.y,
            xValue: key,
            yValue: value,
            seriesId: srs.id,
        });

        applyHoverHighlight(marker, {
            renderer: this.renderer,
            animation: () => this.resolveAnimation(ANIMATION_REFERENCE.hover),
            tooltip: this.tooltip,
            anchor: () => ({
                x,
                y,
            }),
            content: () => `${srs.label}: ${formatValue(value)}`,
            highlight: {
                fill: color,
                radius: 5,
            },
            restore: {
                fill: '#FFFFFF',
                radius: 3,
            },
            onEnter: point => this.emit('markerenter', payload(point)),
            onLeave: point => this.emit('markerleave', payload(point)),
            onClick: point => this.emit('markerclick', payload(point)),
        });
    }

    private async _drawAreas(baseline: number, plot: { x: number;
        y: number;
        width: number;
        height: number; }) {
        const { data, series, key, stacked } = this.options;

        const getKey = resolveAccessor<TData, string>(key);
        const exitAnimation = this.resolveAnimation(ANIMATION_REFERENCE.exit);
        const dataLabels = normalizeDataLabels(this.options.labels, { anchor: 'top' });
        const formatValue = resolveValueFormat(this.options.format);

        const {
            left: seriesEntries,
            inner: seriesUpdates,
            right: seriesExits,
        } = arrayJoin(series, this._areaGroups, 'id');

        const enteringLabels: Text[] = [];
        const updatingLabels: Text[] = [];

        // Builds/updates the value label for a marker, positioned at its data point.
        const buildLabel = (srs: AreaChartSeriesOptions<TData>) => (item: TData, dataIndex: number) => {
            const x = this._xScale(getKey(item));
            const y = this._yScale(getSeriesValue(srs, item, dataIndex));

            return createDataLabel({
                id: `${srs.id}-marker-${getKey(item)}-label`,
                x,
                y,
                anchor: dataLabels.anchor,
                content: formatValue(this._seriesValue(srs, item)),
                font: dataLabels.font,
                fill: dataLabels.fontColor,
                offset: 7,
            });
        };

        const updateLabel = (srs: AreaChartSeriesOptions<TData>, item: TData, dataIndex: number, label: Text) => {
            const x = this._xScale(getKey(item));
            const y = this._yScale(getSeriesValue(srs, item, dataIndex));
            const layout = resolveDataLabelLayout({
                x,
                y,
                anchor: dataLabels.anchor,
                offset: 7,
            });

            label.content = formatValue(this._seriesValue(srs, item));
            label.data = {
                x: layout.x,
                y: layout.y,
                opacity: 1,
            } as Partial<TextState>;
        };

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
                    cumulative += this._seriesValue(srs, item);
                    stackedValues[dataIndex][seriesIndex] = cumulative;
                });
            });
        }

        const getSeriesValue = (srs: AreaChartSeriesOptions<TData>, item: TData, dataIndex: number) => {
            const rawValue = this._seriesValue(srs, item);
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
                const x = this._xScale(getKey(item));
                const y = this._yScale(getSeriesValue(srs, item, dataIndex));
                // Lower boundary: the previous series' cumulative top when stacked, else the baseline.
                const bottomY = stacked ? this._yScale(getPrevSeriesValue(srs, dataIndex)) : baseline;

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
                const x = this._xScale(getKey(item));
                const y = this._yScale(getSeriesValue(srs, item, dataIndex));

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

                this._attachMarkerHover(marker, srs, getKey(item), this._seriesValue(srs, item), color, x, y);

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
                // Curve only the top edge (matching the line) and straight-close the baseline; a
                // plain curve renderer would smooth through the corners and gap away from the line.
                renderer: areaBandRenderer(srs.lineType),
                data: {
                    points: areaPoints,
                } as PolylineState,
            });

            areaFill.autoStroke = false;

            const line = createPolyline({
                id: `${srs.id}-line`,
                lineWidth: srs.lineWidth ?? 2,
                stroke: color,
                lineDash: resolveLineDash(srs.lineStyle),
                points: linePoints,
                renderer: srs.lineType,
                data: {
                    points: linePoints,
                } as PolylineState,
            });

            this._morphKeys.set(srs.id, data.map(getKey));

            return createGroup({
                id: srs.id,
                children: [
                    areaFill,
                    line,
                    ...markerElements,
                    ...(dataLabels.visible ? data.map((item, dataIndex) => buildLabel(srs)(item, dataIndex)) : []),
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

            const newKeys = data.map(getKey);
            const prevKeys = this._morphKeys.get(srs.id);
            const keyed = !!prevKeys && keysDiffer(prevKeys, newKeys);

            // Apply the renderer directly (not via the transition, which would snap it at t=0.5) and
            // key-reconcile the morph so curved lines/fills stay curved across add/remove. The fill is
            // a closed [top, reversed-bottom] polygon, so its keys are disambiguated per run (t:/b:)
            // to keep top matched to top and bottom to bottom.
            line.renderer = srs.lineType;
            areaFill.renderer = areaBandRenderer(srs.lineType);
            // Dash pattern is a static style (not tweened) — apply it directly.
            line.lineDash = resolveLineDash(srs.lineStyle);

            const fillKeys = (keys: string[]): string[] => [
                ...keys.map(key => `t:${key}`),
                ...keys.slice().reverse().map(key => `b:${key}`),
            ];

            line.data = {
                points: keyed
                    ? interpolatePoints(line.points, linePoints, {
                        resolveKeys: () => correspondence(prevKeys!, newKeys),
                    })
                    : linePoints,
            };

            areaFill.data = {
                points: keyed
                    ? interpolatePoints(areaFill.points, areaPoints, {
                        resolveKeys: () => correspondence(fillKeys(prevKeys!), fillKeys(newKeys)),
                    })
                    : areaPoints,
            };

            this._morphKeys.set(srs.id, newKeys);

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
                const x = this._xScale(getKey(item));
                const y = this._yScale(getSeriesValue(srs, item, dataIndex));

                marker.data = {
                    fill: '#FFFFFF',
                    stroke: color,
                    lineWidth: 2,
                    cx: x,
                    cy: y,
                    radius: 3,
                } as CircleState;

                this._attachMarkerHover(marker, srs, getKey(item), this._seriesValue(srs, item), color, x, y);
            });

            // Reconcile value labels alongside the markers.
            const labels = group.getElementsByType('text') as Text[];

            if (dataLabels.visible) {
                const {
                    left: labelEntries,
                    inner: labelUpdates,
                    right: labelExits,
                } = arrayJoin(data, labels, (item, label) => label.id === `${srs.id}-marker-${getKey(item)}-label`);

                labelExits.forEach(label => exitElement(this.renderer, label, exitAnimation, { opacity: 0 }));

                labelEntries.forEach(item => {
                    const label = buildLabel(srs)(item, data.indexOf(item));
                    group.add(label);
                    enteringLabels.push(label);
                });

                labelUpdates.forEach(([item, label]) => {
                    updateLabel(srs, item, data.indexOf(item), label);
                    updatingLabels.push(label);
                });
            } else {
                labels.forEach(label => exitElement(this.renderer, label, exitAnimation, { opacity: 0 }));
            }

            return group;
        });

        this.addPlotContent(seriesEntryGroups);

        this._areaGroups = [
            ...seriesEntryGroups,
            ...seriesUpdateGroups,
        ];

        // Series groups map 1:1 to legend items (by id); register them for legend hover-highlight.
        this.registerHighlightGroups(this._areaGroups);

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

        // Value labels: entry labels fade in; updated labels animate to their refreshed position.
        const entryLabels = seriesEntryGroups.flatMap(group => group.getElementsByType('text') as Text[]);
        const labelTransitions: Promise<unknown>[] = [];

        if (entryLabels.length > 0) {
            labelTransitions.push(this.renderer.transition(entryLabels, {
                duration: enter.duration,
                ease: enter.ease,
                state: { opacity: 1 },
            }));
        }

        if (enteringLabels.length > 0) {
            labelTransitions.push(this.renderer.transition(enteringLabels, {
                duration: update.duration,
                ease: update.ease,
                state: { opacity: 1 },
            }));
        }

        if (updatingLabels.length > 0) {
            labelTransitions.push(this.renderer.transition(updatingLabels, element => ({
                duration: update.duration,
                ease: update.ease,
                state: element.data as Partial<TextState>,
            })));
        }

        return Promise.all([
            ...entryTransitions,
            ...updateTransitions,
            ...labelTransitions,
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
                        cumulative += this._seriesValue(srs, item);
                        cumulativeMax = Math.max(cumulativeMax, cumulative);
                        cumulativeMin = Math.min(cumulativeMin, cumulative);
                    });

                    stackedMax = Math.max(stackedMax, cumulativeMax);
                    stackedMin = Math.min(stackedMin, cumulativeMin);
                });

                dataExtent = [stackedMin, stackedMax];
            } else {
                const seriesExtents = series
                    .flatMap(srs => getExtent(data, item => this._seriesValue(srs, item)))
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

            this._yScale = scaleContinuous(dataExtent, [bottom, top], { padToTicks: 10 });
            this.yAxis.scale = this._yScale;
            this.yAxis.bounds = new Box(top, left, bottom, right);

            const yAxisBox = this.yAxis.getBoundingBox();

            this._xScale = this.pointScale(keys, yAxisBox.right, right);
            this.xAxis.scale = this._xScale;
            this.xAxis.bounds = new Box(top, yAxisBox.right, bottom, right);

            const xAxisBox = this.xAxis.getBoundingBox();

            this._yScale = scaleContinuous(dataExtent, [xAxisBox.top, top], { padToTicks: 10 });
            this.yAxis.scale = this._yScale;
            this.yAxis.bounds.bottom = xAxisBox.top;

            // Rescale to the navigator's view (no-op at rest): continuous y via domain rescale,
            // categorical x via a pixel-space transform, so geometry and axes track together.
            this._yScale = this.applyView(this._yScale, 'y');
            this._xScale = this.applyViewToScale(this._xScale, 'x');
            this.xAxis.scale = this._xScale;
            this.yAxis.scale = this._yScale;

            const baseline = this._yScale(0);
            const plot = {
                x: yAxisBox.right,
                y: top,
                width: right - yAxisBox.right,
                height: xAxisBox.top - top,
            };

            this.clipPlot(plot);
            this.renderGrid([], this._yScale.ticks(10).map(tick => this._yScale(tick)), plot);
            this.setupCrosshair(plot);

            return Promise.all([
                this.xAxis.visible ? this.xAxis.render() : Promise.resolve(),
                this.yAxis.visible ? this.yAxis.render() : Promise.resolve(),
                this._drawAreas(baseline, plot),
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
