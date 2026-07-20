/**
 * Area series renderer: draws each series as a filled band beneath a line with optional markers.
 *
 * Extracted from the area chart so the standalone {@link AreaChart} and the mixed trend chart share
 * one implementation — including cumulative stacking, the left→right fill reveal on entry, the
 * key-reconciled top/bottom morph, and the largest-at-back paint ordering that keeps small areas
 * from hiding behind large ones.
 */

import {
    SeriesRenderer,
} from './base';

import type {
    SeriesLabelBatch,
} from './base';

import type {
    AreaSeriesContext,
    AreaSeriesLike,
} from './context';

import {
    ANIMATION_REFERENCE,
    exitElement,
} from '../animation';

import type {
    ResolvedAnimation,
} from '../animation';

import {
    resolveLineDash,
} from '../options';

import {
    createDataLabel,
} from '../labels';

import type {
    DataLabelSpec,
} from '../labels';

import {
    correspondence,
    keysDiffer,
} from '../morph';

import {
    resolveAccessor,
} from '../data';

import {
    areaBandRenderer,
} from '../fill';

import type {
    Circle,
    CircleState,
    Group,
    Interpolator,
    Point,
    Polyline,
    PolylineState,
    Scale,
} from '@ripl/core';

import {
    createCircle,
    createGroup,
    createPolyline,
    interpolatePath,
    interpolatePoints,
    interpolateWaypoint,
    setColorAlpha,
} from '@ripl/core';

import {
    arrayJoin,
    numberClamp,
    numberSum,
    typeIsFunction,
} from '@ripl/utilities';

/** The top/bottom boundary points of an area band. */
interface AreaPoints {
    linePoints: Point[];
    bottomPoints: Point[];
    areaPoints: Point[];
}

/** Per-render precompute for the area renderer. */
interface AreaPrepared<TData> {
    /** The plotted (cumulative when stacked) value for a series at a data item. */
    getSeriesValue: (series: AreaSeriesLike<TData>, item: TData, dataIndex: number) => number;
    /** The lower boundary value for a series at a data item (previous cumulative, or 0). */
    getPrevSeriesValue: (series: AreaSeriesLike<TData>, dataIndex: number) => number;
    /** Top/bottom boundaries per entering series, driving the left→right reveal. */
    entryReveal: Map<string, { linePoints: Point[];
        bottomPoints: Point[]; }>;
    /** Paint rank per series id (0 = backmost); largest area at the back when unstacked. */
    orderRank: Map<string, number>;
}

/**
 * Builds an interpolator that reveals a filled area band left→right, growing a closed polygon from
 * the left edge to a moving front along the real top and lower boundaries — a true wipe, not a
 * horizontal stretch.
 */
function interpolateAreaReveal(top: Point[], bottom: Point[]): Interpolator<Point[]> {
    const lastIndex = top.length - 1;
    const topAt = interpolateWaypoint(top);
    const bottomAt = interpolateWaypoint(bottom);

    return position => {
        if (position >= 1) {
            return [
                ...top,
                ...bottom.slice().reverse(),
            ];
        }

        const count = Math.ceil(lastIndex * position);
        const revealedTop = top.slice(0, count).concat([topAt(position)]);
        const revealedBottom = bottom.slice(0, count).concat([bottomAt(position)]);

        return [
            ...revealedTop,
            ...revealedBottom.reverse(),
        ];
    };
}

/** Renders area series (filled band + line + markers) for a host chart. */
export class AreaSeriesRenderer<TData> extends SeriesRenderer<AreaSeriesLike<TData>, TData, AreaSeriesContext<TData>, AreaPrepared<TData>> {

    /** Previous ordered data keys per series, used to key-reconcile the line/fill morph across add/remove. */
    private _morphKeys = new Map<string, string[]>();

    private _rawValue(series: AreaSeriesLike<TData>, item: TData): number {
        return resolveAccessor<TData, number>(series.value)(item);
    }

    private _seriesLabel(series: AreaSeriesLike<TData>, item: TData): string {
        return typeIsFunction(series.label) ? series.label(item) : series.label;
    }

    // The value scale a series renders against — its bound axis's scale in multi-axis charts.
    private _valueScale(series: AreaSeriesLike<TData>, ctx: AreaSeriesContext<TData>): Scale {
        return ctx.resolveScale?.(series) ?? ctx.yScale;
    }

