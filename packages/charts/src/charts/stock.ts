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
    ChartGridInput,
    ChartTooltipInput,
    ValueFormatInput,
} from '../core/options';

import {
    resolveValueFormat,
} from '../core/options';

import {
    applyHoverHighlight,
} from '../core/interaction';

import type {
    ChartNavigatorSeries,
} from '../components/navigator';

import type {
    ChartArea,
} from '../core/layout';

import type {
    Context,
    EventMap,
    Group,
    Line,
    LineState,
    Rect,
    RectState,
    Scale,
    Text,
} from '@ripl/core';

import {
    Box,
    createGroup,
    createLine,
    createRect,
    createText,
    easeOutCubic,
    easeOutQuart,
    scaleContinuous,
    setColorAlpha,
} from '@ripl/core';

import {
    arrayJoin,
    functionIdentity,
    numberClamp,
    numberExtent,
    typeIsFunction,
} from '@ripl/utilities';

/** Options for configuring a {@link StockChart}. */
export interface StockChartOptions<TData = unknown> extends CartesianChartOptions<TData> {
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
    /** Background grid configuration. */
    grid?: ChartGridInput;
    /** Crosshair overlay configuration. Both axes are tracked by default. */
    crosshair?: ChartCrosshairInput;
    /** Hover tooltip configuration. */
    tooltip?: ChartTooltipInput;
    /** Axis configuration (labels, ticks, titles). */
    axis?: ChartAxisInput<TData>;
    /** Format applied to the open/high/low/close values shown in the candle tooltip. */
    format?: ValueFormatInput;
    /** Color for candles that close at or above their open (bullish). */
    upColor?: string;
    /** Color for candles that close below their open (bearish). */
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
const VOLUME_HEIGHT_RATIO = 0.22;
const VOLUME_LABEL_GAP = 6;

/**
 * Candlestick (stock) chart rendering OHLC data with optional volume bars.
 *
 * Each data point is rendered as a candlestick with a body (open-close range)
 * and wick (high-low range), colored by direction. Supports an optional
 * volume sub-chart, both-axis crosshair (by default), pan/zoom navigation,
 * annotations, tooltips, grid, and animated entry/update transitions.
 *
 * @typeParam TData - The type of each data item in the dataset.
 */
export class StockChart<TData = unknown> extends CartesianChart<StockChartOptions<TData>, TData, StockChartEventMap> {

    private _candlestickGroups: Group[] = [];
    private _volumeGroup?: Group;
    private _volumeClip?: Rect;
    private _volumeLabel?: Text;
    private _yScale!: Scale;
    private _xScale!: Scale<string>;
    private _volumeScale!: Scale;

    constructor(target: string | HTMLElement | Context, options: StockChartOptions<TData>) {
        super(target, options);

        // Stock defaults the crosshair to both axes; grid draws horizontal price lines only.
        this.setupCartesian({
            grid: { horizontal: true },
            crosshair: true,
            crosshairAxisDefault: 'both',
        });

        this.init();
    }

    /** Stock charts are category-on-x (dates), so the navigator windows the x axis (bottom scrub bar). */
    protected override navigationAxis(): 'x' {
        return 'x';
    }

    private _getAccessor<TReturn>(accessor: keyof TData | ((item: TData) => TReturn)): (item: TData) => TReturn {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return typeIsFunction(accessor) ? accessor : (item: any) => item[accessor] as TReturn;
    }

    /** Builds the single-series overview data (close-price line) shown in the navigator scrub strip. */
    private _overviewSeries(): ChartNavigatorSeries[] {
        const getClose = this._getAccessor<number>(this.options.close);

        return [
            {
                id: 'close',
                color: this.getSeriesColor('close'),
                type: 'line',
                values: this.options.data.map(getClose),
            },
        ];
    }

