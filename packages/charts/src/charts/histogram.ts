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
    ValueFormatInput,
} from '../core/options';

import {
    resolveValueFormat,
} from '../core/options';

import {
    ANIMATION_REFERENCE,
    exitElement,
    stagger,
    transitionIfAny,
} from '../core/animation';

import {
    applyHoverHighlight,
} from '../core/interaction';

import {
    resolveAccessor,
} from '../core/data';

import {
    bin,
} from '../core/statistics';

import type {
    Bin,
} from '../core/statistics';

import type {
    Context,
    EventMap,
    Rect,
    RectState,
} from '@ripl/core';

import {
    createRect,
    easeOutCubic,
    scaleContinuous,
    setColorAlpha,
} from '@ripl/core';

import {
    arrayJoin,
} from '@ripl/utilities';

/** The opacity applied to a bin's fill at rest (full opacity on hover). */
const BIN_REST_ALPHA = 0.78;

/** Options for configuring a {@link HistogramChart}. */
export interface HistogramChartOptions<TData = unknown> extends CartesianChartOptions<TData> {
    /** The dataset whose values are binned into the histogram. */
    data: TData[];
    /** The numeric field (or accessor) to bin. */
    value: NumericAccessor<TData>;
    /** Target number of bins (ignored when `thresholds` is given). Defaults to Sturges' rule. */
    bins?: number;
    /** Explicit bin boundaries; overrides `bins`. */
    thresholds?: number[];
    /** Bar color (defaults to the first palette color). */
    color?: string;
    /** Corner radius in pixels applied to the top of each bar. Defaults to 2. */
    borderRadius?: number;
    /** Format applied to bin bounds shown in tooltips. */
    format?: ValueFormatInput;
}

/** Payload emitted for histogram bin interaction events. */
export interface HistogramBinEvent {
    /** The x coordinate (in chart pixels) of the bar's top-center anchor. */
    x: number;
    /** The y coordinate (in chart pixels) of the bar's top-center anchor. */
    y: number;
    /** The lower bound of the interacted bin. */
    x0: number;
    /** The upper bound of the interacted bin. */
    x1: number;
    /** The number of values that fall in the interacted bin. */
    count: number;
}

/** Events emitted by a {@link HistogramChart} that consumers can subscribe to via `chart.on(...)`. */
export interface HistogramChartEventMap extends EventMap {
    /** Emitted when a bin bar is clicked. */
    binclick: HistogramBinEvent;
    /** Emitted when the pointer enters a bin bar. */
    binenter: HistogramBinEvent;
    /** Emitted when the pointer leaves a bin bar. */
    binleave: HistogramBinEvent;
}

/**
 * Histogram chart: bins a numeric field with the shared {@link bin} transform and draws each bin as a
 * bar on a continuous value axis against a frequency axis. Supports animated entry/update/exit,
 * tooltips, grid, and a chart title.
 *
 * @typeParam TData - The type of each data item in the dataset.
 */
export class HistogramChart<TData = unknown> extends CartesianChart<HistogramChartOptions<TData>, TData, HistogramChartEventMap> {

    private _bars: Rect[] = [];

    /** The event types a histogram can emit. */
    public get $events(): (keyof HistogramChartEventMap)[] {
        return [
            'binclick',
            'binenter',
            'binleave',
        ];
    }

    constructor(target: string | HTMLElement | Context, options: HistogramChartOptions<TData>) {
        super(target, options);

        this.setupCartesian({
            grid: {
                horizontal: true,
                vertical: false,
            },
            crosshair: true,
        });

        this.init();
    }

    /** Wires hover highlight + tooltip + interaction events onto a bin bar. */
    private _attachBinHover(rect: Rect, current: Bin): void {
        const restFill = rect.fill as string;
        const formatValue = resolveValueFormat(this.options.format);

        const payload = (point: {
            x: number;
            y: number;
        }): HistogramBinEvent => ({
            x: point.x,
            y: point.y,
            x0: current.x0,
            x1: current.x1,
            count: current.count,
        });

        applyHoverHighlight(rect, {
            renderer: this.renderer,
            animation: () => this.resolveAnimation(ANIMATION_REFERENCE.hover),
            tooltip: this.tooltip,
            anchor: () => ({
                x: rect.x + rect.width / 2,
                y: rect.y,
            }),
            content: () => `${formatValue(current.x0)} – ${formatValue(current.x1)}: ${current.count}`,
            highlight: {
                fill: setColorAlpha(restFill, 1),
            },
            restore: {
                fill: restFill,
            },
            onEnter: point => this.emit('binenter', payload(point)),
            onLeave: point => this.emit('binleave', payload(point)),
            onClick: point => this.emit('binclick', payload(point)),
        });
    }

