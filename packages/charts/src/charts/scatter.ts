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
    resolveValueFormat,
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
    Scale,
    Text,
    TextState,
} from '@ripl/core';

import {
    Box,
    createCircle,
    createGroup,
    getExtent,
    scaleContinuous,
    setColorAlpha,
} from '@ripl/core';

import {
    arrayJoin,
    functionIdentity,
    typeIsFunction,
} from '@ripl/utilities';

/** Configuration for an individual scatter chart series. */
export interface ScatterChartSeriesOptions<TData> {
    /** Unique identifier for the series. */
    id: string;
    /** Optional colour override for the series (otherwise a palette colour is generated). */
    color?: string;
    /** Accessor for each item's value on the x-axis. */
    xBy: NumericAccessor<TData>;
    /** Accessor for each item's value on the y-axis. */
    yBy: NumericAccessor<TData>;
    /** Optional accessor whose value scales each bubble's size between `minRadius` and `maxRadius`. */
    sizeBy?: NumericAccessor<TData> | number;
    /** Display label for the series, or an accessor deriving a per-item label. */
    label: string | ((item: TData) => string);
    /** Smallest bubble radius in pixels. Defaults to 3. */
    minRadius?: number;
    /** Largest bubble radius in pixels when `sizeBy` is set. Defaults to 20. */
    maxRadius?: number;
}

/** Options for configuring a {@link ScatterChart}. */
export interface ScatterChartOptions<TData = unknown> extends CartesianChartOptions<TData> {
    /** The dataset plotted across all series. */
    data: TData[];
    /** The series to render, each mapping the data to x/y (and optional size) positions. */
    series: ScatterChartSeriesOptions<TData>[];
    /** Accessor for each item's unique key, used to match bubbles across data updates. */
    key: keyof TData | ((item: TData) => string);
    /** Background grid line configuration. */
    grid?: ChartGridInput;
    /** Crosshair overlay configuration. */
    crosshair?: ChartCrosshairInput;
    /** Hover tooltip configuration. */
    tooltip?: ChartTooltipInput;
    /** Series legend configuration. */
    legend?: ChartLegendInput;
    /** Axis configuration (labels, ticks, titles). */
    axis?: ChartAxisInput<TData>;
    /** Show value labels next to each bubble. `true` uses the default anchor; a string sets the anchor side. */
    labels?: ChartDataLabelsInput;
    /** Format applied to bubble values shown as text (tooltips and labels). */
    format?: ValueFormatInput;
}

/** Payload emitted for scatter marker interaction events. */
export interface ScatterChartMarkerEvent {
    /** X position of the bubble, in canvas coordinates. */
    x: number;
    /** Y position of the bubble, in canvas coordinates. */
    y: number;
    /** The bubble's value on the x-axis. */
    xValue: number;
    /** The bubble's value on the y-axis. */
    yValue: number;
    /** The bubble's size value (equals the x/y position basis when the series has no `sizeBy`). */
    sizeValue: number;
    /** The id of the series the bubble belongs to. */
    seriesId: string;
}

/** Events emitted by a {@link ScatterChart} that consumers can subscribe to via `chart.on(...)`. */
export interface ScatterChartEventMap extends EventMap {
    /** Emitted when a bubble is clicked. */
    markerclick: ScatterChartMarkerEvent;
    /** Emitted when the pointer enters a bubble. */
    markerenter: ScatterChartMarkerEvent;
    /** Emitted when the pointer leaves a bubble. */
    markerleave: ScatterChartMarkerEvent;
}

const REST_ALPHA = 0.7;

/**
 * Scatter chart (bubble chart) plotting data points as circles on two continuous axes.
 *
 * Supports optional bubble sizing via a third value dimension, multi-series rendering, crosshair,
 * tooltips, legend, chart title, and grid. Points animate in with staggered scale transitions and
 * fade/shrink on exit.
 *
 * @typeParam TData - The type of each data item in the dataset.
 */
export class ScatterChart<TData = unknown> extends CartesianChart<ScatterChartOptions<TData>, TData, ScatterChartEventMap> {

    private _bubbleGroups: Group[] = [];
    private _xScale!: Scale;
    private _yScale!: Scale;
    private _sizeScale!: Scale;

    constructor(target: string | HTMLElement | Context, options: ScatterChartOptions<TData>) {
        super(target, options);

        this.setupCartesian({
            grid: {
                horizontal: true,
                vertical: true,
            },
            crosshair: true,
            crosshairAxisDefault: 'both',
        });

        this.init();
    }