    private _buildPoints(series: AreaSeriesLike<TData>, ctx: AreaSeriesContext<TData>, prepared: AreaPrepared<TData>): AreaPoints {
        const linePoints: Point[] = [];
        const bottomPoints: Point[] = [];
        const scale = this._valueScale(series, ctx);
        // Per-series baseline so a series bound to a secondary axis fills to its own axis's zero.
        const baseline = scale(0);

        ctx.data.forEach((item, dataIndex) => {
            const x = ctx.xScale(ctx.getKey(item));
            const y = scale(prepared.getSeriesValue(series, item, dataIndex));
            // Lower boundary: the previous series' cumulative top when stacked, else the baseline.
            const bottomY = ctx.stacked ? scale(prepared.getPrevSeriesValue(series, dataIndex)) : baseline;

            linePoints.push([x, y]);
            bottomPoints.push([x, bottomY]);
        });

        return {
            linePoints,
            bottomPoints,
            // Closed band polygon: top edge left→right, then the lower boundary right→left.
            areaPoints: [
                ...linePoints,
                ...bottomPoints.slice().reverse(),
            ],
        };
    }

    private _buildMarker(series: AreaSeriesLike<TData>, item: TData, dataIndex: number, ctx: AreaSeriesContext<TData>, prepared: AreaPrepared<TData>): Circle {
        const color = ctx.getColor(series.id);
        const key = ctx.getKey(item);
        const x = ctx.xScale(key);
        const y = this._valueScale(series, ctx)(prepared.getSeriesValue(series, item, dataIndex));

        const state: CircleState = {
            fill: '#FFFFFF',
            stroke: color,
            lineWidth: 2,
            cx: x,
            cy: y,
            radius: 3,
        };

        const marker = createCircle({
            id: `${series.id}-marker-${key}`,
            ...state,
            radius: 0,
            data: state,
        });

        this.attachMarkerHover(marker, ctx, {
            seriesId: series.id,
            key,
            value: this._rawValue(series, item),
            label: this._seriesLabel(series, item),
            radius: 3,
            highlightColor: color,
        });

        return marker;
    }

    private _labelSpec(series: AreaSeriesLike<TData>, item: TData, dataIndex: number, ctx: AreaSeriesContext<TData>, prepared: AreaPrepared<TData>): DataLabelSpec {
        const key = ctx.getKey(item);

        return {
            id: `${series.id}-marker-${key}-label`,
            x: ctx.xScale(key),
            y: this._valueScale(series, ctx)(prepared.getSeriesValue(series, item, dataIndex)),
            anchor: ctx.dataLabels.anchor,
            content: ctx.formatValue(this._rawValue(series, item)),
            font: ctx.dataLabels.font,
            fill: ctx.dataLabels.fontColor,
            offset: 7,
        };
    }

    protected prepare(series: AreaSeriesLike<TData>[], ctx: AreaSeriesContext<TData>): AreaPrepared<TData> {
        const { data } = ctx;
        // Per-series cumulative top and its lower boundary, so a stacked series fills from the top of
        // the previous same-group series. Cumulation resets per value-scale group (series bound to
        // different y-axes stack independently); single-axis charts share one group, so the behaviour
        // is unchanged.
        const stackedTop: number[][] = [];
        const stackedBottom: number[][] = [];

        if (ctx.stacked) {
            data.forEach((item, dataIndex) => {
                stackedTop[dataIndex] = [];
                stackedBottom[dataIndex] = [];

                const groupCumulative = new Map<unknown, number>();

                series.forEach((srs, seriesIndex) => {
                    const groupKey = ctx.resolveScale?.(srs) ?? ctx.yScale;
                    const prev = groupCumulative.get(groupKey) ?? 0;
                    const top = prev + this._rawValue(srs, item);

                    groupCumulative.set(groupKey, top);
                    stackedTop[dataIndex][seriesIndex] = top;
                    stackedBottom[dataIndex][seriesIndex] = prev;
                });
            });
        }

        const getSeriesValue = (srs: AreaSeriesLike<TData>, item: TData, dataIndex: number) => {
            const raw = this._rawValue(srs, item);
            const seriesIndex = series.indexOf(srs);

            if (ctx.stacked && seriesIndex >= 0) {
                return stackedTop[dataIndex]?.[seriesIndex] ?? raw;
            }

            return raw;
        };

        const getPrevSeriesValue = (srs: AreaSeriesLike<TData>, dataIndex: number) => {
            const seriesIndex = series.indexOf(srs);

            if (ctx.stacked && seriesIndex >= 0) {
                return stackedBottom[dataIndex]?.[seriesIndex] ?? 0;
            }

            return 0;
        };

        return {
            getSeriesValue,
            getPrevSeriesValue,
            entryReveal: new Map(),
            orderRank: this._computeOrderRank(series, ctx),
        };
    }