    public async render() {
        return super.render(async () => {
            const {
                data,
                value,
                bins: binCount,
                thresholds,
            } = this.options;

            this.resolveSeriesColors([
                {
                    id: 'histogram',
                    color: this.options.color,
                },
            ]);
            this.prepareAxes();

            const getValue = resolveAccessor<TData, number>(value);
            const histogram = bin(data.map(getValue), {
                bins: binCount,
                thresholds,
            });

            const color = setColorAlpha(this.getSeriesColor('histogram'), BIN_REST_ALPHA);
            const maxCount = Math.max(1, ...histogram.map(current => current.count));
            const valueExtent: [number, number] = histogram.length
                ? [histogram[0].x0, histogram[histogram.length - 1].x1]
                : [0, 1];

            const layout = this.createLayout();
            this.reserveTitle(layout);

            const area = layout.area;

            let countScale!: ReturnType<typeof scaleContinuous>;
            let valueScale!: ReturnType<typeof scaleContinuous>;

            const plot = this.resolveCartesianPlot(area, candidate => {
                countScale = scaleContinuous([0, maxCount], [candidate.y + candidate.height, candidate.y], {
                    nice: true,
                });

                this.yAxis.scale = countScale;

                valueScale = scaleContinuous(valueExtent, [candidate.x, candidate.x + candidate.width]);
                this.xAxis.scale = valueScale;
            });

            const viewedValueScale = this.applyView(valueScale, 'x');
            const viewedCountScale = this.applyView(countScale, 'y');
            this.xAxis.scale = viewedValueScale;
            this.yAxis.scale = viewedCountScale;

            this.clipPlot(plot);

            this.renderGrid(
                [],
                this.gridTicks(viewedCountScale, 10),
                plot
            );

            this.setupCrosshair(plot);

            return Promise.all([
                this.xAxis.visible ? this.xAxis.render() : this.xAxis.hide(),
                this.yAxis.visible ? this.yAxis.render() : this.yAxis.hide(),
                this._drawBins(histogram, viewedValueScale, viewedCountScale, color),
            ]);
        });
    }

    private async _drawBins(
        histogram: Bin[],
        valueScale: ReturnType<typeof scaleContinuous>,
        countScale: ReturnType<typeof scaleContinuous>,
        color: string
    ) {
        const baseline = countScale(0);
        const cornerRadius = this.options.borderRadius ?? 2;
        const gap = 1;

        const targetState = (current: Bin): RectState => {
            const x0 = valueScale(current.x0);
            const x1 = valueScale(current.x1);
            const y = countScale(current.count);

            return {
                fill: color,
                x: x0 + gap / 2,
                y,
                width: Math.max(0, x1 - x0 - gap),
                height: baseline - y,
                borderRadius: [cornerRadius, cornerRadius, 0, 0],
            } as RectState;
        };

        const items = histogram.map((current, index) => ({
            id: `bin-${index}`,
            bin: current,
        }));

        const {
            left: entries,
            inner: updates,
            right: exits,
        } = arrayJoin(items, this._bars, (item, rect) => rect.id === item.id);

        const exitAnimation = this.resolveAnimation(ANIMATION_REFERENCE.exit);

        exits.forEach(rect => {
            void exitElement(this.renderer, rect, exitAnimation, {
                y: baseline,
                height: 0,
                opacity: 0,
            }).then(() => rect.destroy());
        });

        const entryRects = entries.map(item => {
            const state = targetState(item.bin);

            const rect = createRect({
                id: item.id,
                ...state,
                y: baseline,
                height: 0,
                data: state,
            });

            this._attachBinHover(rect, item.bin);
            this.addPlotContent(rect);

            return rect;
        });

        updates.forEach(([item, rect]) => {
            rect.data = targetState(item.bin);
        });

        this._bars = [
            ...entryRects,
            ...updates.map(([, rect]) => rect),
        ];

        const enter = this.resolveAnimation(ANIMATION_REFERENCE.enter);
        const update = this.resolveAnimation(ANIMATION_REFERENCE.update);

        const entriesTransition = transitionIfAny(this.renderer, entryRects, (element, index, length) => ({
            duration: enter.duration,
            delay: stagger(index, length, enter.duration),
            ease: easeOutCubic,
            state: element.data as RectState,
        }));

        const updatesTransition = transitionIfAny(this.renderer, updates.map(([, rect]) => rect), element => ({
            duration: update.duration,
            ease: update.ease,
            state: element.data as Partial<RectState>,
        }));

        return Promise.all([
            entriesTransition,
            updatesTransition,
        ]);
    }

}

/**
 * Factory function that creates a new {@link HistogramChart}.
 *
 * @example
 * ```ts
 * createHistogramChart(target, {
 *     data: [{ v: 1 }, { v: 2 }, { v: 2 }, { v: 5 }, { v: 8 }],
 *     value: 'v',
 *     bins: 5,
 * });
 * ```
 */
export function createHistogramChart<TData = unknown>(target: string | HTMLElement | Context, options: HistogramChartOptions<TData>) {
    return new HistogramChart<TData>(target, options);
}