    private _getSizeExtent(): [number, number] {
        const { data, series } = this.options;
        const sizes: number[] = [];

        series.forEach(({ sizeBy }) => {
            if (sizeBy === undefined) {
                return;
            }

            const getSize = resolveAccessor<TData, number>(sizeBy);
            data.forEach(item => sizes.push(getSize(item)));
        });

        return sizes.length > 0 ? getExtent(sizes, functionIdentity) : [1, 1];
    }

    /**
     * The largest radius any bubble can reach at rest, used to inset the plot scales so edge
     * points stay fully inside the chart area. Includes a small cushion for the bubble stroke.
     */
    private _getMaxBubbleRadius(): number {
        const { series } = this.options;
        const radii = series.map(srs => (srs.sizeBy === undefined ? (srs.minRadius ?? 3) : (srs.maxRadius ?? 20)));
        const largest = radii.length > 0 ? Math.max(...radii) : 3;

        return largest + 2;
    }

    private _bubbleValueProducer(series: ScatterChartSeriesOptions<TData>, getKey: (item: TData) => string) {
        const {
            id,
            xBy,
            yBy,
            sizeBy,
            label,
            color,
            minRadius = 3,
            maxRadius = 20,
        } = series;

        const getX = resolveAccessor<TData, number>(xBy);
        const getY = resolveAccessor<TData, number>(yBy);
        const getSize = sizeBy === undefined ? () => minRadius : resolveAccessor<TData, number>(sizeBy);
        const getLabel = typeIsFunction(label) ? label : () => label;
        const resolvedColor = color ?? this.getSeriesColor(id);

        return (item: TData) => {
            const xValue = getX(item);
            const yValue = getY(item);
            const sizeValue = getSize(item);
            // When every size value is identical the size extent is degenerate and the scale
            // returns a non-finite value; fall back to the midpoint so bubbles share one size.
            const sizeRatio = this._sizeScale(sizeValue);
            const normalizedSize = Number.isFinite(sizeRatio) ? sizeRatio : 0.5;
            const radius = sizeBy === undefined
                ? minRadius
                : normalizedSize * (maxRadius - minRadius) + minRadius;

            return {
                id: `${id}-${getKey(item)}`,
                seriesId: id,
                xValue,
                yValue,
                sizeValue,
                label: getLabel(item),
                hasSize: sizeBy !== undefined,
                state: {
                    fill: setColorAlpha(resolvedColor, REST_ALPHA),
                    stroke: resolvedColor,
                    lineWidth: 2,
                    cx: this._xScale(xValue),
                    cy: this._yScale(yValue),
                    radius,
                } as CircleState,
            };
        };
    }

    private _attachBubbleHover(bubble: Circle, values: { seriesId: string;
        xValue: number;
        yValue: number;
        sizeValue: number; }, content: string, state: CircleState) {
        const hover = this.resolveAnimation(ANIMATION_REFERENCE.hover);
        const stroke = state.stroke as string;

        const payload = (point: { x: number;
            y: number; }): ScatterChartMarkerEvent => ({
            x: point.x,
            y: point.y,
            xValue: values.xValue,
            yValue: values.yValue,
            sizeValue: values.sizeValue,
            seriesId: values.seriesId,
        });

        applyHoverHighlight(bubble, {
            renderer: this.renderer,
            duration: hover.duration,
            ease: hover.ease,
            tooltip: this.tooltip,
            anchor: () => ({
                x: bubble.cx,
                y: bubble.cy - bubble.radius - 10,
            }),
            content: () => content,
            highlight: {
                fill: stroke,
                radius: state.radius * 1.2,
            },
            restore: {
                fill: setColorAlpha(stroke, REST_ALPHA),
                radius: state.radius,
            },
            onEnter: point => this.emit('markerenter', payload(point)),
            onLeave: point => this.emit('markerleave', payload(point)),
            onClick: point => this.emit('markerclick', payload(point)),
        });
    }

    private _tooltipText(values: { label: string;
        xValue: number;
        yValue: number;
        sizeValue: number;
        hasSize: boolean; }): string {
        const { label, xValue, yValue, sizeValue, hasSize } = values;
        const format = resolveValueFormat(this.options.format);

        return hasSize
            ? `${label}: (${format(xValue)}, ${format(yValue)}, ${format(sizeValue)})`
            : `${label}: (${format(xValue)}, ${format(yValue)})`;
    }

