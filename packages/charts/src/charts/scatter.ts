import {
    CartesianChart,
    CartesianChartOptions,
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
    EventMap,
    getExtent,
    Group,
    Scale,
    scaleContinuous,
    setColorAlpha,
    Text,
    TextState,
} from '@ripl/core';

import {
    arrayJoin,
    functionIdentity,
    typeIsFunction,
} from '@ripl/utilities';

/** Configuration for an individual scatter chart series. */
export interface ScatterChartSeriesOptions<TData> {
    id: string;
    color?: string;
    xBy: keyof TData | ((item: TData) => number);
    yBy: keyof TData | ((item: TData) => number);
    sizeBy?: keyof TData | number | ((item: TData) => number);
    label: string | ((item: TData) => string);
    minRadius?: number;
    maxRadius?: number;
}

/** Options for configuring a {@link ScatterChart}. */
export interface ScatterChartOptions<TData = unknown> extends CartesianChartOptions<TData> {
    data: TData[];
    series: ScatterChartSeriesOptions<TData>[];
    key: keyof TData | ((item: TData) => string);
    grid?: ChartGridInput;
    crosshair?: ChartCrosshairInput;
    tooltip?: ChartTooltipInput;
    legend?: ChartLegendInput;
    axis?: ChartAxisInput<TData>;
    /** Show value labels next to each bubble. `true` uses the default anchor; a string sets the anchor side. */
    labels?: ChartDataLabelsInput;
    /** Format applied to bubble values shown as text (tooltips and labels). */
    format?: ValueFormatInput;
}

/** Payload emitted for scatter marker interaction events. */
export interface ScatterChartMarkerEvent {
    x: number;
    y: number;
    xValue: number;
    yValue: number;
    sizeValue: number;
    seriesId: string;
}

/** Events emitted by a {@link ScatterChart} that consumers can subscribe to via `chart.on(...)`. */
export interface ScatterChartEventMap extends EventMap {
    markerclick: ScatterChartMarkerEvent;
    markerenter: ScatterChartMarkerEvent;
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

    private bubbleGroups: Group[] = [];
    private xScale!: Scale;
    private yScale!: Scale;
    private sizeScale!: Scale;

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

    private getSizeExtent(): [number, number] {
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
    private getMaxBubbleRadius(): number {
        const { series } = this.options;
        const radii = series.map(srs => (srs.sizeBy === undefined ? (srs.minRadius ?? 3) : (srs.maxRadius ?? 20)));
        const largest = radii.length > 0 ? Math.max(...radii) : 3;

        return largest + 2;
    }

    private bubbleValueProducer(series: ScatterChartSeriesOptions<TData>, getKey: (item: TData) => string) {
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
            const sizeRatio = this.sizeScale(sizeValue);
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
                    cx: this.xScale(xValue),
                    cy: this.yScale(yValue),
                    radius,
                } as CircleState,
            };
        };
    }

    private attachBubbleHover(bubble: Circle, values: { seriesId: string;
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

    private tooltipText(values: { label: string;
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

    private async drawBubbles(getKey: (item: TData) => string) {
        const { data, series } = this.options;
        const exitAnimation = this.resolveAnimation(ANIMATION_REFERENCE.exit);
        const dataLabels = normalizeDataLabels(this.options.labels, { anchor: 'top' });
        const formatValue = resolveValueFormat(this.options.format);

        const {
            left: seriesEntries,
            inner: seriesUpdates,
            right: seriesExits,
        } = arrayJoin(series, this.bubbleGroups, 'id');

        // Builds the value label for a bubble, offset clear of the bubble's radius.
        const buildLabel = (srs: ScatterChartSeriesOptions<TData>) => {
            const getValues = this.bubbleValueProducer(srs, getKey);

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
            const values = this.bubbleValueProducer(srs, getKey)(item);
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
            const getValues = this.bubbleValueProducer(srs, getKey);

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

                this.attachBubbleHover(bubble, values, this.tooltipText(values), state);

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
            const getValues = this.bubbleValueProducer(srs, getKey);
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
                this.attachBubbleHover(bubble, values, this.tooltipText(values), values.state);
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

        this.scene.add(seriesEntryGroups);

        this.bubbleGroups = [
            ...seriesEntryGroups,
            ...seriesUpdateGroups,
        ];

        // Series groups map 1:1 to legend items (by id); register them for legend hover-highlight.
        this.registerHighlightGroups(this.bubbleGroups);

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
            this.sizeScale = scaleContinuous(this.getSizeExtent(), [0, 1]);

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
            const maxRadius = this.getMaxBubbleRadius();

            // Provisional Y scale to measure the y-axis width.
            this.yScale = scaleContinuous(yExtent, [bottom - maxRadius, top + maxRadius], { padToTicks: 10 });
            this.yAxis.scale = this.yScale;
            this.yAxis.bounds = new Box(top, left, bottom, right);

            const yAxisBox = this.yAxis.getBoundingBox();

            this.xScale = scaleContinuous(xExtent, [yAxisBox.right + maxRadius, right - maxRadius], { padToTicks: 10 });
            this.xAxis.scale = this.xScale;
            this.xAxis.bounds = new Box(top, yAxisBox.right, bottom, right);

            const xAxisBox = this.xAxis.getBoundingBox();

            this.yScale = scaleContinuous(yExtent, [xAxisBox.top - maxRadius, top + maxRadius], { padToTicks: 10 });
            this.yAxis.scale = this.yScale;
            this.yAxis.bounds.bottom = xAxisBox.top;

            const plot = {
                x: yAxisBox.right,
                y: top,
                width: right - yAxisBox.right,
                height: xAxisBox.top - top,
            };

            this.renderGrid(
                this.xScale.ticks(10).map(tick => this.xScale(tick)),
                this.yScale.ticks(10).map(tick => this.yScale(tick)),
                plot
            );

            this.setupCrosshair(plot);

            return Promise.all([
                this.xAxis.visible ? this.xAxis.render() : Promise.resolve(),
                this.yAxis.visible ? this.yAxis.render() : Promise.resolve(),
                this.drawBubbles(getKey),
            ]);
        });
    }

}

/** Factory function that creates a new {@link ScatterChart} instance. */
export function createScatterChart<TData = unknown>(target: string | HTMLElement | Context, options: ScatterChartOptions<TData>) {
    return new ScatterChart<TData>(target, options);
}
