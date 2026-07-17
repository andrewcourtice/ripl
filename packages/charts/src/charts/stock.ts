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
    ChartCrosshairInput,
    ChartGridInput,
    ChartTooltipInput,
    ValueFormatInput,
} from '../core/options';

import {
    normalizeAxis,
    normalizeAxisItem,
    normalizeCrosshair,
    normalizeGrid,
    normalizeTooltip,
    normalizeYAxisItem,
    resolveValueFormat,
} from '../core/options';

import type {
    ChartXAxis,
    ChartYAxis,
} from '../components/axis';

import {
    createChartAxes,
} from '../components/axis';

import {
    Tooltip,
} from '../components/tooltip';

import {
    applyHoverHighlight,
} from '../core/interaction';

import {
    Grid,
} from '../components/grid';

import {
    Crosshair,
} from '../components/crosshair';

import type {
    Context,
    EventMap,
    Group,
    Line,
    LineState,
    Rect,
    RectState,
    Scale,
} from '@ripl/core';

import {
    Box,
    clamp,
    createGroup,
    createLine,
    createRect,
    easeOutCubic,
    easeOutQuart,
    getExtent,
    scaleContinuous,
    setColorAlpha,
} from '@ripl/core';

import {
    arrayJoin,
    functionIdentity,
    typeIsFunction,
} from '@ripl/utilities';

/** Options for configuring a {@link StockChart}. */
export interface StockChartOptions<TData = unknown> extends BaseChartOptions {
    /** The dataset to render, one candlestick per item. */
    data: TData[];
    /** Accessor for each item's unique key, used along the x-axis and to match candles across updates. */
    key: keyof TData | ((item: TData) => string);
    /** Accessor for each item's opening price. */
    open: NumericAccessor<TData>;
    /** Accessor for each item's high price. */
    high: NumericAccessor<TData>;
    /** Accessor for each item's low price. */
    low: NumericAccessor<TData>;
    /** Accessor for each item's closing price. */
    close: NumericAccessor<TData>;
    /** Optional accessor for each item's traded volume, enabling the volume sub-chart. */
    volume?: NumericAccessor<TData>;
    /** Show the volume sub-chart below the candlesticks. Defaults to `true` (requires `volume`). */
    showVolume?: boolean;
    /** Background grid line configuration. */
    grid?: ChartGridInput;
    /** Crosshair overlay configuration. */
    crosshair?: ChartCrosshairInput;
    /** Hover tooltip configuration. */
    tooltip?: ChartTooltipInput;
    /** Axis configuration (labels, ticks, titles). */
    axis?: ChartAxisInput<TData>;
    /** Format applied to the open/high/low/close values shown in the candle tooltip. */
    format?: ValueFormatInput;
    /** Colour for candles that close at or above their open (bullish). */
    upColor?: string;
    /** Colour for candles that close below their open (bearish). */
    downColor?: string;
}

/** Payload emitted for stock candlestick interaction events. */
export interface StockChartCandleEvent {
    /** X position of the candle body, in canvas coordinates. */
    x: number;
    /** Y position of the candle body's top, in canvas coordinates. */
    y: number;
    /** The candle's unique key. */
    key: string;
    /** The candle's opening price. */
    open: number;
    /** The candle's high price. */
    high: number;
    /** The candle's low price. */
    low: number;
    /** The candle's closing price. */
    close: number;
    /** The candle's traded volume (0 when no volume accessor is configured). */
    volume: number;
}

/** Events emitted by a {@link StockChart} that consumers can subscribe to via `chart.on(...)`. */
export interface StockChartEventMap extends EventMap {
    /** Emitted when a candlestick is clicked. */
    candleclick: StockChartCandleEvent;
    /** Emitted when the pointer enters a candlestick. */
    candleenter: StockChartCandleEvent;
    /** Emitted when the pointer leaves a candlestick. */
    candleleave: StockChartCandleEvent;
}