    /** Ranks series for paint order: stacked keeps stack order, unstacked sorts largest→smallest (back→front). */
    private _computeOrderRank(series: AreaSeriesLike<TData>[], ctx: AreaSeriesContext<TData>): Map<string, number> {
        const rank = new Map<string, number>();

        if (ctx.stacked) {
            series.forEach((srs, index) => rank.set(srs.id, index));
            return rank;
        }

        const sized = series.map((srs, index) => ({
            id: srs.id,
            index,
            size: numberSum(ctx.data, item => Math.abs(this._rawValue(srs, item))),
        }));

        // Largest first; ties keep the original series order (stable).
        sized.sort((a, b) => b.size - a.size || a.index - b.index);
        sized.forEach((entry, index) => rank.set(entry.id, index));

        return rank;
    }

    protected buildSeriesGroup(series: AreaSeriesLike<TData>, ctx: AreaSeriesContext<TData>, prepared: AreaPrepared<TData>): Group {
        const color = ctx.getColor(series.id);
        const opacity = series.fillOpacity ?? 0.3;
        const showMarkers = series.markers !== false;
        const { linePoints, bottomPoints, areaPoints } = this._buildPoints(series, ctx, prepared);

        prepared.entryReveal.set(series.id, {
            linePoints,
            bottomPoints,
        });

        const markerElements = showMarkers
            ? ctx.data.map((item, dataIndex) => this._buildMarker(series, item, dataIndex, ctx, prepared))
            : [];

        // Curve only the top edge (matching the line) and straight-close the baseline.
        const areaFill = createPolyline({
            id: `${series.id}-area`,
            fill: setColorAlpha(color, opacity),
            stroke: undefined,
            points: areaPoints,
            renderer: areaBandRenderer(series.lineType),
            data: {
                points: areaPoints,
            } as PolylineState,
        });

        areaFill.autoStroke = false;

        const line = createPolyline({
            id: `${series.id}-line`,
            lineWidth: series.lineWidth ?? 2,
            stroke: color,
            lineDash: resolveLineDash(series.lineStyle),
            points: linePoints,
            renderer: series.lineType,
            data: {
                points: linePoints,
            } as PolylineState,
        });

        this._morphKeys.set(series.id, ctx.data.map(ctx.getKey));

        return createGroup({
            id: series.id,
            children: [
                areaFill,
                line,
                ...markerElements,
                ...(ctx.dataLabels.visible ? ctx.data.map((item, dataIndex) => createDataLabel(this._labelSpec(series, item, dataIndex, ctx, prepared))) : []),
            ],
        });
    }

