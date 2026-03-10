import {
    BaseChartOptions,
    Chart,
} from '../core/chart';

import type {
    ChartAxisInput,
    ChartGridInput,
    ChartLegendInput,
    ChartTooltipInput,
} from '../core/options';

import {
    normalizeAxis,
    normalizeAxisItem,
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
    Legend,
    LegendItem,
} from '../components/legend';

import {
    Grid,
} from '../components/grid';

import {
    BandScale,
    Box,
    Context,
    createGroup,
    createRect,
    easeOutCubic,
    easeOutQuart,
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
    typeIsFunction,
} from '@ripl/utilities';

export type BarChartOrientation = 'vertical' | 'horizontal';
export type BarChartMode = 'grouped' | 'stacked';

/** Configuration for an individual bar chart series. */
export interface BarChartSeriesOptions<TData> {
    id: string;
    color?: string;
    value: keyof TData | number | ((item: TData) => number);
    label: string;
}

/** Options for configuring a {@link BarChart}. */
export interface BarChartOptions<TData = unknown> extends BaseChartOptions {
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
 * Uses band scales for categorical axes and continuous scales for value axes.
 * Supports multiple series with grouped or stacked bar rendering, interactive
 * tooltips, legend, grid, and animated entry/update/exit transitions.
 *
 * @typeParam TData - The type of each data item in the dataset.
 */
export class BarChart<TData = unknown> extends Chart<BarChartOptions<TData>> {

    private barGroups: Group[] = [];
    private xAxis!: ChartXAxis;
    private yAxis!: ChartYAxis;
    private tooltip!: Tooltip;
    private legend?: Legend;
    private grid?: Grid;