interface CandlestickValues {
    key: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    isUp: boolean;
}

const DEFAULT_UP_COLOR = '#6dd5b1';
const DEFAULT_DOWN_COLOR = '#f4a0b9';
const VOLUME_HEIGHT_RATIO = 0.2;

/**
 * Candlestick (stock) chart rendering OHLC data with optional volume bars.
 *
 * Each data point is rendered as a candlestick with a body (open-close range)
 * and wick (high-low range), colored by direction. Supports an optional
 * volume sub-chart, crosshair, tooltips, grid, and animated entry/update
 * transitions.
 *
 * @typeParam TData - The type of each data item in the dataset.
 */
export class StockChart<TData = unknown> extends Chart<StockChartOptions<TData>, StockChartEventMap> {

    private _candlestickGroups: Group[] = [];
    private _volumeGroup?: Group;
    private _yScale!: Scale;
    private _xScale!: Scale<string>;
    private _volumeScale!: Scale;
    private _xAxis!: ChartXAxis;
    private _yAxis!: ChartYAxis;
    private _tooltip!: Tooltip;
    private _grid?: Grid;
    private _crosshair?: Crosshair;

    constructor(target: string | HTMLElement | Context, options: StockChartOptions<TData>) {
        super(target, options);

        const axisOpts = normalizeAxis(options.axis);
        const xAxis = normalizeAxisItem(axisOpts.x);
        const yAxis = normalizeYAxisItem(
            Array.isArray(axisOpts.y) ? axisOpts.y[0] : axisOpts.y
        );
        const gridOpts = normalizeGrid(options.grid);
        const crosshairOpts = normalizeCrosshair(options.crosshair, { axis: 'both' });
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

        const axes = createChartAxes({
            scene: this.scene,
            renderer: this.renderer,
            xAxis,
            yAxis,
        });

        this._xAxis = axes.xAxis;
        this._yAxis = axes.yAxis;

        if (gridOpts.visible) {
            this._grid = new Grid({
                scene: this.scene,
                renderer: this.renderer,
                horizontal: true,
                vertical: false,
                stroke: gridOpts.lineColor,
                lineWidth: gridOpts.lineWidth,
                lineDash: gridOpts.lineDash,
            });
        }

        if (crosshairOpts.visible) {
            this._crosshair = new Crosshair({
                scene: this.scene,
                renderer: this.renderer,
                vertical: crosshairOpts.axis === 'x' || crosshairOpts.axis === 'both',
                horizontal: crosshairOpts.axis === 'y' || crosshairOpts.axis === 'both',
                stroke: crosshairOpts.lineColor,
                lineWidth: crosshairOpts.lineWidth,
            });
        }

        this.init();
    }

    private _getAccessor<TReturn>(accessor: keyof TData | ((item: TData) => TReturn)): (item: TData) => TReturn {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return typeIsFunction(accessor) ? accessor : (item: any) => item[accessor] as TReturn;
    }

    /**
     * Wires hover highlight + tooltip onto a candlestick body. Uses {@link applyHoverHighlight}
     * so prior listeners are disposed on re-apply — calling this on every update no longer leaks.
     */
    private _attachBodyHover(body: Rect, values: CandlestickValues, color: string, anchorX: number, anchorY: number) {
        const formatValue = resolveValueFormat(this.options.format);

        const label = `O: ${formatValue(values.open)}  H: ${formatValue(values.high)}  L: ${formatValue(values.low)}  C: ${formatValue(values.close)}`;

        const payload = (point: { x: number;
            y: number; }): StockChartCandleEvent => ({
            x: point.x,
            y: point.y,
            key: values.key,
            open: values.open,
            high: values.high,
            low: values.low,
            close: values.close,
            volume: values.volume,
        });

        applyHoverHighlight(body, {
            renderer: this.renderer,
            animation: () => ({
                duration: this.getAnimationDuration(200),
                ease: easeOutQuart,
            }),
            tooltip: this._tooltip,
            anchor: () => ({
                x: anchorX,
                y: anchorY,
            }),
            content: () => label,
            onEnter: point => this.emit('candleenter', payload(point)),
            onLeave: point => this.emit('candleleave', payload(point)),
            onClick: point => this.emit('candleclick', payload(point)),
            highlight: {
                fill: setColorAlpha(color, 0.8),
            },
            restore: {
                fill: color,
            },
        });
    }