    protected updateSeriesGroup(series: AreaSeriesLike<TData>, group: Group, ctx: AreaSeriesContext<TData>, prepared: AreaPrepared<TData>, batch: SeriesLabelBatch): Group {
        const color = ctx.getColor(series.id);
        const polylines = group.getElementsByType('polyline') as Polyline[];
        const areaFill = polylines[0];
        const line = polylines[1];
        const markers = group.getElementsByType('circle') as Circle[];
        const { linePoints, areaPoints } = this._buildPoints(series, ctx, prepared);

        const newKeys = ctx.data.map(ctx.getKey);
        const prevKeys = this._morphKeys.get(series.id);
        const keyed = !!prevKeys && keysDiffer(prevKeys, newKeys);

        // Apply the renderer + dash directly (not via the transition), and key-reconcile the morph so
        // curved lines/fills stay curved. The fill is a closed [top, reversed-bottom] polygon, so its
        // keys are disambiguated per run (t:/b:) to keep top matched to top and bottom to bottom.
        line.renderer = series.lineType;
        areaFill.renderer = areaBandRenderer(series.lineType);
        line.lineDash = resolveLineDash(series.lineStyle);

        const fillKeys = (keys: string[]): string[] => [
            ...keys.map(key => `t:${key}`),
            ...keys.slice().reverse().map(key => `b:${key}`),
        ];

        line.data = {
            points: keyed
                ? interpolatePoints(line.points, linePoints, {
                    resolveKeys: () => correspondence(prevKeys!, newKeys),
                })
                : linePoints,
        };

        areaFill.data = {
            points: keyed
                ? interpolatePoints(areaFill.points, areaPoints, {
                    resolveKeys: () => correspondence(fillKeys(prevKeys!), fillKeys(newKeys)),
                })
                : areaPoints,
        };

        this._morphKeys.set(series.id, newKeys);

        const exitAnimation = ctx.resolveAnimation(ANIMATION_REFERENCE.exit);

        const {
            left: markerEntries,
            inner: markerUpdates,
            right: markerExits,
        } = arrayJoin(ctx.data, markers, (item, marker) => marker.id === `${series.id}-marker-${ctx.getKey(item)}`);

        markerExits.forEach(marker => exitElement(ctx.renderer, marker, exitAnimation, {
            radius: 0,
            opacity: 0,
        }));

        if (series.markers !== false) {
            markerEntries.forEach(item => group.add(this._buildMarker(series, item, ctx.data.indexOf(item), ctx, prepared)));
        }

        markerUpdates.forEach(([item, marker]) => {
            const dataIndex = ctx.data.indexOf(item);
            const x = ctx.xScale(ctx.getKey(item));
            const y = this._valueScale(series, ctx)(prepared.getSeriesValue(series, item, dataIndex));

            marker.data = {
                fill: '#FFFFFF',
                stroke: color,
                lineWidth: 2,
                cx: x,
                cy: y,
                radius: 3,
            } as CircleState;

            this.attachMarkerHover(marker, ctx, {
                seriesId: series.id,
                key: ctx.getKey(item),
                value: this._rawValue(series, item),
                label: this._seriesLabel(series, item),
                radius: 3,
                highlightColor: color,
            });
        });

        this.reconcileLabels(
            group,
            ctx,
            exitAnimation,
            item => `${series.id}-marker-${ctx.getKey(item)}-label`,
            item => this._labelSpec(series, item, ctx.data.indexOf(item), ctx, prepared),
            batch
        );

        return group;
    }

    protected entryTransitions(groups: Group[], ctx: AreaSeriesContext<TData>, enter: ResolvedAnimation, prepared: AreaPrepared<TData>): Promise<unknown>[] {
        return groups.flatMap(group => {
            const markers = group.getElementsByType('circle') as Circle[];
            const reveal = prepared.entryReveal.get(group.id);
            const polylines = group.getElementsByType('polyline') as Polyline[];
            const areaFill = polylines[0];
            const line = polylines[1];

            const polylineTransitions: Promise<unknown>[] = [];

            if (line && reveal) {
                polylineTransitions.push(ctx.renderer.transition(line, {
                    duration: enter.duration,
                    ease: enter.ease,
                    state: { points: interpolatePath(reveal.linePoints) },
                }));
            }

            if (areaFill && reveal) {
                polylineTransitions.push(ctx.renderer.transition(areaFill, {
                    duration: enter.duration,
                    ease: enter.ease,
                    state: { points: interpolateAreaReveal(reveal.linePoints, reveal.bottomPoints) },
                }));
            }

            return [
                ...polylineTransitions,
                ...(markers.length > 0
                    ? [ctx.renderer.transition(markers, element => {
                        const fraction = ctx.plot.width > 0
                            ? numberClamp(((element as Circle).cx - ctx.plot.x) / ctx.plot.width, 0, 1)
                            : 0;

                        return {
                            duration: enter.duration * 0.4,
                            delay: fraction * enter.duration,
                            ease: enter.ease,
                            state: element.data as CircleState,
                        };
                    })]
                    : []),
            ];
        });
    }

    protected updateTransitions(groups: Group[], ctx: AreaSeriesContext<TData>, update: ResolvedAnimation): Promise<unknown>[] {
        return groups.flatMap(group => {
            const markers = group.getElementsByType('circle') as Circle[];
            const polylines = group.getElementsByType('polyline') as Polyline[];

            return [
                ...polylines.map(polyline => ctx.renderer.transition(polyline, {
                    duration: update.duration,
                    ease: update.ease,
                    state: polyline.data as PolylineState,
                })),
                ...(markers.length > 0
                    ? [ctx.renderer.transition(markers, element => ({
                        duration: update.duration,
                        ease: update.ease,
                        state: element.data as CircleState,
                    }))]
                    : []),
            ];
        });
    }

    protected orderGroups(series: AreaSeriesLike<TData>[], ctx: AreaSeriesContext<TData>, prepared: AreaPrepared<TData>): void {
        const base = ctx.zIndexBase ?? 0;

        this._groups.forEach(group => {
            group.zIndex = base + (prepared.orderRank.get(group.id) ?? 0);
        });
    }

}
