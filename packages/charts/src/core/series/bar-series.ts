/**
 * Bar series renderer: draws each series as rectangles, grouped side by side or stacked.
 *
 * Extracted from the bar chart so the standalone {@link BarChart} and the mixed trend chart share one
 * implementation — including vertical/horizontal orientation, grouped and stacked modes, the
 * outermost-segment rounding, and the stacked single-rising-fill entry timing.
 */

import {
    SeriesRenderer,
} from './base';

import type {
    SeriesLabelBatch,
} from './base';

import type {
    BarSeriesContext,
    BarSeriesLike,
} from './context';

import {
    ANIMATION_REFERENCE,
    exitElement,
    stagger,
} from '../animation';

import type {
    ResolvedAnimation,
} from '../animation';

import {
    createDataLabel,
} from '../labels';

import type {
    DataLabelSpec,
} from '../labels';

import {
    applyHoverHighlight,
} from '../interaction';

import {
    computeStackOffset,
    resolveAccessor,
} from '../data';

import type {
    BandScale,
    BorderRadius,
    Group,
    Rect,
    RectState,
    Scale,
} from '@ripl/core';

import {
    createGroup,
    createRect,
    queryAll,
    scaleBand,
    setColorAlpha,
} from '@ripl/core';

import {
    arrayJoin,
    typeIsFunction,
} from '@ripl/utilities';

/** The opacity applied to a bar's fill at rest (full opacity is used on hover). */
const REST_ALPHA = 0.78;

/** The geometry of a single bar: its element id, value, and rect state. */
interface BarState {
    id: string;
    value: number;
    state: RectState;
}

/** Entry timing for one stacked segment, so the column reveals as a single rising fill. */
interface EntryTiming {
    delayFraction: number;
    durationFraction: number;
    columnIndex: number;
}

/** Per-render precompute for the bar renderer. */
interface BarPrepared<TData> {
    series: BarSeriesLike<TData>[];
    horizontal: boolean;
    stacked: boolean;
    cornerRadius: number;
    /** Grouping sub-scale (offsets each series within a category slot); undefined when stacked. */
    seriesScale?: BandScale<string>;
    /** Category key → its index in the data (column order). */
    keyIndex: Map<string, number>;
    /** Per-column positive/negative totals, for stacked rounding and entry timing. */
    columnTotals: Map<string, { pos: number;
        neg: number; }>;
    /** Entry timing per stacked segment id, populated as bars are built. */
    entryTiming: Map<string, EntryTiming>;
}

/** Renders bar series (grouped or stacked rectangles) for a host chart. */
export class BarSeriesRenderer<TData> extends SeriesRenderer<BarSeriesLike<TData>, TData, BarSeriesContext<TData>, BarPrepared<TData>> {

    private _seriesValue(series: BarSeriesLike<TData>, item: TData): number {
        return resolveAccessor<TData, number>(series.value)(item);
    }

    private _seriesLabel(series: BarSeriesLike<TData>, item: TData): string {
        return typeIsFunction(series.label) ? series.label(item) : series.label;
    }

    // The value scale a series renders against — its bound axis's scale in multi-axis charts.
    private _valueScale(series: BarSeriesLike<TData>, ctx: BarSeriesContext<TData>): Scale {
        return ctx.resolveScale?.(series) ?? ctx.valueScale;
    }

    private _stackOffset(prepared: BarPrepared<TData>, current: BarSeriesLike<TData>, item: TData): number {
        if (!prepared.stacked) {
            return 0;
        }

        return computeStackOffset(prepared.series, current, item, (srs, dataItem) => this._seriesValue(srs, dataItem));
    }

    /** The index of the last same-sign series contributing to a column (its outermost segment). */
    private _outermostStackIndex(item: TData, positive: boolean, prepared: BarPrepared<TData>): number {
        let outer = -1;

        prepared.series.forEach((srs, index) => {
            const value = this._seriesValue(srs, item);

            if (value === 0) {
                return;
            }

            if ((value >= 0) === positive) {
                outer = index;
            }
        });

        return outer;
    }

