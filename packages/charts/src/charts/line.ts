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
    stagger,
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
    scaleContinuous,
} from '@ripl/core';

import {
    correspondence,
    keysDiffer,
} from '../core/morph';

import {
    arrayJoin,
    functionIdentity,
    typeIsFunction,
} from '@ripl/utilities';

/** Configuration for an individual line chart series. */
export interface LineChartSeriesOptions<TData> {
    /** Unique identifier for the series, used for colour assignment, legend, and data joins. */
    id: string;
    /** Explicit series colour; falls back to the chart's generated palette when omitted. */
    color?: string;
    /** Accessor for the series' value at each data item, or a constant applied to every item. */
    value: NumericAccessor<TData> | number;
    /** Series name shown in the legend and tooltips (or a per-item function). */
    label: string | ((item: TData) => string);
    /** Renderer used to draw the line (e.g. straight or curved); defaults to straight segments. */
    lineType?: PolylineRenderer;
    /** Width in pixels of the series line. */
    lineWidth?: number;
    /** Line dash style: `'solid'` (default), `'dashed'`, `'dotted'`, or a custom dash array. */
    lineStyle?: LineStyle;
    /** Show point markers along the line. Defaults to `true`; set `false` to hide them (toggling animates them in/out). */
    markers?: boolean;
    /** Radius in pixels of each point marker. Defaults to 3. */
    markerRadius?: number;
}

/** Options for configuring a {@link LineChart}. */
export interface LineChartOptions<TData = unknown> extends CartesianChartOptions<TData> {
    /** The dataset rendered by the chart. */
    data: TData[];
    /** The series to draw from each data item. */
    series: LineChartSeriesOptions<TData>[];
    /** Accessor for each item's category key (the value plotted along the x axis). */
    key: keyof TData | ((item: TData) => string);
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

/** Payload emitted for line marker interaction events. */
export interface LineChartMarkerEvent {
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

/** Events emitted by a {@link LineChart} that consumers can subscribe to via `chart.on(...)`. */
export interface LineChartEventMap extends EventMap {
    /** Emitted when a marker is clicked. */
    markerclick: LineChartMarkerEvent;
    /** Emitted when the pointer enters a marker. */
    markerenter: LineChartMarkerEvent;
    /** Emitted when the pointer leaves a marker. */
    markerleave: LineChartMarkerEvent;
}

/**
 * Line chart rendering one or more series as polylines with optional markers.
 *
 * Supports customisable line renderers (e.g. curved, stepped), interactive crosshair, tooltips,
 * legend, grid, chart title, and animated entry/update/exit transitions. Entry animations draw
 * lines progressively while markers appear with staggered delays.
 *
 * @typeParam TData - The type of each data item in the dataset.
 */
export class LineChart<TData = unknown> extends CartesianChart<LineChartOptions<TData>, TData, LineChartEventMap> {

    private _lineGroups: Group[] = [];
    /** Previous ordered data keys per series, used to key-reconcile the line morph across add/remove. */
    private _morphKeys = new Map<string, string[]>();
    private _yScale!: Scale;
    private _xScale!: Scale<string>;

    constructor(target: string | HTMLElement | Context, options: LineChartOptions<TData>) {
        super(target, options);

        this.setupCartesian({
            grid: { horizontal: true },
            crosshair: true,
        });

        this.init();
    }

    private _seriesLabel(series: LineChartSeriesOptions<TData>, item: TData): string {
        return typeIsFunction(series.label) ? series.label(item) : series.label;
    }

    private _markerState(series: LineChartSeriesOptions<TData>, item: TData, getKey: (item: TData) => string) {
        const value = resolveAccessor<TData, number>(series.value)(item);
        const key = getKey(item);
        const x = this._xScale(key);
        const y = this._yScale(value);
        const color = this.getSeriesColor(series.id);
        // A hidden marker rests at radius 0 (the toggle animates it in/out on update).
        const radius = series.markers === false ? 0 : (series.markerRadius ?? 3);

        return {
            id: `${series.id}-${key}`,
            value,
            point: [x, y] as Point,
            state: {
                fill: '#FFFFFF',
                stroke: color,
                lineWidth: 2,
                cx: x,
                cy: y,
                radius,
            } as CircleState,
        };
    }

