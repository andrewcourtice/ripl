import type {
    NumericAccessor,
} from '../core/data';

import type {
    BaseChartOptions,
} from '../core/chart';

import {
    Chart,
} from '../core/chart';

import type {
    ChartAxisInput,
    ChartTooltipInput,
} from '../core/options';

import {
    formatNumber,
    normalizeAxis,
    normalizeAxisItem,
    normalizeTooltip,
    normalizeYAxisItem,
    resolveFormatLabel,
} from '../core/options';

import {
    applyHoverHighlight,
} from '../core/interaction';

import {
    ANIMATION_REFERENCE,
} from '../core/animation';

import {
    ChartXAxis,
    ChartYAxis,
} from '../components/axis';

import {
    Tooltip,
} from '../components/tooltip';

import type {
    Context,
    EventMap,
    Group,
    Rect,
    RectState,
} from '@ripl/core';

import {
    Box,
    createGroup,
    createRect,
    easeOutCubic,
    scaleBand,
    scaleContinuous,
    scaleSequential,
} from '@ripl/core';

import {
    arrayJoin,
    typeIsFunction,
} from '@ripl/utilities';

/** Options for configuring a {@link HeatmapChart}. */
export interface HeatmapChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    xBy: keyof TData | ((item: TData) => string);
    yBy: keyof TData | ((item: TData) => string);
    value: NumericAccessor<TData>;
    xCategories: string[];
    yCategories: string[];
    colorRange?: string[];
    borderRadius?: number;
    tooltip?: ChartTooltipInput;
    axis?: ChartAxisInput<TData>;
}

/** Payload emitted for heatmap cell interaction events. */
export interface HeatmapChartCellEvent {
    x: number;
    y: number;
    value: number;
    xLabel: string;
    yLabel: string;
}

/** Events emitted by a {@link HeatmapChart} that consumers can subscribe to via `chart.on(...)`. */
export interface HeatmapChartEventMap extends EventMap {
    cellclick: HeatmapChartCellEvent;
    cellenter: HeatmapChartCellEvent;
    cellleave: HeatmapChartCellEvent;
}

const DEFAULT_COLOR_RANGE = ['#e0f2fe', '#0369a1'];

/**
 * Heatmap chart rendering a grid of colored cells on two categorical axes.
 *
 * Cell color is interpolated between a configurable low/high color range
 * based on each data point's value. Supports x/y axes, tooltips, and
 * animated fade-in entry transitions with smooth color updates.
 *
 * @typeParam TData - The type of each data item in the dataset.
 */
export class HeatmapChart<TData = unknown> extends Chart<HeatmapChartOptions<TData>, HeatmapChartEventMap> {

    private _cellGroups: Group[] = [];
    private _xAxis!: ChartXAxis;
    private _yAxis!: ChartYAxis;
    private _tooltip!: Tooltip;

    constructor(target: string | HTMLElement | Context, options: HeatmapChartOptions<TData>) {
        super(target, options);

        const axisOpts = normalizeAxis(options.axis);
        const xAxis = normalizeAxisItem(axisOpts.x);
        const yAxis = normalizeYAxisItem(
            Array.isArray(axisOpts.y) ? axisOpts.y[0] : axisOpts.y
        );
        const tooltipOpts = normalizeTooltip(options.tooltip);

        if (tooltipOpts.visible) {
            this._tooltip = new Tooltip({
                scene: this.scene,
                renderer: this.renderer,
                font: tooltipOpts.font,
                fontColor: tooltipOpts.fontColor,
                backgroundColor: tooltipOpts.backgroundColor,
            });
        }

        this._xAxis = new ChartXAxis({
            scene: this.scene,
            renderer: this.renderer,
            bounds: Box.empty(),
            scale: scaleContinuous([0, 1], [0, 1]),
            labelFont: xAxis.font,
            labelColor: xAxis.fontColor,
            formatLabel: resolveFormatLabel(xAxis.format),
            title: xAxis.title,
        });

        this._yAxis = new ChartYAxis({
            scene: this.scene,
            renderer: this.renderer,
            bounds: Box.empty(),
            scale: scaleContinuous([0, 1], [0, 1]),
            labelFont: yAxis.font,
            labelColor: yAxis.fontColor,
            formatLabel: resolveFormatLabel(yAxis.format),
            title: yAxis.title,
        });

        this.init();
    }

