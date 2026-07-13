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
    computeStackOffset,
    resolveAccessor,
} from '../core/data';

import type {
    LegendItem,
} from '../components/legend';

import type {
    BandScale,
    BorderRadius,
    Context,
    EventMap,
    Group,
    Rect,
    RectState,
    Text,
    TextState,
} from '@ripl/core';

import {
    Box,
    createGroup,
    createRect,
    getExtent,
    max,
    queryAll,
    scaleBand,
    scaleContinuous,
    setColorAlpha,
} from '@ripl/core';

import {
    arrayJoin,
    functionIdentity,
} from '@ripl/utilities';

export type BarChartOrientation = 'vertical' | 'horizontal';
export type BarChartMode = 'grouped' | 'stacked';

/** The opacity applied to a bar's fill at rest (full opacity is used on hover). */
const REST_ALPHA = 0.78;

/** Configuration for an individual bar chart series. */
export interface BarChartSeriesOptions<TData> {
    id: string;
    color?: string;
    value: NumericAccessor<TData> | number;
    label: string;
}

/** Options for configuring a {@link BarChart}. */
export interface BarChartOptions<TData = unknown> extends CartesianChartOptions<TData> {
    data: TData[];
    series: BarChartSeriesOptions<TData>[];
    key: keyof TData | ((item: TData) => string);
    orientation?: BarChartOrientation;
    mode?: BarChartMode;
    grid?: ChartGridInput;
    tooltip?: ChartTooltipInput;
    legend?: ChartLegendInput;
    axis?: ChartAxisInput<TData>;
    borderRadius?: number;
    /** Show value labels next to each bar. `true` uses the default anchor; a string sets the anchor side. */
    labels?: ChartDataLabelsInput;
    /** Format applied to bar values shown as text (tooltips and labels). */
    format?: ValueFormatInput;
}

/** Payload emitted for bar interaction events. */
export interface BarChartBarEvent {
    x: number;
    y: number;
    xValue: string;
    yValue: number;
    seriesId: string;
}

/** Events emitted by a {@link BarChart} that consumers can subscribe to via `chart.on(...)`. */
export interface BarChartEventMap extends EventMap {
    barclick: BarChartBarEvent;
    barenter: BarChartBarEvent;
    barleave: BarChartBarEvent;
}

/**
 * Bar chart supporting vertical/horizontal orientation and grouped/stacked modes.
 *
 * Uses band scales for categorical axes and continuous scales for value axes. Supports multiple
 * series with grouped or stacked bar rendering, interactive tooltips, legend, grid, chart title,
 * and animated entry/update/exit transitions. In stacked mode only the outermost segment is
 * rounded (on its outer corners) and the column reveals as a single rising fill on entry rather
 * than each segment animating separately.
 *
 * @typeParam TData - The type of each data item in the dataset.
 */
export class BarChart<TData = unknown> extends CartesianChart<BarChartOptions<TData>, TData, BarChartEventMap> {

    private _barGroups: Group[] = [];

    constructor(target: string | HTMLElement | Context, options: BarChartOptions<TData>) {
        super(target, options);

        this.setupCartesian({
            grid: {
                horizontal: !this._isHorizontal,
                vertical: this._isHorizontal,
            },
        });

        this.init();
    }

    private get _isHorizontal() {
        return this.options.orientation === 'horizontal';
    }

    private get _isStacked() {
        return this.options.mode === 'stacked';
    }

    private _seriesValue(series: BarChartSeriesOptions<TData>, item: TData): number {
        return resolveAccessor<TData, number>(series.value)(item);
    }

    private _stackOffset(series: BarChartSeriesOptions<TData>[], current: BarChartSeriesOptions<TData>, item: TData): number {
        if (!this._isStacked) {
            return 0;
        }

        return computeStackOffset(series, current, item, (s, i) => this._seriesValue(s, i));
    }