    private _attachMarkerHover(marker: Circle, series: LineChartSeriesOptions<TData>, item: TData, value: number, state: CircleState, key: string) {
        if (series.markers === false) {
            marker.pointerEvents = 'none';
            return;
        }

        const radius = series.markerRadius ?? 3;
        const hover = this.resolveAnimation(ANIMATION_REFERENCE.hover);
        const formatValue = resolveValueFormat(this.options.format);

        const payload = (point: { x: number;
            y: number; }): LineChartMarkerEvent => ({
            x: point.x,
            y: point.y,
            xValue: key,
            yValue: value,
            seriesId: series.id,
        });

        applyHoverHighlight(marker, {
            renderer: this.renderer,
            duration: hover.duration,
            ease: hover.ease,
            tooltip: this.tooltip,
            anchor: () => ({
                x: marker.cx,
                y: marker.cy,
            }),
            content: () => `${this._seriesLabel(series, item)}: ${formatValue(value)}`,
            highlight: {
                fill: state.stroke as string,
                radius: radius + 2,
            },
            restore: {
                fill: '#FFFFFF',
                radius,
            },
            onEnter: point => this.emit('markerenter', payload(point)),
            onLeave: point => this.emit('markerleave', payload(point)),
            onClick: point => this.emit('markerclick', payload(point)),
        });
    }