    public async render() {
        return super.render(async () => {
            const {
                data,
                xBy,
                yBy,
                value: valueBy,
                xCategories,
                yCategories,
                colorRange,
                borderRadius = 2,
            } = this.options;

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getX = typeIsFunction(xBy) ? xBy : (item: any) => item[xBy] as string;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getY = typeIsFunction(yBy) ? yBy : (item: any) => item[yBy] as string;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const getValue = typeIsFunction(valueBy) ? valueBy : (item: any) => item[valueBy] as number;


            // Compute value extent
            let minVal = Infinity;
            let maxVal = -Infinity;

            data.forEach(item => {
                const v = getValue(item);
                minVal = Math.min(minVal, v);
                maxVal = Math.max(maxVal, v);
            });

            const valueRange = maxVal - minVal || 1;

            // A sequential colour scale over the value extent. `colorRange` may be two colours (the
            // default low→high pair) or any number of stops, including a built-in `COLOR_SCHEME_*` palette.
            const colorScale = scaleSequential(colorRange ?? DEFAULT_COLOR_RANGE, [minVal, minVal + valueRange]);

            const layout = this.createLayout();
            this.reserveTitle(layout);
            const area = layout.area;
            const top = area.y;
            const left = area.x;
            const right = area.x + area.width;
            const bottom = area.y + area.height;

            // Initial y-axis setup to measure label width
            const initialYScale = scaleBand(yCategories, [top, bottom], {
                innerPadding: 0.05,
                outerPadding: 0.05,
            });

            this._yAxis.scale = Object.assign(
                (value: string) => initialYScale(value) + initialYScale.bandwidth / 2,
                {
                    domain: yCategories,
                    range: initialYScale.range,
                    inverse: initialYScale.inverse,
                    ticks: () => yCategories,
                    includes: (v: string) => yCategories.includes(v),
                }
            ) as unknown as typeof this._yAxis.scale;

            this._yAxis.bounds = new Box(
                top,
                left,
                bottom,
                right
            );

            const yAxisBoundingBox = this._yAxis.getBoundingBox();

            // Initial x-axis setup to measure label height
            const initialXScale = scaleBand(xCategories, [yAxisBoundingBox.right, right], {
                innerPadding: 0.05,
                outerPadding: 0.05,
            });

            this._xAxis.scale = Object.assign(
                (value: string) => initialXScale(value) + initialXScale.bandwidth / 2,
                {
                    domain: xCategories,
                    range: initialXScale.range,
                    inverse: initialXScale.inverse,
                    ticks: () => xCategories,
                    includes: (v: string) => xCategories.includes(v),
                }
            ) as unknown as typeof this._xAxis.scale;

            this._xAxis.bounds = new Box(
                top,
                yAxisBoundingBox.right,
                bottom,
                right
            );

            const xAxisBoundingBox = this._xAxis.getBoundingBox();

            // Rebuild scales with correct chart area bounds
            const xScale = scaleBand(xCategories, [yAxisBoundingBox.right, right], {
                innerPadding: 0.05,
                outerPadding: 0.05,
            });

            const yScale = scaleBand(yCategories, [top, xAxisBoundingBox.top], {
                innerPadding: 0.05,
                outerPadding: 0.05,
            });

            // Update axes with final scales
            this._xAxis.scale = Object.assign(
                (value: string) => xScale(value) + xScale.bandwidth / 2,
                {
                    domain: xCategories,
                    range: xScale.range,
                    inverse: xScale.inverse,
                    ticks: () => xCategories,
                    includes: (v: string) => xCategories.includes(v),
                }
            ) as unknown as typeof this._xAxis.scale;

            this._xAxis.bounds = new Box(
                top,
                yAxisBoundingBox.right,
                bottom,
                right
            );

            this._yAxis.scale = Object.assign(
                (value: string) => yScale(value) + yScale.bandwidth / 2,
                {
                    domain: yCategories,
                    range: yScale.range,
                    inverse: yScale.inverse,
                    ticks: () => yCategories,
                    includes: (v: string) => yCategories.includes(v),
                }
            ) as unknown as typeof this._yAxis.scale;

            this._yAxis.bounds = new Box(
                top,
                left,
                xAxisBoundingBox.top,
                right
            );

            // Draw cells
            const cellData = data.map(item => {
                const xVal = getX(item);
                const yVal = getY(item);
                const value = getValue(item);
                const color = colorScale(value);

                return {
                    id: `cell-${xVal}-${yVal}`,
                    x: xScale(xVal),
                    y: yScale(yVal),
                    width: xScale.bandwidth,
                    height: yScale.bandwidth,
                    color,
                    value,
                    xLabel: xVal,
                    yLabel: yVal,
                };
            });

            const {
                left: cellEntries,
                inner: cellUpdates,
                right: cellExits,
            } = arrayJoin(cellData, this._cellGroups, (item, group) => item.id === group.id);

            cellExits.forEach(el => el.destroy());

            const entryGroups = cellEntries.map(cell => {
                const rect = createRect({
                    id: `${cell.id}-rect`,
                    x: cell.x,
                    y: cell.y,
                    width: cell.width,
                    height: cell.height,
                    fill: cell.color,
                    opacity: 0,
                    borderRadius,
                    data: {
                        opacity: 1,
                    },
                });

                this._attachCellHover(rect, cell);

                return createGroup({
                    id: cell.id,
                    children: [rect],
                });
            });

            const updateGroups = cellUpdates.map(([cell, group]) => {
                const rect = group.getElementsByType('rect')[0] as Rect;

                if (rect) {
                    rect.data = {
                        x: cell.x,
                        y: cell.y,
                        width: cell.width,
                        height: cell.height,
                        fill: cell.color,
                        opacity: 1,
                    } as RectState;

                    this._attachCellHover(rect, cell);
                }

                return group;
            });

            this.scene.add(entryGroups);

            this._cellGroups = [
                ...entryGroups,
                ...updateGroups,
            ];

            // Animate
            const entryRects = entryGroups.flatMap(g => g.getElementsByType('rect')) as Rect[];

            const entriesTransition = this.renderer.transition(entryRects, (element, index, length) => ({
                duration: this.getAnimationDuration(800),
                delay: index * (this.getAnimationDuration(600) / length),
                ease: easeOutCubic,
                state: element.data as RectState,
            }));

            const updateRects = updateGroups.flatMap(g => g.getElementsByType('rect')) as Rect[];

            const updatesTransition = this.renderer.transition(updateRects, element => ({
                duration: this.getAnimationDuration(800),
                ease: easeOutCubic,
                state: element.data as RectState,
            }));

            return Promise.all([
                this._xAxis.render(),
                this._yAxis.render(),
                entriesTransition,
                updatesTransition,
            ]);
        });
    }