    private _stackedBorderRadius(series: BarSeriesLike<TData>, item: TData, value: number, prepared: BarPrepared<TData>): number | BorderRadius {
        const positive = value >= 0;
        const { cornerRadius, horizontal } = prepared;

        if (prepared.series.indexOf(series) !== this._outermostStackIndex(item, positive, prepared)) {
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
    }

    private _getBarState(series: BarSeriesLike<TData>, item: TData, ctx: BarSeriesContext<TData>, prepared: BarPrepared<TData>): BarState {
        const { categoryScale } = ctx;
        const { horizontal, stacked, cornerRadius, seriesScale } = prepared;
        const valueScale = this._valueScale(series, ctx);
        const baseline = valueScale(0);
        const value = this._seriesValue(series, item);
        const key = ctx.getKey(item);
        const color = ctx.getColor(series.id);
        const stackOffset = this._stackOffset(prepared, series, item);

        let x: number;
        let y: number;
        let width: number;
        let height: number;

        if (horizontal) {
            if (stacked) {
                y = categoryScale(key);
                height = categoryScale.bandwidth;
                x = valueScale(value >= 0 ? stackOffset : value + stackOffset);
                width = Math.abs(valueScale(0) - valueScale(Math.abs(value)));
            } else {
                y = categoryScale(key) + (seriesScale ? seriesScale(series.id) : 0);
                height = seriesScale ? seriesScale.bandwidth : categoryScale.bandwidth;
                x = Math.min(baseline, valueScale(value));
                width = Math.abs(valueScale(value) - baseline);
            }
        } else if (stacked) {
            x = categoryScale(key);
            width = categoryScale.bandwidth;
            y = valueScale(value >= 0 ? value + stackOffset : stackOffset);
            height = Math.abs(valueScale(0) - valueScale(Math.abs(value)));
        } else {
            x = categoryScale(key) + (seriesScale ? seriesScale(series.id) : 0);
            width = seriesScale ? seriesScale.bandwidth : categoryScale.bandwidth;
            y = valueScale(Math.max(0, value));
            height = Math.abs(baseline - valueScale(value));
        }

        const borderRadius = stacked ? this._stackedBorderRadius(series, item, value, prepared) : cornerRadius;

        if (stacked) {
            const totals = prepared.columnTotals.get(key);
            const columnTotal = value >= 0 ? (totals?.pos ?? 0) : (totals?.neg ?? 0);

            prepared.entryTiming.set(`${series.id}-${key}`, {
                delayFraction: columnTotal > 0 ? Math.abs(stackOffset) / columnTotal : 0,
                durationFraction: columnTotal > 0 ? Math.abs(value) / columnTotal : 1,
                columnIndex: prepared.keyIndex.get(key) ?? 0,
            });
        }

        return {
            id: `${series.id}-${key}`,
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
    }

    private _anchorFor(state: RectState, prepared: BarPrepared<TData>): () => { x: number;
        y: number; } {
        return () => (prepared.horizontal
            ? {
                x: state.x + state.width,
                y: state.y + state.height / 2,
            }
            : {
                x: state.x + state.width / 2,
                y: state.y,
            });
    }

    /** The collapsed geometry an entering/exiting bar grows from (the chart baseline). */
    private _collapsed(series: BarSeriesLike<TData> | undefined, ctx: BarSeriesContext<TData>, prepared: BarPrepared<TData>): Partial<RectState> {
        // A removed series (exitSeries) can no longer resolve its axis binding — collapse to the
        // primary scale's baseline.
        const baseline = (series ? this._valueScale(series, ctx) : ctx.valueScale)(0);

        return prepared.horizontal
            ? {
                x: baseline,
                width: 0,
            }
            : {
                y: baseline,
                height: 0,
            };
    }

    /** A stacked segment collapses to its own lower edge so the column reveals as one rising fill. */
    private _collapsedEntry(series: BarSeriesLike<TData>, item: TData, ctx: BarSeriesContext<TData>, prepared: BarPrepared<TData>): Partial<RectState> {
        if (!prepared.stacked) {
            return this._collapsed(series, ctx, prepared);
        }

        const stackOffset = this._stackOffset(prepared, series, item);
        const valueScale = this._valueScale(series, ctx);

        return prepared.horizontal
            ? {
                x: valueScale(stackOffset),
                width: 0,
            }
            : {
                y: valueScale(stackOffset),
                height: 0,
            };
    }

    private _attachHover(bar: Rect, series: BarSeriesLike<TData>, item: TData, key: string, value: number, anchor: () => { x: number;
        y: number; }, ctx: BarSeriesContext<TData>): void {
        const restFill = bar.fill as string;

        const payload = (point: { x: number;
            y: number; }) => ({
            x: point.x,
            y: point.y,
            xValue: key,
            yValue: value,
            seriesId: series.id,
        });

        applyHoverHighlight(bar, {
            renderer: ctx.renderer,
            animation: () => ctx.resolveAnimation(ANIMATION_REFERENCE.hover),
            tooltip: ctx.tooltip,
            anchor,
            content: () => `${this._seriesLabel(series, item)}: ${ctx.formatValue(value)}`,
            highlight: { fill: setColorAlpha(restFill, 1) },
            restore: { fill: restFill },
            onEnter: point => ctx.emit('enter', payload(point)),
            onLeave: point => ctx.emit('leave', payload(point)),
            onClick: point => ctx.emit('click', payload(point)),
        });
    }

    private _createBar(series: BarSeriesLike<TData>, item: TData, ctx: BarSeriesContext<TData>, prepared: BarPrepared<TData>): Rect {
        const { id, value, state } = this._getBarState(series, item, ctx, prepared);
        const restFill = setColorAlpha(state.fill as string, REST_ALPHA);

        const bar = createRect({
            id,
            ...state,
            ...this._collapsedEntry(series, item, ctx, prepared),
            fill: restFill,
            data: {
                ...state,
                fill: restFill,
            },
        });

        this._attachHover(bar, series, item, ctx.getKey(item), value, this._anchorFor(state, prepared), ctx);

        return bar;
    }

    private _labelSpec(series: BarSeriesLike<TData>, item: TData, ctx: BarSeriesContext<TData>, prepared: BarPrepared<TData>): DataLabelSpec {
        const { id, value, state } = this._getBarState(series, item, ctx, prepared);
        const point = this._anchorFor(state, prepared)();

        return {
            id: `${id}-label`,
            x: point.x,
            y: point.y,
            anchor: ctx.dataLabels.anchor,
            content: ctx.formatValue(value),
            font: ctx.dataLabels.font,
            fill: ctx.dataLabels.fontColor,
        };
    }

    protected prepare(series: BarSeriesLike<TData>[], ctx: BarSeriesContext<TData>): BarPrepared<TData> {
        const horizontal = ctx.orientation === 'horizontal';
        const stacked = ctx.stacked;

        const seriesScale = stacked
            ? undefined
            : scaleBand(series.map(srs => srs.id), [0, ctx.categoryScale.bandwidth], { innerPadding: 0.1 });

        const keyIndex = new Map<string, number>(ctx.data.map((item, index) => [ctx.getKey(item), index]));
        const columnTotals = new Map<string, { pos: number;
            neg: number; }>();

        ctx.data.forEach(item => {
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

            columnTotals.set(ctx.getKey(item), {
                pos,
                neg,
            });
        });

        return {
            series,
            horizontal,
            stacked,
            cornerRadius: ctx.borderRadius,
            seriesScale,
            keyIndex,
            columnTotals,
            entryTiming: new Map(),
        };
    }

    protected buildSeriesGroup(series: BarSeriesLike<TData>, ctx: BarSeriesContext<TData>, prepared: BarPrepared<TData>): Group {
        return createGroup({
            id: series.id,
            children: [
                ...ctx.data.map(item => this._createBar(series, item, ctx, prepared)),
                ...(ctx.dataLabels.visible ? ctx.data.map(item => createDataLabel(this._labelSpec(series, item, ctx, prepared))) : []),
            ],
        });
    }

    protected updateSeriesGroup(series: BarSeriesLike<TData>, group: Group, ctx: BarSeriesContext<TData>, prepared: BarPrepared<TData>, batch: SeriesLabelBatch): Group {
        const bars = group.getElementsByType('rect') as Rect[];
        const exitAnimation = ctx.resolveAnimation(ANIMATION_REFERENCE.exit);

        const {
            left: barEntries,
            inner: barUpdates,
            right: barExits,
        } = arrayJoin(ctx.data, bars, (item, bar) => bar.id === `${series.id}-${ctx.getKey(item)}`);

        barExits.forEach(bar => exitElement(ctx.renderer, bar, exitAnimation, {
            ...this._collapsed(series, ctx, prepared),
            opacity: 0,
        }));

        barEntries.forEach(item => group.add(this._createBar(series, item, ctx, prepared)));

        barUpdates.forEach(([item, bar]) => {
            const { value, state } = this._getBarState(series, item, ctx, prepared);
            const restFill = setColorAlpha(state.fill as string, REST_ALPHA);

            bar.data = {
                ...state,
                fill: restFill,
            };

            this._attachHover(bar, series, item, ctx.getKey(item), value, this._anchorFor(state, prepared), ctx);
        });

        this.reconcileLabels(
            group,
            ctx,
            exitAnimation,
            item => `${series.id}-${ctx.getKey(item)}-label`,
            item => this._labelSpec(series, item, ctx, prepared),
            batch
        );

        return group;
    }

    protected exitSeries(group: Group, ctx: BarSeriesContext<TData>, exitAnimation: ResolvedAnimation, prepared: BarPrepared<TData>): void {
        const exits = (group.getElementsByType('rect') as Rect[]).map(bar => exitElement(ctx.renderer, bar, exitAnimation, {
            ...this._collapsed(undefined, ctx, prepared),
            opacity: 0,
        }));

        void Promise.all(exits).then(() => group.destroy());
    }

    protected entryTransitions(groups: Group[], ctx: BarSeriesContext<TData>, enter: ResolvedAnimation, prepared: BarPrepared<TData>): Promise<unknown>[] {
        const bars = (queryAll(groups, 'rect') as Rect[])
            .sort((a, b) => (prepared.horizontal ? a.y - b.y : a.x - b.x));

        const categoryCount = Math.max(1, prepared.keyIndex.size);

        return [
            ctx.renderer.transition(bars, (element, index, length) => {
                // Stacked: each column fills as one rising unit — segments are timed by their position
                // in the stack so the fill front sweeps the whole column once, in colour order.
                if (prepared.stacked) {
                    const timing = prepared.entryTiming.get(element.id);
                    const columnDelay = stagger(timing?.columnIndex ?? 0, categoryCount, enter.duration) * 0.4;

                    return {
                        duration: Math.max((timing?.durationFraction ?? 1) * enter.duration, 80),
                        delay: columnDelay + (timing?.delayFraction ?? 0) * enter.duration,
                        ease: enter.ease,
                        state: element.data as RectState,
                    };
                }

                return {
                    duration: enter.duration,
                    delay: stagger(index, length, enter.duration),
                    ease: enter.ease,
                    state: element.data as RectState,
                };
            }),
        ];
    }

    protected updateTransitions(groups: Group[], ctx: BarSeriesContext<TData>, update: ResolvedAnimation): Promise<unknown>[] {
        return [
            ctx.renderer.transition(queryAll(groups, 'rect') as Rect[], element => ({
                duration: update.duration,
                ease: update.ease,
                state: element.data as RectState,
            })),
        ];
    }

}
