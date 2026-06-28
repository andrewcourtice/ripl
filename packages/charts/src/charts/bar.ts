import {
    CartesianChart,
    CartesianChartOptions,
} from '../core/cartesian';

import type {
    ChartAxisInput,
    ChartGridInput,
    ChartLegendInput,
    ChartTooltipInput,
} from '../core/options';

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

import {
    LegendItem,
} from '../components/legend';

import {
    BandScale,
    Box,
    Context,
    createGroup,
    createRect,
    getExtent,
    Group,
    max,
    queryAll,
    Rect,
    RectState,
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
    value: keyof TData | number | ((item: TData) => number);
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
}

/**
 * Bar chart supporting vertical/horizontal orientation and grouped/stacked modes.
 *
 * Uses band scales for categorical axes and continuous scales for value axes. Supports multiple
 * series with grouped or stacked bar rendering, interactive tooltips, legend, grid, chart title,
 * and animated entry/update/exit transitions.
 *
 * @typeParam TData - The type of each data item in the dataset.
 */
export class BarChart<TData = unknown> extends CartesianChart<BarChartOptions<TData>, TData> {

    private barGroups: Group[] = [];

    constructor(target: string | HTMLElement | Context, options: BarChartOptions<TData>) {
        super(target, options);

        this.setupCartesian({
            grid: {
                horizontal: !this.isHorizontal,
                vertical: this.isHorizontal,
            },
        });

        this.init();
    }

    private get isHorizontal() {
        return this.options.orientation === 'horizontal';
    }

    private get isStacked() {
        return this.options.mode === 'stacked';
    }

    private seriesValue(series: BarChartSeriesOptions<TData>, item: TData): number {
        return resolveAccessor<TData, number>(series.value)(item);
    }

    private stackOffset(series: BarChartSeriesOptions<TData>[], current: BarChartSeriesOptions<TData>, item: TData): number {
        if (!this.isStacked) {
            return 0;
        }

        return computeStackOffset(series, current, item, (s, i) => this.seriesValue(s, i));
    }

    /** Wires consistent hover highlight + tooltip onto a bar. */
    private attachBarHover(bar: Rect, label: string, value: number, anchor: () => { x: number;
        y: number; }) {
        if (!this.tooltip) {
            return;
        }

        const restFill = bar.fill as string;
        const hover = this.resolveAnimation(ANIMATION_REFERENCE.hover);

        applyHoverHighlight(bar, {
            renderer: this.renderer,
            duration: hover.duration,
            ease: hover.ease,
            tooltip: this.tooltip,
            anchor,
            content: () => `${label}: ${value}`,
            highlight: { fill: setColorAlpha(restFill, 1) },
            restore: { fill: restFill },
        });
    }

    private async drawBars(
        categoryScale: BandScale<string>,
        valueScale: ReturnType<typeof scaleContinuous>,
        getKey: (item: TData) => string
    ) {
        const { data, series } = this.options;
        const horizontal = this.isHorizontal;
        const baseline = valueScale(0);
        const borderRadius = this.options.borderRadius ?? 2;

        let seriesScale: BandScale<string> | undefined;

        if (!this.isStacked) {
            seriesScale = scaleBand(series.map(s => s.id), [0, categoryScale.bandwidth], {
                innerPadding: 0.1,
            });
        }

        const getBarState = (srs: BarChartSeriesOptions<TData>, item: TData) => {
            const value = this.seriesValue(srs, item);
            const key = getKey(item);
            const color = this.getSeriesColor(srs.id);
            const stackOffset = this.stackOffset(series, srs, item);

            let x: number;
            let y: number;
            let width: number;
            let height: number;

            if (horizontal) {
                if (this.isStacked) {
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
            } else if (this.isStacked) {
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

        // The collapsed initial geometry an entering bar grows from.
        const collapsed = (): Partial<RectState> => (horizontal
            ? {
                x: baseline,
                width: 0,
            }
            : {
                y: baseline,
                height: 0,
            });

        const createBar = (srs: BarChartSeriesOptions<TData>) => (item: TData) => {
            const { id, value, state } = getBarState(srs, item);
            const restFill = setColorAlpha(state.fill as string, REST_ALPHA);

            const bar = createRect({
                id,
                ...state,
                ...collapsed(),
                fill: restFill,
                data: {
                    ...state,
                    fill: restFill,
                },
            });

            this.attachBarHover(bar, srs.label, value, anchorFor(state));

            return bar;
        };

        const {
            left: seriesEntries,
            inner: seriesUpdates,
            right: seriesExits,
        } = arrayJoin(series, this.barGroups, 'id');

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
            children: data.map(createBar(srs)),
        }));

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

                this.attachBarHover(bar, srs.label, value, anchorFor(state));
            });

            return group;
        });

        this.scene.add(seriesEntryGroups);

        this.barGroups = [
            ...seriesEntryGroups,
            ...seriesUpdateGroups,
        ];

        const enterAnimation = this.resolveAnimation(ANIMATION_REFERENCE.enter);
        const updateAnimation = this.resolveAnimation(ANIMATION_REFERENCE.update);

        const barEntries = (queryAll(seriesEntryGroups, 'rect') as Rect[])
            .sort((a, b) => (horizontal ? a.y - b.y : a.x - b.x));

        const entriesTransition = this.renderer.transition(barEntries, (element, index, length) => ({
            duration: enterAnimation.duration,
            delay: stagger(index, length, enterAnimation.duration),
            ease: enterAnimation.ease,
            state: element.data as RectState,
        }));

        const updatesTransition = this.renderer.transition(queryAll(seriesUpdateGroups, 'rect') as Rect[], element => ({
            duration: updateAnimation.duration,
            ease: updateAnimation.ease,
            state: element.data as RectState,
        }));

        return Promise.all([
            entriesTransition,
            updatesTransition,
        ]);
    }

    public async render() {
        return super.render(async () => {
            const { data, series, key } = this.options;

            this.resolveSeriesColors(series);
            this.prepareAxes();

            const getKey = resolveAccessor<TData, string>(key);
            const keys = data.map(getKey);

            const seriesExtents = series.flatMap(srs => getExtent(data, item => this.seriesValue(srs, item))).concat(0);
            let dataExtent = getExtent(seriesExtents, functionIdentity);

            if (this.isStacked) {
                let stackedMax = 0;
                let stackedMin = 0;

                data.forEach(item => {
                    let positiveTotal = 0;
                    let negativeTotal = 0;

                    series.forEach(srs => {
                        const value = this.seriesValue(srs, item);

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

            if (this.isHorizontal) {
                // Categories on Y, values on X.
                const valueScale = scaleContinuous(dataExtent, [left, right], { padToTicks: 10 });

                this.xAxis.scale = valueScale;
                this.xAxis.bounds = new Box(top, left, bottom, right);

                const xAxisBox = this.xAxis.getBoundingBox();

                const categoryScale = scaleBand(keys, [top, xAxisBox.top], {
                    outerPadding: 0.15,
                    innerPadding: 0.2,
                });

                this.yAxis.scale = this.bandAxisScale(categoryScale, keys);
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
                    this.drawBars(categoryScale, adjustedValueScale, getKey),
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

            this.xAxis.scale = this.bandAxisScale(categoryScale, keys);
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
                this.drawBars(categoryScale, adjustedValueScale, getKey),
            ]);
        });
    }

    /** Wraps a band scale so an axis renders one centred tick per category. */
    private bandAxisScale(categoryScale: BandScale<string>, keys: string[]) {
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