    private _getCandlestickValues(item: TData): CandlestickValues {
        const {
            key: keyAccessor,
            open: openAccessor,
            high: highAccessor,
            low: lowAccessor,
            close: closeAccessor,
            volume: volumeAccessor,
        } = this.options;

        const getKey = this._getAccessor<string>(keyAccessor);
        const getOpen = this._getAccessor<number>(openAccessor);
        const getHigh = this._getAccessor<number>(highAccessor);
        const getLow = this._getAccessor<number>(lowAccessor);
        const getClose = this._getAccessor<number>(closeAccessor);

        const open = getOpen(item);
        const close = getClose(item);

        return {
            key: getKey(item),
            open,
            high: getHigh(item),
            low: getLow(item),
            close,
            volume: volumeAccessor ? this._getAccessor<number>(volumeAccessor)(item) : 0,
            isUp: close >= open,
        };
    }

    private async _drawCandlesticks(chartLeft: number, chartRight: number) {
        const {
            data,
            upColor = DEFAULT_UP_COLOR,
            downColor = DEFAULT_DOWN_COLOR,
        } = this.options;

        const candleWidth = Math.max(1, ((chartRight - chartLeft) / data.length) * 0.6);
        const wickWidth = 1;

        const {
            left: entries,
            inner: updates,
            right: exits,
        } = arrayJoin(
            data,
            this._candlestickGroups,
            (item, group) => group.id === `candle-${this._getCandlestickValues(item).key}`
        );

        exits.forEach(el => el.destroy());

        const entryGroups = entries.map((item) => {
            const values = this._getCandlestickValues(item);
            const color = values.isUp ? upColor : downColor;

            const x = this._xScale(values.key);
            const yOpen = this._yScale(values.open);
            const yClose = this._yScale(values.close);
            const yHigh = this._yScale(values.high);
            const yLow = this._yScale(values.low);

            const bodyTop = Math.min(yOpen, yClose);
            const bodyHeight = Math.max(Math.abs(yOpen - yClose), 1);
            const midY = (yOpen + yClose) / 2;

            const body = createRect({
                id: `${values.key}-body`,
                fill: color,
                x: x - candleWidth / 2,
                y: midY,
                width: candleWidth,
                height: 0,
                borderRadius: 1,
                data: {
                    fill: color,
                    x: x - candleWidth / 2,
                    y: bodyTop,
                    width: candleWidth,
                    height: bodyHeight,
                    borderRadius: 1,
                } as RectState,
            });

            const wick = createLine({
                id: `${values.key}-wick`,
                stroke: color,
                lineWidth: wickWidth,
                x1: x,
                y1: midY,
                x2: x,
                y2: midY,
                data: {
                    stroke: color,
                    lineWidth: wickWidth,
                    x1: x,
                    y1: yHigh,
                    x2: x,
                    y2: yLow,
                } as LineState,
            });

            const group = createGroup({
                // Namespace the candle group id so a data key can never equal an axis tick id
                // (which shares a single global DOM cache in the SVG renderer).
                id: `candle-${values.key}`,
                children: [wick, body],
            });

            this._attachBodyHover(body, values, color, x, bodyTop);

            return group;
        });

        const updateGroups = updates.map(([item, group]) => {
            const values = this._getCandlestickValues(item);
            const color = values.isUp ? upColor : downColor;

            const x = this._xScale(values.key);
            const yOpen = this._yScale(values.open);
            const yClose = this._yScale(values.close);
            const yHigh = this._yScale(values.high);
            const yLow = this._yScale(values.low);

            const bodyTop = Math.min(yOpen, yClose);
            const bodyHeight = Math.max(Math.abs(yOpen - yClose), 1);

            const body = group.getElementsByType('rect')[0] as Rect;
            const wick = group.getElementsByType('line')[0] as Line;

            if (body) {
                body.data = {
                    fill: color,
                    x: x - candleWidth / 2,
                    y: bodyTop,
                    width: candleWidth,
                    height: bodyHeight,
                    borderRadius: 1,
                } as RectState;

                this._attachBodyHover(body, values, color, x, bodyTop);
            }

            if (wick) {
                wick.data = {
                    stroke: color,
                    lineWidth: wickWidth,
                    x1: x,
                    y1: yHigh,
                    x2: x,
                    y2: yLow,
                } as LineState;
            }

            return group;
        });

        this.scene.add(entryGroups);

        this._candlestickGroups = [
            ...entryGroups,
            ...updateGroups,
        ];

        const entryTransitions = entryGroups.map((group, index) => {
            const body = group.getElementsByType('rect')[0] as Rect;
            const wick = group.getElementsByType('line')[0] as Line;

            const bodyTransition = body ? this.renderer.transition(body, {
                duration: this.getAnimationDuration(800),
                delay: index * (this.getAnimationDuration(400) / Math.max(1, entryGroups.length)),
                ease: easeOutCubic,
                state: body.data as RectState,
            }) : Promise.resolve();

            const wickTransition = wick ? this.renderer.transition(wick, {
                duration: this.getAnimationDuration(800),
                delay: index * (this.getAnimationDuration(400) / Math.max(1, entryGroups.length)),
                ease: easeOutCubic,
                state: wick.data as LineState,
            }) : Promise.resolve();

            return [bodyTransition, wickTransition];
        });

        const updateTransitions = updateGroups.map(group => {
            const body = group.getElementsByType('rect')[0] as Rect;
            const wick = group.getElementsByType('line')[0] as Line;

            const bodyTransition = body ? this.renderer.transition(body, {
                duration: this.getAnimationDuration(800),
                ease: easeOutCubic,
                state: body.data as RectState,
            }) : Promise.resolve();

            const wickTransition = wick ? this.renderer.transition(wick, {
                duration: this.getAnimationDuration(800),
                ease: easeOutCubic,
                state: wick.data as LineState,
            }) : Promise.resolve();

            return [bodyTransition, wickTransition];
        });

        return Promise.all([
            ...entryTransitions,
            ...updateTransitions,
        ].flat());
    }

