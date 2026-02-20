import {
    BaseChartOptions,
    Chart,
} from '../core/chart';

import {
    ChartXAxis,
    ChartYAxis,
} from '../components/axis';

import {
    Tooltip,
} from '../components/tooltip';

import {
    Grid,
} from '../components/grid';

import {
    Crosshair,
} from '../components/crosshair';

import {
    Box,
    Context,
    createGroup,
    createLine,
    createRect,
    easeOutCubic,
    easeOutQuart,
    getExtent,
    Group,
    Line,
    LineState,
    Rect,
    RectState,
    Scale,
    scaleContinuous,
    setColorAlpha,
} from '@ripl/core';

import {
    arrayForEach,
    arrayJoin,
    arrayMap,
    Disposable,
    functionIdentity,
    typeIsFunction,
} from '@ripl/utilities';

export interface StockChartOptions<TData = unknown> extends BaseChartOptions {
    data: TData[];
    keyBy: keyof TData | ((item: TData) => string);
    openBy: keyof TData | ((item: TData) => number);
    highBy: keyof TData | ((item: TData) => number);
    lowBy: keyof TData | ((item: TData) => number);
    closeBy: keyof TData | ((item: TData) => number);
    volumeBy?: keyof TData | ((item: TData) => number);
    showVolume?: boolean;
    showGrid?: boolean;
    showCrosshair?: boolean;
    upColor?: string;
    downColor?: string;
    xAxisLabel?: string;
    yAxisLabel?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formatXLabel?: (value: any) => string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    formatYLabel?: (value: any) => string;
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

export class StockChart<TData = unknown> extends Chart<StockChartOptions<TData>> {

    private candlestickGroups: Group[] = [];
    private volumeGroup?: Group;
    private yScale!: Scale;
    private xScale!: Scale<string>;
    private volumeScale!: Scale;
    private xAxis!: ChartXAxis;
    private yAxis!: ChartYAxis;
    private tooltip!: Tooltip;
    private grid?: Grid;
    private crosshair?: Crosshair;
    private crosshairDisposables: Disposable[] = [];

    constructor(target: string | HTMLElement | Context, options: StockChartOptions<TData>) {
        super(target, options);

        this.tooltip = new Tooltip({
            scene: this.scene,
            renderer: this.renderer,
        });

        this.xAxis = new ChartXAxis({
            scene: this.scene,
            renderer: this.renderer,
            bounds: Box.empty(),
            scale: scaleContinuous([0, 1], [0, 1]),
            title: options.xAxisLabel,
            formatLabel: options.formatXLabel,
        });

        this.yAxis = new ChartYAxis({
            scene: this.scene,
            renderer: this.renderer,
            bounds: Box.empty(),
            scale: scaleContinuous([0, 1], [0, 1]),
            title: options.yAxisLabel,
            formatLabel: options.formatYLabel,
        });

        if (options.showGrid !== false) {
            this.grid = new Grid({
                scene: this.scene,
                renderer: this.renderer,
                horizontal: true,
                vertical: false,
            });
        }

        if (options.showCrosshair !== false) {
            this.crosshair = new Crosshair({
                scene: this.scene,
                renderer: this.renderer,
                vertical: true,
                horizontal: true,
            });
        }

        this.init();
    }

    private getAccessor<TReturn>(accessor: keyof TData | ((item: TData) => TReturn)): (item: TData) => TReturn {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return typeIsFunction(accessor) ? accessor : (item: any) => item[accessor] as TReturn;
    }

    private getCandlestickValues(item: TData): CandlestickValues {
        const {
            keyBy,
            openBy,
            highBy,
            lowBy,
            closeBy,
            volumeBy,
        } = this.options;

        const getKey = this.getAccessor<string>(keyBy);
        const getOpen = this.getAccessor<number>(openBy);
        const getHigh = this.getAccessor<number>(highBy);
        const getLow = this.getAccessor<number>(lowBy);
        const getClose = this.getAccessor<number>(closeBy);

        const open = getOpen(item);
        const close = getClose(item);

        return {
            key: getKey(item),
            open,
            high: getHigh(item),
            low: getLow(item),
            close,
            volume: volumeBy ? this.getAccessor<number>(volumeBy)(item) : 0,
            isUp: close >= open,
        };
    }