    private _attachCellHover(rect: Rect, cell: { x: number;
        y: number;
        width: number;
        value: number;
        xLabel: string;
        yLabel: string; }) {
        const hover = this.resolveAnimation(ANIMATION_REFERENCE.hover);

        const payload = (point: { x: number;
            y: number; }): HeatmapChartCellEvent => ({
            x: point.x,
            y: point.y,
            value: cell.value,
            xLabel: cell.xLabel,
            yLabel: cell.yLabel,
        });

        applyHoverHighlight(rect, {
            renderer: this.renderer,
            duration: hover.duration,
            ease: hover.ease,
            tooltip: this._tooltip,
            anchor: () => ({
                x: cell.x + cell.width / 2,
                y: cell.y,
            }),
            content: () => `${cell.xLabel}, ${cell.yLabel}: ${formatNumber(cell.value)}`,
            highlight: { opacity: 0.8 },
            restore: { opacity: 1 },
            onEnter: point => this.emit('cellenter', payload(point)),
            onLeave: point => this.emit('cellleave', payload(point)),
            onClick: point => this.emit('cellclick', payload(point)),
        });
    }

}

/** Factory function that creates a new {@link HeatmapChart} instance. */
export function createHeatmapChart<TData = unknown>(target: string | HTMLElement | Context, options: HeatmapChartOptions<TData>) {
    return new HeatmapChart<TData>(target, options);
}