    private async _drawLines(getKey: (item: TData) => string) {
        const { data, series } = this.options;
        const dataLabels = normalizeDataLabels(this.options.labels, { anchor: 'top' });
        const formatValue = resolveValueFormat(this.options.format);

        const {
            left: seriesEntries,
            inner: seriesUpdates,
            right: seriesExits,
        } = arrayJoin(series, this._lineGroups, 'id');

        const exitAnimation = this.resolveAnimation(ANIMATION_REFERENCE.exit);

        // Builds/updates the value label for a marker, offset clear of the marker radius.
        const labelOffset = (srs: LineChartSeriesOptions<TData>) => (srs.markerRadius ?? 3) + 4;

        const buildLabel = (srs: LineChartSeriesOptions<TData>) => (item: TData) => {
            const { id, value, point } = this._markerState(srs, item, getKey);

            return createDataLabel({
                id: `${id}-label`,
                x: point[0],
                y: point[1],
                anchor: dataLabels.anchor,
                content: formatValue(value),
                font: dataLabels.font,
                fill: dataLabels.fontColor,
                offset: labelOffset(srs),
            });
        };

        const updateLabel = (srs: LineChartSeriesOptions<TData>, item: TData, label: Text) => {
            const { value, point } = this._markerState(srs, item, getKey);
            const layout = resolveDataLabelLayout({
                x: point[0],
                y: point[1],
                anchor: dataLabels.anchor,
                offset: labelOffset(srs),
            });

            label.content = formatValue(value);
            label.data = {
                x: layout.x,
                y: layout.y,
                opacity: 1,
            } as Partial<TextState>;
        };

        const enteringLabels: Text[] = [];
        const updatingLabels: Text[] = [];

        seriesExits.forEach(group => {
            const exits = group.graph(false).map(element => exitElement(this.renderer, element, exitAnimation));
            void Promise.all(exits).then(() => group.destroy());
        });

        const buildMarker = (srs: LineChartSeriesOptions<TData>) => (item: TData) => {
            const { id, value, point, state } = this._markerState(srs, item, getKey);

            const marker = createCircle({
                id,
                ...state,
                radius: 0,
                data: state,
            });

            this._attachMarkerHover(marker, srs, item, value, state, getKey(item));

            return {
                point,
                marker,
            };
        };

        const seriesEntryGroups = seriesEntries.map(srs => {
            const color = this.getSeriesColor(srs.id);
            const items = data.map(buildMarker(srs));

            const line = createPolyline({
                id: `${srs.id}-line`,
                lineWidth: srs.lineWidth ?? 2,
                stroke: color,
                lineDash: resolveLineDash(srs.lineStyle),
                points: items.map(item => item.point),
                renderer: srs.lineType,
            });

            this._morphKeys.set(srs.id, data.map(getKey));

            return createGroup({
                id: srs.id,
                children: [
                    line,
                    ...items.map(item => item.marker),
                    ...(dataLabels.visible ? data.map(buildLabel(srs)) : []),
                ],
            });
        });

        const seriesUpdateGroups = seriesUpdates.map(([srs, group]) => {
            const line = group.getElementsByType('polyline')[0] as Polyline;
            const markers = group.getElementsByType('circle') as Circle[];

            // Apply the curve renderer directly (not via the transition). The renderer is a
            // discrete curve-function selector, not an interpolatable value — routing it through
            // the transition made it snap to the `linear` fallback mid-animation (see interpolateAny).
            line.renderer = srs.lineType;
            // Dash pattern is a static style (not tweened) — apply it directly.
            line.lineDash = resolveLineDash(srs.lineStyle);

            const newKeys = data.map(getKey);
            const targetPoints = data.map(item => this._markerState(srs, item, getKey).point);
            const prevKeys = this._morphKeys.get(srs.id);

            // When the set of keys changes (add/remove/reorder), match points by identity so the
            // curve renderer keeps its shape across the morph instead of drawing through the
            // straight-line points the default extrapolation would insert (which looks linear).
            line.data = {
                points: prevKeys && keysDiffer(prevKeys, newKeys)
                    ? interpolatePoints(line.points, targetPoints, {
                        resolveKeys: () => correspondence(prevKeys, newKeys),
                    })
                    : targetPoints,
            };

            this._morphKeys.set(srs.id, newKeys);

            const {
                left: markerEntries,
                inner: markerUpdates,
                right: markerExits,
            } = arrayJoin(data, markers, (item, marker) => marker.id === `${srs.id}-${getKey(item)}`);

            markerExits.forEach(marker => exitElement(this.renderer, marker, exitAnimation, {
                radius: 0,
                opacity: 0,
            }));

            markerEntries.forEach(item => group.add(buildMarker(srs)(item).marker));

            markerUpdates.forEach(([item, marker]) => {
                const { state, value } = this._markerState(srs, item, getKey);
                marker.data = state;
                this._attachMarkerHover(marker, srs, item, value, state, getKey(item));
            });

            // Reconcile value labels alongside the markers.
            const labels = group.getElementsByType('text') as Text[];

            if (dataLabels.visible) {
                const {
                    left: labelEntries,
                    inner: labelUpdates,
                    right: labelExits,
                } = arrayJoin(data, labels, (item, label) => label.id === `${srs.id}-${getKey(item)}-label`);

                labelExits.forEach(label => exitElement(this.renderer, label, exitAnimation, { opacity: 0 }));

                labelEntries.forEach(item => {
                    const label = buildLabel(srs)(item);
                    group.add(label);
                    enteringLabels.push(label);
                });

                labelUpdates.forEach(([item, label]) => {
                    updateLabel(srs, item, label);
                    updatingLabels.push(label);
                });
            } else {
                labels.forEach(label => exitElement(this.renderer, label, exitAnimation, { opacity: 0 }));
            }

            return group;
        });

        this.addPlotContent(seriesEntryGroups);

        this._lineGroups = [
            ...seriesEntryGroups,
            ...seriesUpdateGroups,
        ];

        // Series groups map 1:1 to legend items (by id); register them for legend hover-highlight.
        this.registerHighlightGroups(this._lineGroups);

        const enterAnimation = this.resolveAnimation(ANIMATION_REFERENCE.enter);
        const updateAnimation = this.resolveAnimation(ANIMATION_REFERENCE.update);

        const entryTransitions = seriesEntryGroups.flatMap(group => {
            const markers = group.getElementsByType('circle') as Circle[];
            const line = group.getElementsByType('polyline')[0] as Polyline;

            return [
                this.renderer.transition(line, {
                    duration: enterAnimation.duration,
                    ease: enterAnimation.ease,
                    state: { points: interpolatePath(line.points) },
                }),
                this.renderer.transition(markers, (element, index, length) => ({
                    duration: enterAnimation.duration,
                    delay: stagger(index, length, enterAnimation.duration),
                    ease: enterAnimation.ease,
                    state: element.data as CircleState,
                })),
            ];
        });

        const updateTransitions = seriesUpdateGroups.flatMap(group => {
            const markers = group.getElementsByType('circle') as Circle[];
            const line = group.getElementsByType('polyline')[0] as Polyline;

            return [
                this.renderer.transition(line, {
                    duration: updateAnimation.duration,
                    ease: updateAnimation.ease,
                    state: line.data as PolylineState,
                }),
                this.renderer.transition(markers, element => ({
                    duration: updateAnimation.duration,
                    ease: updateAnimation.ease,
                    state: element.data as CircleState,
                })),
            ];
        });

        // Value labels: entry labels fade in; updated labels animate to their refreshed position.
        const entryLabels = seriesEntryGroups.flatMap(group => group.getElementsByType('text') as Text[]);
        const labelTransitions: Promise<unknown>[] = [];

        if (entryLabels.length > 0) {
            labelTransitions.push(this.renderer.transition(entryLabels, {
                duration: enterAnimation.duration,
                ease: enterAnimation.ease,
                state: { opacity: 1 },
            }));
        }

        if (enteringLabels.length > 0) {
            labelTransitions.push(this.renderer.transition(enteringLabels, {
                duration: updateAnimation.duration,
                ease: updateAnimation.ease,
                state: { opacity: 1 },
            }));
        }

        if (updatingLabels.length > 0) {
            labelTransitions.push(this.renderer.transition(updatingLabels, element => ({
                duration: updateAnimation.duration,
                ease: updateAnimation.ease,
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
            const { data, series, key } = this.options;

            this.resolveSeriesColors(series);
            this.prepareAxes();

            const getKey = resolveAccessor<TData, string>(key);
            const keys = data.map(getKey);

            const seriesExtents = series
                .flatMap(srs => getExtent(data, resolveAccessor<TData, number>(srs.value)))
                .concat(0);

            const dataExtent = getExtent(seriesExtents, functionIdentity);

            const layout = this.createLayout();
            this.reserveTitle(layout);

            const legendItems: LegendItem[] = series.length > 1
                ? series.map(srs => ({
                    id: srs.id,
                    label: typeIsFunction(srs.label) ? srs.id : srs.label,
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

            // Provisional value scale to measure the y-axis width.
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

            // Rescale to the navigator's pan/zoom window (no-op without a navigator or at rest):
            // continuous y via domain rescale, categorical x via a pixel-space transform. Geometry
            // and axes read the same scales, so both follow the view.
            this._yScale = this.applyView(this._yScale, 'y');
            this._xScale = this.applyViewToScale(this._xScale, 'x');
            this.xAxis.scale = this._xScale;
            this.yAxis.scale = this._yScale;

            const plot = {
                x: yAxisBox.right,
                y: top,
                width: right - yAxisBox.right,
                height: xAxisBox.top - top,
            };

            this.clipPlot(plot);

            this.renderGrid(
                [],
                this._yScale.ticks(10).map(tick => this._yScale(tick)),
                plot
            );

            this.setupCrosshair(plot);

            return Promise.all([
                this.xAxis.visible ? this.xAxis.render() : Promise.resolve(),
                this.yAxis.visible ? this.yAxis.render() : Promise.resolve(),
                this._drawLines(getKey),
            ]);
        });
    }

}

/**
 * Factory function that creates a new {@link LineChart} instance.
 *
 * @example
 * ```ts
 * createLineChart(target, {
 *     data: [
 *         { month: 'Jan', sales: 30 },
 *         { month: 'Feb', sales: 48 },
 *     ],
 *     key: 'month',
 *     series: [
 *         { id: 'sales', label: 'Sales', value: 'sales' },
 *     ],
 * });
 * ```
 */
export function createLineChart<TData = unknown>(target: string | HTMLElement | Context, options: LineChartOptions<TData>) {
    return new LineChart<TData>(target, options);
}