    private async drawCandlesticks(chartLeft: number, chartRight: number) {
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
            this.candlestickGroups,
            (item, group) => group.id === this.getCandlestickValues(item).key
        );

        arrayForEach(exits, group => group.destroy());

        const entryGroups = arrayMap(entries, (item) => {
            const values = this.getCandlestickValues(item);
            const color = values.isUp ? upColor : downColor;

            const x = this.xScale(values.key);
            const yOpen = this.yScale(values.open);
            const yClose = this.yScale(values.close);
            const yHigh = this.yScale(values.high);
            const yLow = this.yScale(values.low);

            const bodyTop = Math.min(yOpen, yClose);
            const bodyHeight = Math.max(Math.abs(yOpen - yClose), 1);
            const midY = (yOpen + yClose) / 2;

            const body = createRect({
                id: `${values.key}-body`,
                fillStyle: color,
                x: x - candleWidth / 2,
                y: midY,
                width: candleWidth,
                height: 0,
                borderRadius: 1,
                data: {
                    fillStyle: color,
                    x: x - candleWidth / 2,
                    y: bodyTop,
                    width: candleWidth,
                    height: bodyHeight,
                    borderRadius: 1,
                } as RectState,
            });

            const wick = createLine({
                id: `${values.key}-wick`,
                strokeStyle: color,
                lineWidth: wickWidth,
                x1: x,
                y1: midY,
                x2: x,
                y2: midY,
                data: {
                    strokeStyle: color,
                    lineWidth: wickWidth,
                    x1: x,
                    y1: yHigh,
                    x2: x,
                    y2: yLow,
                } as LineState,
            });

            const group = createGroup({
                id: values.key,
                children: [wick, body],
            });

            body.on('mouseenter', () => {
                this.tooltip.show(
                    x,
                    bodyTop,
                    `O: ${values.open}  H: ${values.high}  L: ${values.low}  C: ${values.close}`
                );

                this.renderer.transition(body, {
                    duration: this.getAnimationDuration(200),
                    ease: easeOutQuart,
                    state: {
                        fillStyle: setColorAlpha(color, 0.8),
                    },
                });

                body.on('mouseleave', () => {
                    this.tooltip.hide();

                    this.renderer.transition(body, {
                        duration: this.getAnimationDuration(200),
                        ease: easeOutQuart,
                        state: {
                            fillStyle: color,
                        },
                    });
                });
            });

            return group;
        });