    /**
     * Builds a centered category scale mapping each key to the center of its equal-width band across
     * `[left, right]`, exposing the metadata {@link CartesianChart.applyViewToScale} needs. Candles and
     * volume bars center on these positions, so they stay inside the plot (unlike an endpoint point
     * scale, whose first/last marks would overhang the axes).
     */
    private _createCategoryScale(keys: string[], left: number, right: number): Scale<string> {
        const convert = (value: string) => {
            const index = keys.indexOf(value);
            return left + ((index + 0.5) / Math.max(1, keys.length)) * (right - left);
        };

        const invert = (value: number) => {
            const index = Math.round(((value - left) / (right - left)) * keys.length - 0.5);
            return keys[numberClamp(index, 0, keys.length - 1)];
        };

        return Object.assign(
            convert,
            {
                domain: keys,
                range: [left, right] as number[],
                inverse: invert,
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
    }

    /**
     * Wires hover highlight + tooltip onto a candlestick body. Uses {@link applyHoverHighlight}
     * so prior listeners are disposed on re-apply; calling this on every update no longer leaks.
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
            tooltip: this.tooltip,
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

    private async _drawCandlesticks(candleWidth: number) {
        const {
            data,
            upColor = DEFAULT_UP_COLOR,
            downColor = DEFAULT_DOWN_COLOR,
        } = this.options;

        const wickWidth = 1;
        // While the navigator pans/zooms, snap candles to the new view each frame instead of tweening.
        const instant = this.isNavigating;

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

        // Candles live in the plot-clipped container so they can't smear over the axes while panning.
        this.addPlotContent(entryGroups);

        this._candlestickGroups = [
            ...entryGroups,
            ...updateGroups,
        ];

        const entryTransitions = entryGroups.map((group, index) => {
            const body = group.getElementsByType('rect')[0] as Rect;
            const wick = group.getElementsByType('line')[0] as Line;

            const duration = instant ? 0 : this.getAnimationDuration(800);
            const delay = instant ? 0 : index * (this.getAnimationDuration(400) / Math.max(1, entryGroups.length));

            const bodyTransition = body ? this.renderer.transition(body, {
                duration,
                delay,
                ease: easeOutCubic,
                state: body.data as RectState,
            }) : Promise.resolve();

            const wickTransition = wick ? this.renderer.transition(wick, {
                duration,
                delay,
                ease: easeOutCubic,
                state: wick.data as LineState,
            }) : Promise.resolve();

            return [bodyTransition, wickTransition];
        });

        const updateTransitions = updateGroups.map(group => {
            const body = group.getElementsByType('rect')[0] as Rect;
            const wick = group.getElementsByType('line')[0] as Line;

            const duration = instant ? 0 : this.getAnimationDuration(800);

            const bodyTransition = body ? this.renderer.transition(body, {
                duration,
                ease: easeOutCubic,
                state: body.data as RectState,
            }) : Promise.resolve();

            const wickTransition = wick ? this.renderer.transition(wick, {
                duration,
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

    /**
     * Measures the strip reserved beneath the volume bars for the centered "Volume" caption: the
     * caption's line height (bold theme font, matching an axis title) plus a small gap above it.
     */
    private _volumeLabelBand(): number {
        const metrics = this.scene.context.measureText('Volume', `bold ${this.theme.font}`);
        const labelHeight = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

        return labelHeight + VOLUME_LABEL_GAP;
    }

    private async _drawVolume(
        candleWidth: number,
        volumeTop: number,
        volumeBottom: number,
        plot: ChartArea
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

        const instant = this.isNavigating;

        const volumes = data.map(item => this._getAccessor<number>(volumeAccessor)(item));
        const volumeExtent = numberExtent(volumes.concat(0), functionIdentity);

        this._volumeScale = scaleContinuous(volumeExtent, [volumeBottom, volumeTop]);

        if (!this._volumeGroup) {
            this._volumeGroup = createGroup({
                id: 'volume',
                zIndex: -1,
            });

            this.scene.add(this._volumeGroup);
            this._volumeClip = undefined;
            this._volumeLabel = undefined;
        }

        const group = this._volumeGroup;

        // Clip mask (first child) so volume bars stay within their band while the navigator pans/zooms.
        if (!this._volumeClip) {
            this._volumeClip = createRect({
                id: 'volume-clip',
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                clip: false,
                pointerEvents: 'none',
                zIndex: Number.NEGATIVE_INFINITY,
            });

            group.add(this._volumeClip);
        }

        this._volumeClip.x = plot.x;
        this._volumeClip.y = volumeTop;
        this._volumeClip.width = plot.width;
        this._volumeClip.height = Math.max(0, volumeBottom - volumeTop);
        this._volumeClip.clip = !!this.navigator;

        // Centered "Volume" caption in the strip reserved beneath the bars, styled like an axis title.
        const labelBand = this._volumeLabelBand();

        if (!this._volumeLabel) {
            this._volumeLabel = createText({
                id: 'volume-label',
                content: 'Volume',
                x: 0,
                y: 0,
                textAlign: 'center',
                textBaseline: 'bottom',
                fill: this.theme.axisColor,
                font: `bold ${this.theme.font}`,
                zIndex: 5,
            });

            group.add(this._volumeLabel);
        }

        this._volumeLabel.x = plot.x + plot.width / 2;
        this._volumeLabel.y = volumeBottom + labelBand;

        // Exclude the clip rect (also a rect) from the bar data-join.
        const existingBars = (group.getElementsByType('rect') as Rect[]).filter(bar => bar.id !== 'volume-clip');

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
                x: x - candleWidth / 2,
                y: volumeBottom,
                width: candleWidth,
                height: 0,
                data: {
                    fill: setColorAlpha(color, 0.3),
                    x: x - candleWidth / 2,
                    y: volumeBottom - barHeight,
                    width: candleWidth,
                    height: barHeight,
                } as RectState,
            });

            group.add(bar);
        });