    private async _drawBubbles(getKey: (item: TData) => string) {
        const { data, series } = this.options;
        const exitAnimation = this.resolveAnimation(ANIMATION_REFERENCE.exit);
        const dataLabels = normalizeDataLabels(this.options.labels, { anchor: 'top' });
        const formatValue = resolveValueFormat(this.options.format);

        const {
            left: seriesEntries,
            inner: seriesUpdates,
            right: seriesExits,
        } = arrayJoin(series, this._bubbleGroups, 'id');

        // Builds the value label for a bubble, offset clear of the bubble's radius.
        const buildLabel = (srs: ScatterChartSeriesOptions<TData>) => {
            const getValues = this._bubbleValueProducer(srs, getKey);

            return (item: TData) => {
                const values = getValues(item);
                const { state } = values;

                return createDataLabel({
                    id: `${values.id}-label`,
                    x: state.cx as number,
                    y: state.cy as number,
                    anchor: dataLabels.anchor,
                    content: formatValue(values.yValue),
                    font: dataLabels.font,
                    fill: dataLabels.fontColor,
                    offset: (state.radius as number) + 4,
                });
            };
        };

        const updateLabel = (srs: ScatterChartSeriesOptions<TData>, item: TData, label: Text) => {
            const values = this._bubbleValueProducer(srs, getKey)(item);
            const { state } = values;
            const layout = resolveDataLabelLayout({
                x: state.cx as number,
                y: state.cy as number,
                anchor: dataLabels.anchor,
                offset: (state.radius as number) + 4,
            });

            label.content = formatValue(values.yValue);
            label.data = {
                x: layout.x,
                y: layout.y,
                opacity: 1,
            } as Partial<TextState>;
        };

        const enteringLabels: Text[] = [];
        const updatingLabels: Text[] = [];

        seriesExits.forEach(group => {
            const exits = (group.getElementsByType('circle') as Circle[]).map(bubble => exitElement(this.renderer, bubble, exitAnimation, {
                radius: 0,
                fill: setColorAlpha(bubble.fill as string, 0),
                stroke: setColorAlpha(bubble.stroke as string, 0),
            }));

            void Promise.all(exits).then(() => group.destroy());
        });

        const buildBubble = (srs: ScatterChartSeriesOptions<TData>) => {
            const getValues = this._bubbleValueProducer(srs, getKey);

            return (item: TData) => {
                const values = getValues(item);
                const { id, state } = values;

                const bubble = createCircle({
                    id,
                    ...state,
                    radius: 0,
                    fill: setColorAlpha(state.fill as string, 0),
                    stroke: setColorAlpha(state.stroke as string, 0),
                    data: state,
                });

                this._attachBubbleHover(bubble, values, this._tooltipText(values), state);

                return bubble;
            };
        };

        const seriesEntryGroups = seriesEntries.map(srs => createGroup({
            id: srs.id,
            children: [
                ...data.map(buildBubble(srs)),
                ...(dataLabels.visible ? data.map(buildLabel(srs)) : []),
            ],
        }));

        const exitTransitions: Promise<unknown>[] = [];

        const seriesUpdateGroups = seriesUpdates.map(([srs, group]) => {
            const getValues = this._bubbleValueProducer(srs, getKey);
            const bubbles = group.getElementsByType('circle') as Circle[];

            const {
                left: bubbleEntries,
                inner: bubbleUpdates,
                right: bubbleExits,
            } = arrayJoin(data, bubbles, (item, bubble) => bubble.id === `${srs.id}-${getKey(item)}`);

            bubbleExits.forEach(bubble => exitTransitions.push(exitElement(this.renderer, bubble, exitAnimation, {
                radius: 0,
                fill: setColorAlpha(bubble.fill as string, 0),
                stroke: setColorAlpha(bubble.stroke as string, 0),
            })));

            bubbleEntries.forEach(item => group.add(buildBubble(srs)(item)));

            bubbleUpdates.forEach(([item, bubble]) => {
                const values = getValues(item);
                bubble.data = values.state;
                this._attachBubbleHover(bubble, values, this._tooltipText(values), values.state);
            });

            // Reconcile value labels alongside the bubbles.
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

        this._bubbleGroups = [
            ...seriesEntryGroups,
            ...seriesUpdateGroups,
        ];

        // Series groups map 1:1 to legend items (by id); register them for legend hover-highlight.
        this.registerHighlightGroups(this._bubbleGroups);

        const enter = this.resolveAnimation(ANIMATION_REFERENCE.enter);
        const update = this.resolveAnimation(ANIMATION_REFERENCE.update);

        const entryTransitions = seriesEntryGroups.map(group => {
            const bubbles = group.getElementsByType('circle') as Circle[];

            return this.renderer.transition(bubbles, (element, index, length) => ({
                duration: enter.duration,
                delay: stagger(index, length, enter.duration, 0.8),
                ease: enter.ease,
                state: element.data as CircleState,
            }));
        });

        const updateTransitions = seriesUpdateGroups.map(group => {
            const bubbles = group.getElementsByType('circle') as Circle[];

            return this.renderer.transition(bubbles, element => ({
                duration: update.duration,
                ease: update.ease,
                state: element.data as CircleState,
            }));
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
            ...exitTransitions,
            ...labelTransitions,
        ]);
    }

    public async render() {
        return super.render(async () => {
            const { data, series, key } = this.options;

            this.resolveSeriesColors(series);
            this.prepareAxes();

            const getKey = resolveAccessor<TData, string>(key);

            const xExtents = series.flatMap(({ xBy }) => getExtent(data, resolveAccessor<TData, number>(xBy)));
            const yExtents = series.flatMap(({ yBy }) => getExtent(data, resolveAccessor<TData, number>(yBy)));

            const xExtent = getExtent(xExtents, functionIdentity);
            const yExtent = getExtent(yExtents, functionIdentity);
            this._sizeScale = scaleContinuous(this._getSizeExtent(), [0, 1]);

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

            // Inset the data range by the largest possible bubble radius so a point sitting on the
            // edge of the data extent keeps its whole circle inside the plot area instead of
            // drawing past the boundary. The axis bounds/grid still span the full plot.
            const maxRadius = this._getMaxBubbleRadius();

            // Provisional Y scale to measure the y-axis width.
            this._yScale = scaleContinuous(yExtent, [bottom - maxRadius, top + maxRadius], { padToTicks: 10 });
            this.yAxis.scale = this._yScale;
            this.yAxis.bounds = new Box(top, left, bottom, right);

            const yAxisBox = this.yAxis.getBoundingBox();

            this._xScale = scaleContinuous(xExtent, [yAxisBox.right + maxRadius, right - maxRadius], { padToTicks: 10 });
            this.xAxis.scale = this._xScale;
            this.xAxis.bounds = new Box(top, yAxisBox.right, bottom, right);

            const xAxisBox = this.xAxis.getBoundingBox();

            this._yScale = scaleContinuous(yExtent, [xAxisBox.top - maxRadius, top + maxRadius], { padToTicks: 10 });

            // Rescale the axis domains to the navigator's current pan/zoom window (no-op when the
            // chart has no navigator or the view is at rest). Geometry and axes read the same scales,
            // so both follow the view.
            this._xScale = this.applyView(this._xScale, 'x');
            this._yScale = this.applyView(this._yScale, 'y');
            this.xAxis.scale = this._xScale;
            this.yAxis.scale = this._yScale;
            this.yAxis.bounds.bottom = xAxisBox.top;

            const plot = {
                x: yAxisBox.right,
                y: top,
                width: right - yAxisBox.right,
                height: xAxisBox.top - top,
            };

            this.clipPlot(plot);

            this.renderGrid(
                this._xScale.ticks(10).map(tick => this._xScale(tick)),
                this._yScale.ticks(10).map(tick => this._yScale(tick)),
                plot
            );

            this.setupCrosshair(plot);

            return Promise.all([
                this.xAxis.visible ? this.xAxis.render() : Promise.resolve(),
                this.yAxis.visible ? this.yAxis.render() : Promise.resolve(),
                this._drawBubbles(getKey),
            ]);
        });
    }

}

/**
 * Factory function that creates a new {@link ScatterChart} instance.
 *
 * @example
 * ```ts
 * createScatterChart(target, {
 *     data: [
 *         { id: 'a', weight: 70, height: 175, age: 30 },
 *         { id: 'b', weight: 85, height: 182, age: 45 },
 *     ],
 *     key: 'id',
 *     series: [{
 *         id: 'people',
 *         label: 'People',
 *         xBy: 'height',
 *         yBy: 'weight',
 *         sizeBy: 'age',
 *     }],
 * });
 * ```
 */
export function createScatterChart<TData = unknown>(target: string | HTMLElement | Context, options: ScatterChartOptions<TData>) {
    return new ScatterChart<TData>(target, options);
}