        const updateGroups = arrayMap(updates, ([item, group]) => {
            const values = this.getCandlestickValues(item);
            const color = values.isUp ? upColor : downColor;

            const x = this.xScale(values.key);
            const yOpen = this.yScale(values.open);
            const yClose = this.yScale(values.close);
            const yHigh = this.yScale(values.high);
            const yLow = this.yScale(values.low);

            const bodyTop = Math.min(yOpen, yClose);
            const bodyHeight = Math.max(Math.abs(yOpen - yClose), 1);

            const body = group.getElementsByType('rect')[0] as Rect;
            const wick = group.getElementsByType('line')[0] as Line;

            if (body) {
                body.data = {
                    fillStyle: color,
                    x: x - candleWidth / 2,
                    y: bodyTop,
                    width: candleWidth,
                    height: bodyHeight,
                    borderRadius: 1,
                } as RectState;

                body.on('mouseenter', () => {
                    this.tooltip.show(
                        x,
                        bodyTop,
                        `O: ${values.open}  H: ${values.high}  L: ${values.low}  C: ${values.close}`
                    );

                    this.renderer.transition(body, {
                        duration: this.getAnimationDuration(200),
                        ease: easeOutQuart,
                        state: {
                            fillStyle: setColorAlpha(color, 0.8),
                        },
                    });

                    body.on('mouseleave', () => {
                        this.tooltip.hide();

                        this.renderer.transition(body, {
                            duration: this.getAnimationDuration(200),
                            ease: easeOutQuart,
                            state: {
                                fillStyle: color,
                            },
                        });
                    });
                });
            }

            if (wick) {
                wick.data = {
                    strokeStyle: color,
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

        this.candlestickGroups = [
            ...entryGroups,
            ...updateGroups,
        ];

        const entryTransitions = arrayMap(entryGroups, (group, index) => {
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

        const updateTransitions = arrayMap(updateGroups, group => {
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

    private async drawVolume(
        chartLeft: number,
        chartRight: number,
        volumeTop: number,
        volumeBottom: number
    ) {
        const {
            data,
            volumeBy,
            upColor = DEFAULT_UP_COLOR,
            downColor = DEFAULT_DOWN_COLOR,
        } = this.options;

        if (!volumeBy) {
            return;
        }

        const barWidth = Math.max(1, ((chartRight - chartLeft) / data.length) * 0.6);

        const volumes = arrayMap(data, item => this.getAccessor<number>(volumeBy)(item));
        const volumeExtent = getExtent(volumes.concat(0), functionIdentity);

        this.volumeScale = scaleContinuous(volumeExtent, [volumeBottom, volumeTop]);

        if (this.volumeGroup) {
            const existingBars = this.volumeGroup.getElementsByType('rect') as Rect[];

            const {
                left: barEntries,
                inner: barUpdates,
                right: barExits,
            } = arrayJoin(
                data,
                existingBars,
                (item, bar) => bar.id === `vol-${this.getCandlestickValues(item).key}`
            );

            arrayForEach(barExits, bar => bar.destroy());

            arrayForEach(barEntries, item => {
                const values = this.getCandlestickValues(item);
                const color = values.isUp ? upColor : downColor;
                const x = this.xScale(values.key);
                const barHeight = Math.abs(volumeBottom - this.volumeScale(values.volume));

                const bar = createRect({
                    id: `vol-${values.key}`,
                    fillStyle: setColorAlpha(color, 0.3),
                    x: x - barWidth / 2,
                    y: volumeBottom,
                    width: barWidth,
                    height: 0,
                    data: {
                        fillStyle: setColorAlpha(color, 0.3),
                        x: x - barWidth / 2,
                        y: volumeBottom - barHeight,
                        width: barWidth,
                        height: barHeight,
                    } as RectState,
                });

                this.volumeGroup!.add(bar);
            });

            arrayForEach(barUpdates, ([item, bar]) => {
                const values = this.getCandlestickValues(item);
                const color = values.isUp ? upColor : downColor;
                const x = this.xScale(values.key);
                const barHeight = Math.abs(volumeBottom - this.volumeScale(values.volume));

                bar.data = {
                    fillStyle: setColorAlpha(color, 0.3),
                    x: x - barWidth / 2,
                    y: volumeBottom - barHeight,
                    width: barWidth,
                    height: barHeight,
                } as RectState;
            });

            const allBars = this.volumeGroup.getElementsByType('rect') as Rect[];

            return this.renderer.transition(allBars, (element, index, length) => ({
                duration: this.getAnimationDuration(800),
                delay: index * (this.getAnimationDuration(400) / Math.max(1, length)),
                ease: easeOutCubic,
                state: element.data as RectState,
            }));
        }

        this.volumeGroup = createGroup({
            id: 'volume',
            zIndex: -1,
        });

        const bars = arrayMap(data, item => {
            const values = this.getCandlestickValues(item);
            const color = values.isUp ? upColor : downColor;
            const x = this.xScale(values.key);
            const barHeight = Math.abs(volumeBottom - this.volumeScale(values.volume));

            return createRect({
                id: `vol-${values.key}`,
                fillStyle: setColorAlpha(color, 0.3),
                x: x - barWidth / 2,
                y: volumeBottom,
                width: barWidth,
                height: 0,
                data: {
                    fillStyle: setColorAlpha(color, 0.3),
                    x: x - barWidth / 2,
                    y: volumeBottom - barHeight,
                    width: barWidth,
                    height: barHeight,
                } as RectState,
            });
        });

        arrayForEach(bars, bar => this.volumeGroup!.add(bar));
        this.scene.add(this.volumeGroup);

        return this.renderer.transition(bars, (element, index, length) => ({
            duration: this.getAnimationDuration(800),
            delay: index * (this.getAnimationDuration(400) / Math.max(1, length)),
            ease: easeOutCubic,
            state: element.data as RectState,
        }));
    }

    public async render() {
        return super.render(async (scene) => {
            const {
                data,
                showVolume = true,
                volumeBy,
            } = this.options;

            const allValues = arrayMap(data, item => this.getCandlestickValues(item));

            const highs = arrayMap(allValues, v => v.high);
            const lows = arrayMap(allValues, v => v.low);
            const priceExtent = getExtent(highs.concat(lows), functionIdentity);

            const keys = arrayMap(allValues, v => v.key);

            const padding = this.getPadding();
            const chartTop = padding.top;

            const hasVolume = showVolume && !!volumeBy;
            const volumeHeight = hasVolume
                ? (scene.height - padding.top - padding.bottom) * VOLUME_HEIGHT_RATIO
                : 0;

            this.yScale = scaleContinuous(priceExtent, [scene.height - padding.bottom - volumeHeight, chartTop], {
                padToTicks: 10,
            });

            this.yAxis.scale = this.yScale;
            this.yAxis.bounds = new Box(
                chartTop,
                padding.left,
                scene.height - padding.bottom - volumeHeight,
                scene.width - padding.right
            );

            const yAxisBoundingBox = this.yAxis.getBoundingBox();

            // Build x scale as callable with metadata
            const xConvert = (value: string) => {
                const index = keys.indexOf(value);
                const rangeStart = yAxisBoundingBox.right + 20;
                const rangeEnd = scene.width - padding.right;
                return rangeStart + ((index + 0.5) / Math.max(1, keys.length)) * (rangeEnd - rangeStart);
            };

            const xInvert = (value: number) => {
                const rangeStart = yAxisBoundingBox.right + 20;
                const rangeEnd = scene.width - padding.right;
                const index = Math.round(((value - rangeStart) / (rangeEnd - rangeStart)) * keys.length - 0.5);
                return keys[Math.max(0, Math.min(keys.length - 1, index))];
            };

            this.xScale = Object.assign(
                (value: string) => xConvert(value),
                {
                    domain: keys,
                    range: [yAxisBoundingBox.right + 20, scene.width - padding.right] as number[],
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

            this.xAxis.scale = this.xScale;
            this.xAxis.bounds = new Box(
                chartTop,
                yAxisBoundingBox.right,
                scene.height - padding.bottom - volumeHeight,
                scene.width - padding.right
            );

            const xAxisBoundingBox = this.xAxis.getBoundingBox();

            // Recalculate y scale with final chart area
            this.yScale = scaleContinuous(priceExtent, [xAxisBoundingBox.top, chartTop], {
                padToTicks: 10,
            });

            this.yAxis.scale = this.yScale;
            this.yAxis.bounds.bottom = xAxisBoundingBox.top;

            const chartLeft = yAxisBoundingBox.right + 20;
            const chartRight = scene.width - padding.right;

            // Render grid
            if (this.grid) {
                const yTicks = this.yScale.ticks(10);
                const yTickPositions = arrayMap(yTicks, tick => this.yScale(tick));

                this.grid.render(
                    [],
                    yTickPositions,
                    yAxisBoundingBox.right,
                    chartTop,
                    scene.width - padding.right - yAxisBoundingBox.right,
                    xAxisBoundingBox.top - chartTop
                );
            }

            // Setup crosshair
            if (this.crosshair) {
                this.crosshair.setup(
                    yAxisBoundingBox.right,
                    chartTop,
                    scene.width - padding.right - yAxisBoundingBox.right,
                    xAxisBoundingBox.top - chartTop
                );

                this.crosshairDisposables.forEach(d => d.dispose());
                this.crosshairDisposables = [
                    this.scene.on('mousemove', (event) => {
                        const { x, y } = event.data;
                        this.crosshair?.show(x, y);
                    }),
                    this.scene.on('mouseleave', () => {
                        this.crosshair?.hide();
                    }),
                ];
            }

            // Volume area sits below the x axis
            const volumeTop = xAxisBoundingBox.bottom + 5;
            const volumeBottom = scene.height - padding.bottom;

            const promises: Promise<unknown>[] = [
                this.xAxis.render(),
                this.yAxis.render(),
                this.drawCandlesticks(chartLeft, chartRight),
            ];

            if (hasVolume) {
                promises.push(this.drawVolume(chartLeft, chartRight, volumeTop, volumeBottom));
            }

            return Promise.all(promises);
        });
    }

}

export function createStockChart<TData = unknown>(target: string | HTMLElement | Context, options: StockChartOptions<TData>) {
    return new StockChart<TData>(target, options);
}