        barUpdates.forEach(([item, bar]) => {
            const values = this._getCandlestickValues(item);
            const color = values.isUp ? upColor : downColor;
            const x = this._xScale(values.key);
            const barHeight = Math.abs(volumeBottom - this._volumeScale(values.volume));

            bar.data = {
                fill: setColorAlpha(color, 0.3),
                x: x - candleWidth / 2,
                y: volumeBottom - barHeight,
                width: candleWidth,
                height: barHeight,
            } as RectState;
        });

        const allBars = (group.getElementsByType('rect') as Rect[]).filter(bar => bar.id !== 'volume-clip');

        return this.renderer.transition(allBars, (element, index, length) => ({
            duration: instant ? 0 : this.getAnimationDuration(800),
            delay: instant ? 0 : index * (this.getAnimationDuration(400) / Math.max(1, length)),
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

            this.resolveSeriesColors([{ id: 'close' }]);
            this.prepareAxes();

            const allValues = data.map(item => this._getCandlestickValues(item));

            const highs = allValues.map(v => v.high);
            const lows = allValues.map(v => v.low);
            const priceExtent = numberExtent(highs.concat(lows), functionIdentity);

            const keys = allValues.map(v => v.key);

            const layout = this.createLayout();
            this.reserveTitle(layout);

            // Reserve the overview strip band from the bottom before the axes are measured.
            const navBand = this.reserveNavigatorBand(layout);

            const area = layout.area;
            const left = area.x;
            const top = area.y;
            const right = area.x + area.width;
            const bottom = area.y + area.height;

            const hasVolume = showVolume && !!volumeAccessor;
            const volumeHeight = hasVolume
                ? area.height * VOLUME_HEIGHT_RATIO
                : 0;

            // The candle + axis region ends above the volume band (which sits below the x-axis labels).
            const axisRegionBottom = bottom - volumeHeight;

            // Provisional y (price) scale to measure the y-axis label width.
            this._yScale = scaleContinuous(priceExtent, [axisRegionBottom, top], {
                padToTicks: 10,
            });

            this.yAxis.scale = this._yScale;
            this.yAxis.bounds = new Box(top, left, axisRegionBottom, right);

            const yAxisBox = this.yAxis.getBoundingBox();

            // Candlesticks center in equal bands across the plot width, so they stay inside the plot.
            const candleWidth = Math.max(1, ((right - yAxisBox.right) / Math.max(1, data.length)) * 0.6);

            this._xScale = this._createCategoryScale(keys, yAxisBox.right, right);
            this.xAxis.scale = this._xScale;
            this.xAxis.bounds = new Box(top, yAxisBox.right, axisRegionBottom, right);

            const xAxisBox = this.xAxis.getBoundingBox();

            // Final y scale over the candle plot height.
            this._yScale = scaleContinuous(priceExtent, [xAxisBox.top, top], {
                padToTicks: 10,
            });

            this.yAxis.scale = this._yScale;
            this.yAxis.bounds.bottom = xAxisBox.top;

            // The navigator windows the x (category) axis only; the price axis stays at the full extent.
            this._xScale = this.applyViewToScale(this._xScale, 'x');
            this.xAxis.scale = this._xScale;

            const plot: ChartArea = {
                x: yAxisBox.right,
                y: top,
                width: right - yAxisBox.right,
                height: xAxisBox.top - top,
            };

            this.clipPlot(plot);

            this.renderGrid(
                [],
                this.gridTicks(this._yScale, 10),
                plot
            );

            this.setupCrosshair(plot);

            this.renderAnnotations({ y: this._yScale }, plot);

            // Volume band sits below the x-axis labels, reserving a strip at its base for the caption.
            const volumeTop = xAxisBox.bottom + 5;
            const labelBand = hasVolume ? this._volumeLabelBand() : 0;
            const volumeBottom = bottom - labelBand;

            const promises: Promise<unknown>[] = [
                this.xAxis.visible ? this.xAxis.render() : Promise.resolve(),
                this.yAxis.visible ? this.yAxis.render() : Promise.resolve(),
                this._drawCandlesticks(candleWidth),
            ];

            if (hasVolume) {
                promises.push(this._drawVolume(candleWidth, volumeTop, volumeBottom, plot));
            } else if (this._volumeGroup) {
                // Volume was toggled off, so tear down the orphaned group so the reclaimed space
                // (the candlesticks now expand into it) doesn't paint over stale bars.
                this._volumeGroup.destroy();
                this._volumeGroup = undefined;
                this._volumeClip = undefined;
                this._volumeLabel = undefined;
            }

            this.renderNavigator(navBand, navBand ? this._overviewSeries() : [], [priceExtent[0], priceExtent[1]]);

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