    /** Wires consistent hover highlight + tooltip + interaction events onto a bar. */
    private _attachBarHover(bar: Rect, srs: BarChartSeriesOptions<TData>, key: string, value: number, anchor: () => { x: number;
        y: number; }) {
        const restFill = bar.fill as string;
        const hover = this.resolveAnimation(ANIMATION_REFERENCE.hover);
        const formatValue = resolveValueFormat(this.options.format);

        const payload = (point: { x: number;
            y: number; }): BarChartBarEvent => ({
            x: point.x,
            y: point.y,
            xValue: key,
            yValue: value,
            seriesId: srs.id,
        });

        applyHoverHighlight(bar, {
            renderer: this.renderer,
            duration: hover.duration,
            ease: hover.ease,
            tooltip: this.tooltip,
            anchor,
            content: () => `${srs.label}: ${formatValue(value)}`,
            highlight: { fill: setColorAlpha(restFill, 1) },
            restore: { fill: restFill },
            onEnter: point => this.emit('barenter', payload(point)),
            onLeave: point => this.emit('barleave', payload(point)),
            onClick: point => this.emit('barclick', payload(point)),
        });
    }

    private async _drawBars(
        categoryScale: BandScale<string>,
        valueScale: ReturnType<typeof scaleContinuous>,
        getKey: (item: TData) => string
    ) {
        const { data, series } = this.options;
        const horizontal = this._isHorizontal;
        const baseline = valueScale(0);
        const cornerRadius = this.options.borderRadius ?? 2;
        const dataLabels = normalizeDataLabels(this.options.labels, { anchor: horizontal ? 'right' : 'top' });
        const formatValue = resolveValueFormat(this.options.format);

        let seriesScale: BandScale<string> | undefined;

        if (!this._isStacked) {
            seriesScale = scaleBand(series.map(s => s.id), [0, categoryScale.bandwidth], {
                innerPadding: 0.1,
            });
        }

        // Per-column totals (by sign) and category order — used to round only the outermost
        // segment of a stack and to time the stacked entry as a single rising fill.
        const keyIndex = new Map<string, number>(data.map((item, index) => [getKey(item), index]));
        const columnTotals = new Map<string, { pos: number;
            neg: number; }>();

        data.forEach(item => {
            let pos = 0;
            let neg = 0;

            series.forEach(srs => {
                const value = this._seriesValue(srs, item);

                if (value >= 0) {
                    pos += value;
                } else {
                    neg += -value;
                }
            });

            columnTotals.set(getKey(item), {
                pos,
                neg,
            });
        });

        // The index of the last same-sign series contributing to a column (its outermost segment).
        const outermostStackIndex = (item: TData, positive: boolean) => {
            let outer = -1;

            series.forEach((srs, index) => {
                const value = this._seriesValue(srs, item);

                if (value === 0) {
                    return;
                }

                if ((value >= 0) === positive) {
                    outer = index;
                }
            });

            return outer;
        };

        const stackedBorderRadius = (srs: BarChartSeriesOptions<TData>, item: TData, value: number): number | BorderRadius => {
            const positive = value >= 0;

            if (series.indexOf(srs) !== outermostStackIndex(item, positive)) {
                return 0;
            }

            if (horizontal) {
                return positive
                    ? [0, cornerRadius, cornerRadius, 0]
                    : [cornerRadius, 0, 0, cornerRadius];
            }

            return positive
                ? [cornerRadius, cornerRadius, 0, 0]
                : [0, 0, cornerRadius, cornerRadius];
        };

        const entryTiming = new Map<string, { delayFraction: number;
            durationFraction: number;
            columnIndex: number; }>();

        const getBarState = (srs: BarChartSeriesOptions<TData>, item: TData) => {
            const value = this._seriesValue(srs, item);
            const key = getKey(item);
            const color = this.getSeriesColor(srs.id);
            const stackOffset = this._stackOffset(series, srs, item);

            let x: number;
            let y: number;
            let width: number;
            let height: number;

            if (horizontal) {
                if (this._isStacked) {
                    y = categoryScale(key);
                    height = categoryScale.bandwidth;
                    x = valueScale(value >= 0 ? stackOffset : value + stackOffset);
                    width = Math.abs(valueScale(0) - valueScale(Math.abs(value)));
                } else {
                    y = categoryScale(key) + (seriesScale ? seriesScale(srs.id) : 0);
                    height = seriesScale ? seriesScale.bandwidth : categoryScale.bandwidth;
                    x = Math.min(baseline, valueScale(value));
                    width = Math.abs(valueScale(value) - baseline);
                }
            } else if (this._isStacked) {
                x = categoryScale(key);
                width = categoryScale.bandwidth;
                y = valueScale(value >= 0 ? value + stackOffset : stackOffset);
                height = Math.abs(valueScale(0) - valueScale(Math.abs(value)));
            } else {
                x = categoryScale(key) + (seriesScale ? seriesScale(srs.id) : 0);
                width = seriesScale ? seriesScale.bandwidth : categoryScale.bandwidth;
                y = valueScale(max(0, value));
                height = Math.abs(baseline - valueScale(value));
            }

            const borderRadius = this._isStacked ? stackedBorderRadius(srs, item, value) : cornerRadius;

            if (this._isStacked) {
                const totals = columnTotals.get(key);
                const columnTotal = value >= 0 ? (totals?.pos ?? 0) : (totals?.neg ?? 0);

                entryTiming.set(`${srs.id}-${key}`, {
                    delayFraction: columnTotal > 0 ? Math.abs(stackOffset) / columnTotal : 0,
                    durationFraction: columnTotal > 0 ? Math.abs(value) / columnTotal : 1,
                    columnIndex: keyIndex.get(key) ?? 0,
                });
            }

            return {
                id: `${srs.id}-${key}`,
                value,
                state: {
                    fill: color,
                    x,
                    y,
                    width,
                    height,
                    borderRadius,
                } as RectState,
            };
        };

        const anchorFor = (state: RectState) => () => (horizontal
            ? {
                x: state.x + state.width,
                y: state.y + state.height / 2,
            }
            : {
                x: state.x + state.width / 2,
                y: state.y,
            });

        // The collapsed initial geometry an entering/exiting bar grows from (chart baseline).
        const collapsed = (): Partial<RectState> => (horizontal
            ? {
                x: baseline,
                width: 0,
            }
            : {
                y: baseline,
                height: 0,
            });

        // A stacked segment collapses to its own lower edge so the column reveals as one rising
        // fill rather than every segment growing from the chart baseline.
        const collapsedEntry = (srs: BarChartSeriesOptions<TData>, item: TData): Partial<RectState> => {
            if (!this._isStacked) {
                return collapsed();
            }

            const stackOffset = this._stackOffset(series, srs, item);

            return horizontal
                ? {
                    x: valueScale(stackOffset),
                    width: 0,
                }
                : {
                    y: valueScale(stackOffset),
                    height: 0,
                };
        };

        const createBar = (srs: BarChartSeriesOptions<TData>) => (item: TData) => {
            const { id, value, state } = getBarState(srs, item);
            const restFill = setColorAlpha(state.fill as string, REST_ALPHA);

            const bar = createRect({
                id,
                ...state,
                ...collapsedEntry(srs, item),
                fill: restFill,
                data: {
                    ...state,
                    fill: restFill,
                },
            });

            this._attachBarHover(bar, srs, getKey(item), value, anchorFor(state));

            return bar;
        };

        // Builds the value label for a bar, positioned at the bar's outer-edge anchor.
        const createBarLabel = (srs: BarChartSeriesOptions<TData>) => (item: TData) => {
            const { id, value, state } = getBarState(srs, item);
            const point = anchorFor(state)();

            return createDataLabel({
                id: `${id}-label`,
                x: point.x,
                y: point.y,
                anchor: dataLabels.anchor,
                content: formatValue(value),
                font: dataLabels.font,
                fill: dataLabels.fontColor,
            });
        };

        // Repositions/refreshes an existing label for an updated bar (data drives the transition).
        const updateBarLabel = (srs: BarChartSeriesOptions<TData>, item: TData, label: Text) => {
            const { value, state } = getBarState(srs, item);
            const point = anchorFor(state)();
            const layout = resolveDataLabelLayout({
                x: point.x,
                y: point.y,
                anchor: dataLabels.anchor,
            });

            label.content = formatValue(value);
            label.data = {
                x: layout.x,
                y: layout.y,
                opacity: 1,
            } as Partial<TextState>;
        };

        const {
            left: seriesEntries,
            inner: seriesUpdates,
            right: seriesExits,
        } = arrayJoin(series, this._barGroups, 'id');

        // Exit removed series.
        const exitAnimation = this.resolveAnimation(ANIMATION_REFERENCE.exit);

        seriesExits.forEach(group => {
            const exits = (group.getElementsByType('rect') as Rect[]).map(bar => exitElement(this.renderer, bar, exitAnimation, {
                ...collapsed(),
                opacity: 0,
            }));

            void Promise.all(exits).then(() => group.destroy());
        });

        const seriesEntryGroups = seriesEntries.map(srs => createGroup({
            id: srs.id,
            children: [
                ...data.map(createBar(srs)),
                ...(dataLabels.visible ? data.map(createBarLabel(srs)) : []),
            ],
        }));

        // Labels added/repositioned during the update pass, animated after the maps below.
        const enteringLabels: Text[] = [];
        const updatingLabels: Text[] = [];

        const seriesUpdateGroups = seriesUpdates.map(([srs, group]) => {
            const bars = group.getElementsByType('rect') as Rect[];

            const {
                left: barEntries,
                inner: barUpdates,
                right: barExits,
            } = arrayJoin(data, bars, (item, bar) => bar.id === `${srs.id}-${getKey(item)}`);

            barExits.forEach(bar => exitElement(this.renderer, bar, exitAnimation, {
                ...collapsed(),
                opacity: 0,
            }));

            barEntries.forEach(item => group.add(createBar(srs)(item)));

            barUpdates.forEach(([item, bar]) => {
                const { value, state } = getBarState(srs, item);
                const restFill = setColorAlpha(state.fill as string, REST_ALPHA);

                bar.data = {
                    ...state,
                    fill: restFill,
                };

                this._attachBarHover(bar, srs, getKey(item), value, anchorFor(state));
            });

            // Reconcile value labels alongside the bars.
            const labels = group.getElementsByType('text') as Text[];

            if (dataLabels.visible) {
                const {
                    left: labelEntries,
                    inner: labelUpdates,
                    right: labelExits,
                } = arrayJoin(data, labels, (item, label) => label.id === `${srs.id}-${getKey(item)}-label`);

                labelExits.forEach(label => exitElement(this.renderer, label, exitAnimation, { opacity: 0 }));

                labelEntries.forEach(item => {
                    const label = createBarLabel(srs)(item);
                    group.add(label);
                    enteringLabels.push(label);
                });

                labelUpdates.forEach(([item, label]) => {
                    updateBarLabel(srs, item, label);
                    updatingLabels.push(label);
                });
            } else {
                labels.forEach(label => exitElement(this.renderer, label, exitAnimation, { opacity: 0 }));
            }

            return group;
        });

        this.scene.add(seriesEntryGroups);

        this._barGroups = [
            ...seriesEntryGroups,
            ...seriesUpdateGroups,
        ];

        // Series groups map 1:1 to legend items (by id); register them for legend hover-highlight.
        this.registerHighlightGroups(this._barGroups);

        const enterAnimation = this.resolveAnimation(ANIMATION_REFERENCE.enter);
        const updateAnimation = this.resolveAnimation(ANIMATION_REFERENCE.update);

        const barEntries = (queryAll(seriesEntryGroups, 'rect') as Rect[])
            .sort((a, b) => (horizontal ? a.y - b.y : a.x - b.x));

        const categoryCount = Math.max(1, keyIndex.size);

        const entriesTransition = this.renderer.transition(barEntries, (element, index, length) => {
            // Stacked: each column fills as one rising unit — segments are timed by their position
            // in the stack so the fill front sweeps the whole column once, in colour order.
            if (this._isStacked) {
                const timing = entryTiming.get(element.id);
                const columnDelay = stagger(timing?.columnIndex ?? 0, categoryCount, enterAnimation.duration) * 0.4;

                return {
                    duration: Math.max((timing?.durationFraction ?? 1) * enterAnimation.duration, 80),
                    delay: columnDelay + (timing?.delayFraction ?? 0) * enterAnimation.duration,
                    ease: enterAnimation.ease,
                    state: element.data as RectState,
                };
            }

            return {
                duration: enterAnimation.duration,
                delay: stagger(index, length, enterAnimation.duration),
                ease: enterAnimation.ease,
                state: element.data as RectState,
            };
        });

        const updatesTransition = this.renderer.transition(queryAll(seriesUpdateGroups, 'rect') as Rect[], element => ({
            duration: updateAnimation.duration,
            ease: updateAnimation.ease,
            state: element.data as RectState,
        }));

        // Value labels: entry labels (on new series and new bars) fade in; updated labels
        // animate to their refreshed position.
        const entryLabels = queryAll(seriesEntryGroups, 'text') as Text[];

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
            entriesTransition,
            updatesTransition,
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

            const seriesExtents = series.flatMap(srs => getExtent(data, item => this._seriesValue(srs, item))).concat(0);
            let dataExtent = getExtent(seriesExtents, functionIdentity);

            if (this._isStacked) {
                let stackedMax = 0;
                let stackedMin = 0;

                data.forEach(item => {
                    let positiveTotal = 0;
                    let negativeTotal = 0;

                    series.forEach(srs => {
                        const value = this._seriesValue(srs, item);

                        if (value >= 0) {
                            positiveTotal += value;
                        } else {
                            negativeTotal += value;
                        }
                    });

                    stackedMax = Math.max(stackedMax, positiveTotal);
                    stackedMin = Math.min(stackedMin, negativeTotal);
                });

                dataExtent = [stackedMin, stackedMax];
            }

            // Shared layout pass: title and legend reserve their bands first.
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

            if (this._isHorizontal) {
                // Categories on Y, values on X.
                const valueScale = scaleContinuous(dataExtent, [left, right], { padToTicks: 10 });

                this.xAxis.scale = valueScale;
                this.xAxis.bounds = new Box(top, left, bottom, right);

                const xAxisBox = this.xAxis.getBoundingBox();

                const categoryScale = scaleBand(keys, [top, xAxisBox.top], {
                    outerPadding: 0.15,
                    innerPadding: 0.2,
                });

                this.yAxis.scale = this._bandAxisScale(categoryScale, keys);
                this.yAxis.bounds = new Box(top, left, xAxisBox.top, right);

                const yAxisBox = this.yAxis.getBoundingBox();

                const adjustedValueScale = scaleContinuous(dataExtent, [yAxisBox.right, right], { padToTicks: 10 });
                this.xAxis.scale = adjustedValueScale;
                this.xAxis.bounds = new Box(top, yAxisBox.right, bottom, right);

                this.renderGrid(
                    adjustedValueScale.ticks(10).map(tick => adjustedValueScale(tick)),
                    [],
                    {
                        x: yAxisBox.right,
                        y: top,
                        width: right - yAxisBox.right,
                        height: xAxisBox.top - top,
                    }
                );

                return Promise.all([
                    this.xAxis.visible ? this.xAxis.render() : Promise.resolve(),
                    this.yAxis.visible ? this.yAxis.render() : Promise.resolve(),
                    this._drawBars(categoryScale, adjustedValueScale, getKey),
                ]);
            }

            // Categories on X, values on Y.
            const valueScale = scaleContinuous(dataExtent, [bottom, top], { padToTicks: 10 });

            this.yAxis.scale = valueScale;
            this.yAxis.bounds = new Box(top, left, bottom, right);

            const yAxisBox = this.yAxis.getBoundingBox();

            const categoryScale = scaleBand(keys, [yAxisBox.right, right], {
                outerPadding: 0.15,
                innerPadding: 0.2,
            });

            this.xAxis.scale = this._bandAxisScale(categoryScale, keys);
            this.xAxis.bounds = new Box(top, yAxisBox.right, bottom, right);

            const xAxisBox = this.xAxis.getBoundingBox();

            const adjustedValueScale = scaleContinuous(dataExtent, [xAxisBox.top, top], { padToTicks: 10 });
            this.yAxis.scale = adjustedValueScale;
            this.yAxis.bounds = new Box(top, left, xAxisBox.top, right);

            this.renderGrid(
                [],
                adjustedValueScale.ticks(10).map(tick => adjustedValueScale(tick)),
                {
                    x: yAxisBox.right,
                    y: top,
                    width: right - yAxisBox.right,
                    height: xAxisBox.top - top,
                }
            );

            return Promise.all([
                this.xAxis.visible ? this.xAxis.render() : Promise.resolve(),
                this.yAxis.visible ? this.yAxis.render() : Promise.resolve(),
                this._drawBars(categoryScale, adjustedValueScale, getKey),
            ]);
        });
    }

    /** Wraps a band scale so an axis renders one centred tick per category. */
    private _bandAxisScale(categoryScale: BandScale<string>, keys: string[]) {
        return Object.assign(
            (value: string) => categoryScale(value) + categoryScale.bandwidth / 2,
            {
                domain: keys,
                range: categoryScale.range,
                inverse: categoryScale.inverse,
                ticks: () => keys,
                includes: (v: string) => keys.includes(v),
            }
        ) as unknown as typeof this.xAxis.scale;
    }

}

/** Factory function that creates a new {@link BarChart} instance. */
export function createBarChart<TData = unknown>(target: string | HTMLElement | Context, options: BarChartOptions<TData>) {
    return new BarChart<TData>(target, options);
}