    private async _drawVolume(
        chartLeft: number,
        chartRight: number,
        volumeTop: number,
        volumeBottom: number
    ) {
        const {
            data,
            volume: volumeAccessor,
            upColor = DEFAULT_UP_COLOR,
            downColor = DEFAULT_DOWN_COLOR,
        } = this.options;

        if (!volumeAccessor) {
            return;
        }

        const barWidth = Math.max(1, ((chartRight - chartLeft) / data.length) * 0.6);

        const volumes = data.map(item => this._getAccessor<number>(volumeAccessor)(item));
        const volumeExtent = getExtent(volumes.concat(0), functionIdentity);

        this._volumeScale = scaleContinuous(volumeExtent, [volumeBottom, volumeTop]);

        if (this._volumeGroup) {
            const existingBars = this._volumeGroup.getElementsByType('rect') as Rect[];

            const {
                left: barEntries,
                inner: barUpdates,
                right: barExits,
            } = arrayJoin(
                data,
                existingBars,
                (item, bar) => bar.id === `vol-${this._getCandlestickValues(item).key}`
            );

            barExits.forEach(el => el.destroy());

            barEntries.forEach(item => {
                const values = this._getCandlestickValues(item);
                const color = values.isUp ? upColor : downColor;
                const x = this._xScale(values.key);
                const barHeight = Math.abs(volumeBottom - this._volumeScale(values.volume));

                const bar = createRect({
                    id: `vol-${values.key}`,
                    fill: setColorAlpha(color, 0.3),
                    x: x - barWidth / 2,
                    y: volumeBottom,
                    width: barWidth,
                    height: 0,
                    data: {
                        fill: setColorAlpha(color, 0.3),
                        x: x - barWidth / 2,
                        y: volumeBottom - barHeight,
                        width: barWidth,
                        height: barHeight,
                    } as RectState,
                });

                this._volumeGroup!.add(bar);
            });

            barUpdates.forEach(([item, bar]) => {
                const values = this._getCandlestickValues(item);
                const color = values.isUp ? upColor : downColor;
                const x = this._xScale(values.key);
                const barHeight = Math.abs(volumeBottom - this._volumeScale(values.volume));

                bar.data = {
                    fill: setColorAlpha(color, 0.3),
                    x: x - barWidth / 2,
                    y: volumeBottom - barHeight,
                    width: barWidth,
                    height: barHeight,
                } as RectState;
            });

            const allBars = this._volumeGroup.getElementsByType('rect') as Rect[];

            return this.renderer.transition(allBars, (element, index, length) => ({
                duration: this.getAnimationDuration(800),
                delay: index * (this.getAnimationDuration(400) / Math.max(1, length)),
                ease: easeOutCubic,
                state: element.data as RectState,
            }));
        }

        this._volumeGroup = createGroup({
            id: 'volume',
            zIndex: -1,
        });

        const bars = data.map(item => {
            const values = this._getCandlestickValues(item);
            const color = values.isUp ? upColor : downColor;
            const x = this._xScale(values.key);
            const barHeight = Math.abs(volumeBottom - this._volumeScale(values.volume));

            return createRect({
                id: `vol-${values.key}`,
                fill: setColorAlpha(color, 0.3),
                x: x - barWidth / 2,
                y: volumeBottom,
                width: barWidth,
                height: 0,
                data: {
                    fill: setColorAlpha(color, 0.3),
                    x: x - barWidth / 2,
                    y: volumeBottom - barHeight,
                    width: barWidth,
                    height: barHeight,
                } as RectState,
            });
        });

        bars.forEach(bar => this._volumeGroup!.add(bar));
        this.scene.add(this._volumeGroup);

        return this.renderer.transition(bars, (element, index, length) => ({
            duration: this.getAnimationDuration(800),
            delay: index * (this.getAnimationDuration(400) / Math.max(1, length)),
            ease: easeOutCubic,
            state: element.data as RectState,
        }));
    }