    constructor(target: string | HTMLElement | Context, options: BarChartOptions<TData>) {
        super(target, options);

        const axisOpts = normalizeAxis(options.axis);
        const xAxis = normalizeAxisItem(axisOpts.x);
        const yAxis = normalizeYAxisItem(
            Array.isArray(axisOpts.y) ? axisOpts.y[0] : axisOpts.y
        );
        const gridOpts = normalizeGrid(options.grid);
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
                horizontal: true,
                vertical: false,
                stroke: gridOpts.lineColor,
                lineWidth: gridOpts.lineWidth,
                lineDash: gridOpts.lineDash,
            });
        }

        this.init();
    }

    private get isHorizontal() {
        return this.options.orientation === 'horizontal';
    }

    private get isStacked() {
        return this.options.mode === 'stacked';
    }


    private async drawBarsVertical(
        categoryScale: BandScale<string>,
        valueScale: ReturnType<typeof scaleContinuous>,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getKey: (item: any) => string
    ) {
        const {
            data,
            series,
        } = this.options;

        const baseline = valueScale(0);
        const borderRadius = this.options.borderRadius ?? 2;

        const {
            left: seriesEntries,
            inner: seriesUpdates,
            right: seriesExits,
        } = arrayJoin(series, this.barGroups, 'id');

        seriesExits.forEach(el => el.destroy());

        let seriesScale: BandScale<string> | undefined;

        if (!this.isStacked) {
            seriesScale = scaleBand(series.map(s => s.id), [0, categoryScale.bandwidth], {
                innerPadding: 0.1,
            });
        }

        const getBarState = (srs: BarChartSeriesOptions<TData>, item: TData, stackOffset = 0) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getValue = typeIsFunction(srs.value) ? srs.value : (i: any) => i[srs.value] as number;
            const value = getValue(item);
            const key = getKey(item);
            const color = this.getSeriesColor(srs.id);

            let x: number;
            let width: number;
            let y: number;
            let height: number;

            if (this.isStacked) {
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

        // Compute stack offsets per category
        const getStackOffset = (srs: BarChartSeriesOptions<TData>, item: TData): number => {
            if (!this.isStacked) return 0;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getSrsValue = typeIsFunction(srs.value) ? srs.value : (i: any) => i[srs.value] as number;
            const currentValue = getSrsValue(item);
            const seriesIndex = series.indexOf(srs);

            return series.slice(0, seriesIndex).reduce((sum, prev) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const getValue = typeIsFunction(prev.value) ? prev.value : (i: any) => i[prev.value] as number;
                const prevValue = getValue(item);

                if (currentValue >= 0 && prevValue >= 0) return sum + prevValue;
                if (currentValue < 0 && prevValue < 0) return sum + prevValue;
                return sum;
            }, 0);
        };

        const seriesEntryGroups = seriesEntries.map(srs => {
            const children = data.map(item => {
                const stackOffset = getStackOffset(srs, item);
                const { id, value, state } = getBarState(srs, item, stackOffset);

                const bar = createRect({
                    id,
                    ...state,
                    fill: setColorAlpha(state.fill as string, 0.7),
                    y: baseline,
                    height: 0,
                    data: {
                        ...state,
                        fill: setColorAlpha(state.fill as string, 0.7),
                    },
                });

                bar.on('mouseenter', () => {
                    this.tooltip.show(state.x + state.width / 2, state.y, `${srs.label}: ${value}`);

                    this.renderer.transition(bar, {
                        duration: this.getAnimationDuration(300),
                        ease: easeOutQuart,
                        state: {
                            fill: state.fill,
                        },
                    });

                    bar.on('mouseleave', () => {
                        this.tooltip.hide();

                        this.renderer.transition(bar, {
                            duration: this.getAnimationDuration(300),
                            ease: easeOutQuart,
                            state: {
                                fill: setColorAlpha(state.fill as string, 0.7),
                            },
                        });
                    });
                });

                return bar;
            });

            return createGroup({
                id: srs.id,
                children,
            });
        });

        const seriesUpdateGroups = seriesUpdates.map(([srs, group]) => {
            const bars = group.getElementsByType('rect') as Rect[];

            const {
                left: barEntries,
                inner: barUpdates,
                right: barExits,
            } = arrayJoin(data, bars, (item, bar) => bar.id === `${srs.id}-${getKey(item)}`);

            barExits.forEach(el => el.destroy());

            barEntries.map(item => {
                const stackOffset = getStackOffset(srs, item);
                const { id, state } = getBarState(srs, item, stackOffset);

                const rect = createRect({
                    id,
                    ...state,
                    y: baseline,
                    height: 0,
                    data: {
                        ...state,
                        fill: setColorAlpha(state.fill as string, 0.7),
                    },
                });

                group.add(rect);
            });

            barUpdates.forEach(([item, bar]) => {
                const stackOffset = getStackOffset(srs, item);
                const { value, state } = getBarState(srs, item, stackOffset);

                bar.data = {
                    ...state,
                    fill: setColorAlpha(state.fill as string, 0.7),
                };

                bar.on('mouseenter', () => {
                    this.tooltip.show(state.x + state.width / 2, state.y, `${srs.label}: ${value}`);

                    this.renderer.transition(bar, {
                        duration: this.getAnimationDuration(300),
                        ease: easeOutQuart,
                        state: {
                            fill: state.fill,
                        },
                    });

                    bar.on('mouseleave', () => {
                        this.tooltip.hide();

                        this.renderer.transition(bar, {
                            duration: this.getAnimationDuration(300),
                            ease: easeOutQuart,
                            state: {
                                fill: setColorAlpha(state.fill as string, 0.7),
                            },
                        });
                    });
                });
            });

            return group;
        });

        this.scene.add(seriesEntryGroups);

        this.barGroups = [
            ...seriesEntryGroups,
            ...seriesUpdateGroups,
        ];

        const barEntries = (queryAll(seriesEntryGroups, 'rect') as Rect[]).sort((a, b) => a.x - b.x);

        const entriesTransition = this.renderer.transition(barEntries, (element, index, length) => ({
            duration: this.getAnimationDuration(1000),
            delay: index * (this.getAnimationDuration(1000) / length),
            ease: easeOutCubic,
            state: element.data as RectState,
        }));

        const updatesTransition = this.renderer.transition(queryAll(seriesUpdateGroups, 'rect') as Rect[], element => ({
            duration: this.getAnimationDuration(1000),
            ease: easeOutCubic,
            state: element.data as RectState,
        }));

        return Promise.all([
            entriesTransition,
            updatesTransition,
        ]);
    }

    private async drawBarsHorizontal(
        categoryScale: BandScale<string>,
        valueScale: ReturnType<typeof scaleContinuous>,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getKey: (item: any) => string
    ) {
        const {
            data,
            series,
        } = this.options;

        const baseline = valueScale(0);
        const borderRadius = this.options.borderRadius ?? 2;

        const {
            left: seriesEntries,
            inner: seriesUpdates,
            right: seriesExits,
        } = arrayJoin(series, this.barGroups, 'id');

        seriesExits.forEach(el => el.destroy());

        let seriesScale: BandScale<string> | undefined;

        if (!this.isStacked) {
            seriesScale = scaleBand(series.map(s => s.id), [0, categoryScale.bandwidth], {
                innerPadding: 0.1,
            });
        }

        const getBarState = (srs: BarChartSeriesOptions<TData>, item: TData, stackOffset = 0) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getValue = typeIsFunction(srs.value) ? srs.value : (i: any) => i[srs.value] as number;
            const value = getValue(item);
            const key = getKey(item);
            const color = this.getSeriesColor(srs.id);

            let x: number;
            let y: number;
            let width: number;
            let height: number;

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

        const getStackOffset = (srs: BarChartSeriesOptions<TData>, item: TData): number => {
            if (!this.isStacked) return 0;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getSrsValue = typeIsFunction(srs.value) ? srs.value : (i: any) => i[srs.value] as number;
            const currentValue = getSrsValue(item);
            const seriesIndex = series.indexOf(srs);

            return series.slice(0, seriesIndex).reduce((sum, prev) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const getValue = typeIsFunction(prev.value) ? prev.value : (i: any) => i[prev.value] as number;
                const prevValue = getValue(item);

                if (currentValue >= 0 && prevValue >= 0) return sum + prevValue;
                if (currentValue < 0 && prevValue < 0) return sum + prevValue;
                return sum;
            }, 0);
        };

        const seriesEntryGroups = seriesEntries.map(srs => {
            const children = data.map(item => {
                const stackOffset = getStackOffset(srs, item);
                const { id, value, state } = getBarState(srs, item, stackOffset);

                const bar = createRect({
                    id,
                    ...state,
                    fill: setColorAlpha(state.fill as string, 0.7),
                    x: baseline,
                    width: 0,
                    data: {
                        ...state,
                        fill: setColorAlpha(state.fill as string, 0.7),
                    },
                });

                bar.on('mouseenter', () => {
                    this.tooltip.show(state.x + state.width, state.y + state.height / 2, `${srs.label}: ${value}`);

                    this.renderer.transition(bar, {
                        duration: this.getAnimationDuration(300),
                        ease: easeOutQuart,
                        state: {
                            fill: state.fill,
                        },
                    });

                    bar.on('mouseleave', () => {
                        this.tooltip.hide();

                        this.renderer.transition(bar, {
                            duration: this.getAnimationDuration(300),
                            ease: easeOutQuart,
                            state: {
                                fill: setColorAlpha(state.fill as string, 0.7),
                            },
                        });
                    });
                });

                return bar;
            });

            return createGroup({
                id: srs.id,
                children,
            });
        });

        const seriesUpdateGroups = seriesUpdates.map(([srs, group]) => {
            const bars = group.getElementsByType('rect') as Rect[];

            const {
                left: barEntries,
                inner: barUpdates,
                right: barExits,
            } = arrayJoin(data, bars, (item, bar) => bar.id === `${srs.id}-${getKey(item)}`);

            barExits.forEach(el => el.destroy());

            barEntries.map(item => {
                const stackOffset = getStackOffset(srs, item);
                const { id, state } = getBarState(srs, item, stackOffset);

                const rect = createRect({
                    id,
                    ...state,
                    x: baseline,
                    width: 0,
                    data: {
                        ...state,
                        fill: setColorAlpha(state.fill as string, 0.7),
                    },
                });

                group.add(rect);
            });

            barUpdates.forEach(([item, bar]) => {
                const stackOffset = getStackOffset(srs, item);
                const { value, state } = getBarState(srs, item, stackOffset);

                bar.data = {
                    ...state,
                    fill: setColorAlpha(state.fill as string, 0.7),
                };

                bar.on('mouseenter', () => {
                    this.tooltip.show(state.x + state.width, state.y + state.height / 2, `${srs.label}: ${value}`);

                    this.renderer.transition(bar, {
                        duration: this.getAnimationDuration(300),
                        ease: easeOutQuart,
                        state: {
                            fill: state.fill,
                        },
                    });

                    bar.on('mouseleave', () => {
                        this.tooltip.hide();

                        this.renderer.transition(bar, {
                            duration: this.getAnimationDuration(300),
                            ease: easeOutQuart,
                            state: {
                                fill: setColorAlpha(state.fill as string, 0.7),
                            },
                        });
                    });
                });
            });

            return group;
        });

        this.scene.add(seriesEntryGroups);

        this.barGroups = [
            ...seriesEntryGroups,
            ...seriesUpdateGroups,
        ];

        const barEntries = (queryAll(seriesEntryGroups, 'rect') as Rect[]).sort((a, b) => a.y - b.y);

        const entriesTransition = this.renderer.transition(barEntries, (element, index, length) => ({
            duration: this.getAnimationDuration(1000),
            delay: index * (this.getAnimationDuration(1000) / length),
            ease: easeOutCubic,
            state: element.data as RectState,
        }));

        const updatesTransition = this.renderer.transition(queryAll(seriesUpdateGroups, 'rect') as Rect[], element => ({
            duration: this.getAnimationDuration(1000),
            ease: easeOutCubic,
            state: element.data as RectState,
        }));

        return Promise.all([
            entriesTransition,
            updatesTransition,
        ]);
    }

    public async render() {
        return super.render(async (scene) => {
            const {
                data,
                series,
                key,
            } = this.options;

            this.resolveSeriesColors(series);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getKey = typeIsFunction(key) ? key : (item: any) => item[key] as string;
            const keys = data.map(getKey);

            const seriesExtents = series.flatMap(({ value: valueAccessor }) => {
                const getValue = typeIsFunction(valueAccessor)
                    ? valueAccessor
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    : (item: any) => item[valueAccessor] as number;

                return getExtent(data, getValue);
            }).concat(0);

            let dataExtent = getExtent(seriesExtents, functionIdentity);

            // For stacked mode, compute stacked extents
            if (this.isStacked) {
                let stackedMax = 0;
                let stackedMin = 0;

                data.forEach(item => {
                    let positiveTotal = 0;
                    let negativeTotal = 0;

                    series.forEach(srs => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const getValue = typeIsFunction(srs.value) ? srs.value : (i: any) => i[srs.value] as number;
                        const value = getValue(item);

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

            const padding = this.getPadding();

            // Compute legend bounds early to reserve space
            let legendHeight = 0;

            if (normalizeLegend(this.options.legend).visible && series.length > 1) {
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

            const chartTop = padding.top + 20 + legendHeight;

            if (this.isHorizontal) {
                // Horizontal: categories on Y, values on X
                const categoryScale = scaleBand(keys, [chartTop, scene.height - padding.bottom], {
                    outerPadding: 0.15,
                    innerPadding: 0.2,
                });

                const valueScale = scaleContinuous(dataExtent, [padding.left + 60, scene.width - padding.right], {
                    padToTicks: 10,
                });

                // Y axis shows categories
                this.yAxis.scale = Object.assign(
                    (value: string) => categoryScale(value) + categoryScale.bandwidth / 2,
                    {
                        domain: keys,
                        range: categoryScale.range,
                        inverse: categoryScale.inverse,
                        ticks: () => keys,
                        includes: (v: string) => keys.includes(v),
                    }
                ) as unknown as typeof this.yAxis.scale;

                this.yAxis.bounds = new Box(
                    chartTop,
                    padding.left,
                    scene.height - padding.bottom,
                    scene.width - padding.right
                );

                // X axis shows values
                this.xAxis.scale = valueScale;
                this.xAxis.bounds = new Box(
                    chartTop,
                    padding.left + 60,
                    scene.height - padding.bottom,
                    scene.width - padding.right
                );

                if (this.grid) {
                    const xTicks = valueScale.ticks(10);
                    const xTickPositions = xTicks.map(tick => valueScale(tick));

                    this.grid.render(
                        xTickPositions,
                        [],
                        padding.left + 60,
                        chartTop,
                        scene.width - padding.right - padding.left - 60,
                        scene.height - padding.bottom - chartTop
                    );
                }

                // Render legend
                if (this.legend && legendHeight > 0) {
                    this.renderLegend(padding.left + 60, 0, scene.width - padding.left - 60 - padding.right);
                }

                return Promise.all([
                    this.xAxis.render(),
                    this.yAxis.render(),
                    this.drawBarsHorizontal(categoryScale, valueScale, getKey),
                ]);
            } else {
                // Vertical: categories on X, values on Y
                const valueScale = scaleContinuous(dataExtent, [scene.height - padding.bottom, chartTop], {
                    padToTicks: 10,
                });

                this.yAxis.scale = valueScale;
                this.yAxis.bounds = new Box(
                    chartTop,
                    padding.left,
                    scene.height - padding.bottom,
                    scene.width - padding.right
                );

                const yAxisBoundingBox = this.yAxis.getBoundingBox();

                const categoryScale = scaleBand(keys, [yAxisBoundingBox.right, scene.width - padding.right], {
                    outerPadding: 0.15,
                    innerPadding: 0.2,
                });

                // X axis shows categories
                this.xAxis.scale = Object.assign(
                    (value: string) => categoryScale(value) + categoryScale.bandwidth / 2,
                    {
                        domain: keys,
                        range: categoryScale.range,
                        inverse: categoryScale.inverse,
                        ticks: () => keys,
                        includes: (v: string) => keys.includes(v),
                    }
                ) as unknown as typeof this.xAxis.scale;

                this.xAxis.bounds = new Box(
                    chartTop,
                    yAxisBoundingBox.right,
                    scene.height - padding.bottom,
                    scene.width - padding.right
                );

                const xAxisBoundingBox = this.xAxis.getBoundingBox();

                // Recalculate value scale with correct bounds
                const adjustedValueScale = scaleContinuous(dataExtent, [xAxisBoundingBox.top, chartTop], {
                    padToTicks: 10,
                });

                this.yAxis.scale = adjustedValueScale;
                this.yAxis.bounds.bottom = xAxisBoundingBox.top;

                if (this.grid) {
                    const yTicks = adjustedValueScale.ticks(10);
                    const yTickPositions = yTicks.map(tick => adjustedValueScale(tick));

                    this.grid.render(
                        [],
                        yTickPositions,
                        yAxisBoundingBox.right,
                        chartTop,
                        scene.width - padding.right - yAxisBoundingBox.right,
                        xAxisBoundingBox.top - chartTop
                    );
                }

                // Render legend
                if (this.legend && legendHeight > 0) {
                    this.renderLegend(yAxisBoundingBox.right, 0, scene.width - yAxisBoundingBox.right - padding.right);
                }

                return Promise.all([
                    this.xAxis.render(),
                    this.yAxis.render(),
                    this.drawBarsVertical(categoryScale, adjustedValueScale, getKey),
                ]);
            }
        });
    }

    private renderLegend(x: number, y: number, width: number) {
        if (this.legend) {
            this.legend.render(x, y, width);
        }
    }

}

/** Factory function that creates a new {@link BarChart} instance. */
export function createBarChart<TData = unknown>(target: string | HTMLElement | Context, options: BarChartOptions<TData>) {
    return new BarChart<TData>(target, options);
}