    public async render() {
        return super.render(async () => {
            const {
                data,
                showVolume = true,
                volume: volumeAccessor,
            } = this.options;

            const allValues = data.map(item => this._getCandlestickValues(item));

            const highs = allValues.map(v => v.high);
            const lows = allValues.map(v => v.low);
            const priceExtent = getExtent(highs.concat(lows), functionIdentity);

            const keys = allValues.map(v => v.key);

            const layout = this.createLayout();
            this.reserveTitle(layout);
            const area = layout.area;
            const left = area.x;
            const right = area.x + area.width;
            const bottom = area.y + area.height;
            const chartTop = area.y;

            const hasVolume = showVolume && !!volumeAccessor;
            const volumeHeight = hasVolume
                ? area.height * VOLUME_HEIGHT_RATIO
                : 0;

            this._yScale = scaleContinuous(priceExtent, [bottom - volumeHeight, chartTop], {
                padToTicks: 10,
            });

            this._yAxis.scale = this._yScale;
            this._yAxis.bounds = new Box(
                chartTop,
                left,
                bottom - volumeHeight,
                right
            );

            const yAxisBoundingBox = this._yAxis.getBoundingBox();

            // Build x scale as callable with metadata
            const xConvert = (value: string) => {
                const index = keys.indexOf(value);
                const rangeStart = yAxisBoundingBox.right + 20;
                const rangeEnd = right;
                return rangeStart + ((index + 0.5) / Math.max(1, keys.length)) * (rangeEnd - rangeStart);
            };

            const xInvert = (value: number) => {
                const rangeStart = yAxisBoundingBox.right + 20;
                const rangeEnd = right;
                const index = Math.round(((value - rangeStart) / (rangeEnd - rangeStart)) * keys.length - 0.5);
                return keys[clamp(index, 0, keys.length - 1)];
            };

            this._xScale = Object.assign(
                (value: string) => xConvert(value),
                {
                    domain: keys,
                    range: [yAxisBoundingBox.right + 20, right] as number[],
                    inverse: xInvert,
                    ticks: (count?: number) => {
                        if (!count || count >= keys.length) {
                            return keys;
                        }

                        const step = Math.ceil(keys.length / count);
                        return keys.filter((_, i) => i % step === 0);
                    },
                    includes: (value: string) => keys.includes(value),
                }
            ) as unknown as Scale<string>;

            this._xAxis.scale = this._xScale;
            this._xAxis.bounds = new Box(
                chartTop,
                yAxisBoundingBox.right,
                bottom - volumeHeight,
                right
            );

            const xAxisBoundingBox = this._xAxis.getBoundingBox();

            // Recalculate y scale with final chart area
            this._yScale = scaleContinuous(priceExtent, [xAxisBoundingBox.top, chartTop], {
                padToTicks: 10,
            });

            this._yAxis.scale = this._yScale;
            this._yAxis.bounds.bottom = xAxisBoundingBox.top;

            const chartLeft = yAxisBoundingBox.right + 20;
            const chartRight = right;

            // Render grid
            if (this._grid) {
                const yTicks = this._yScale.ticks(10);
                const yTickPositions = yTicks.map(tick => this._yScale(tick));

                this._grid.render(
                    [],
                    yTickPositions,
                    yAxisBoundingBox.right,
                    chartTop,
                    right - yAxisBoundingBox.right,
                    xAxisBoundingBox.top - chartTop
                );
            }

            // Setup crosshair
            this._crosshair?.setup(
                yAxisBoundingBox.right,
                chartTop,
                right - yAxisBoundingBox.right,
                xAxisBoundingBox.top - chartTop
            );

            // Volume area sits below the x axis
            const volumeTop = xAxisBoundingBox.bottom + 5;
            const volumeBottom = bottom;

            const promises: Promise<unknown>[] = [
                this._xAxis.render(),
                this._yAxis.render(),
                this._drawCandlesticks(chartLeft, chartRight),
            ];

            if (hasVolume) {
                promises.push(this._drawVolume(chartLeft, chartRight, volumeTop, volumeBottom));
            } else if (this._volumeGroup) {
                // Volume was toggled off — tear down the orphaned group so the reclaimed space
                // (the candlesticks now expand into it) doesn't paint over stale bars.
                this._volumeGroup.destroy();
                this._volumeGroup = undefined;
            }

            return Promise.all(promises);
        });
    }

}

/**
 * Factory function that creates a new {@link StockChart} instance.
 *
 * @example
 * ```ts
 * createStockChart(target, {
 *     data: [
 *         { date: '2026-01-02', o: 100, h: 108, l: 98, c: 105, v: 12000 },
 *         { date: '2026-01-03', o: 105, h: 110, l: 103, c: 104, v: 9800 },
 *     ],
 *     key: 'date',
 *     open: 'o',
 *     high: 'h',
 *     low: 'l',
 *     close: 'c',
 *     volume: 'v',
 * });
 * ```
 */
export function createStockChart<TData = unknown>(target: string | HTMLElement | Context, options: StockChartOptions<TData>) {
    return new StockChart<TData>(target, options);
}
