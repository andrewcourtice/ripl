/**
 * Line series renderer: draws each series as a polyline with optional point markers.
 *
 * Extracted verbatim from the line chart so the standalone {@link LineChart} and the mixed trend
 * chart share one implementation — including the progressive draw-on entry, the staggered marker
 * pop-in, and the key-reconciled point morph that keeps curves curved across add/remove.
 */

import {
    SeriesRenderer,
} from './base';

import type {
    SeriesLabelBatch,
} from './base';

import type {
    LineSeriesContext,
    LineSeriesLike,
} from './context';

import {
    ANIMATION_REFERENCE,
    exitElement,
    stagger,
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

import type {
    SymbolElement,
    SymbolType,
} from '../../components/symbols';

import {
    createSymbol,
    symbolRadius,
} from '../../components/symbols';

import type {
    Circle,
    CircleState,
    Group,
    Point,
    Polyline,
    PolylineState,
    Scale,
} from '@ripl/core';

import {
    createGroup,
    createPolyline,
    interpolatePath,
    interpolatePoints,
} from '@ripl/core';

import type {
    ResolvedAnimation,
} from '../animation';

import {
    arrayJoin,
    typeIsFunction,
} from '@ripl/utilities';

/** The geometry of a single line marker: its element id, raw value, point, and rest circle state. */
interface MarkerState {
    id: string;
    value: number;
    point: Point;
    state: CircleState;
}

// All marker symbols expose cx/cy/radius, so circles and polygon symbols animate identically.
function seriesMarkers(group: Group): SymbolElement[] {
    return [
        ...group.getElementsByType('circle'),
        ...group.getElementsByType('polygon'),
    ] as SymbolElement[];
}

/** Renders line series (polyline + markers) for a host chart. */
export class LineSeriesRenderer<TData> extends SeriesRenderer<LineSeriesLike<TData>, TData, LineSeriesContext<TData>> {

    /** Previous ordered data keys per series, used to key-reconcile the line morph across add/remove. */
    private _morphKeys = new Map<string, string[]>();

    private _seriesLabel(series: LineSeriesLike<TData>, item: TData): string {
        return typeIsFunction(series.label) ? series.label(item) : series.label;
    }

    private _markerType(series: LineSeriesLike<TData>): SymbolType {
        return series.marker ?? 'circle';
    }

    // The value scale a series renders against — its bound axis's scale in multi-axis charts.
    private _valueScale(series: LineSeriesLike<TData>, ctx: LineSeriesContext<TData>): Scale {
        return ctx.resolveScale?.(series) ?? ctx.yScale;
    }

    private _markerState(series: LineSeriesLike<TData>, item: TData, ctx: LineSeriesContext<TData>): MarkerState {
        const value = resolveAccessor<TData, number>(series.value)(item);
        const key = ctx.getKey(item);
        const x = ctx.xScale(key);
        const y = this._valueScale(series, ctx)(value);
        const color = ctx.getColor(series.id);
        const markerType = this._markerType(series);
        // A hidden marker rests at radius 0 (the toggle animates it in/out on update). Non-circle
        // symbols rest at the circumradius matching the circle's visual area.
        const radius = series.markers === false ? 0 : symbolRadius(markerType, series.markerRadius ?? 3);

        return {
            id: `${series.id}-${key}`,
            value,
            point: [x, y],
            state: {
                fill: '#FFFFFF',
                stroke: color,
                lineWidth: 2,
                cx: x,
                cy: y,
                radius,
                // A square is a rotated quad — its transform origin must track its center through
                // position transitions, so the origin interpolates in lockstep with cx/cy.
                ...(markerType === 'square' ? {
                    transformOriginX: x,
                    transformOriginY: y,
                } : {}),
            },
        };
    }

    private _attachHover(marker: SymbolElement, series: LineSeriesLike<TData>, item: TData, value: number, state: CircleState, key: string, ctx: LineSeriesContext<TData>): void {
        if (series.markers === false) {
            marker.pointerEvents = 'none';
            return;
        }

        // Polygon symbols share the circle's cx/cy/radius surface, so the hover helper's radius
        // bump applies uniformly.
        this.attachMarkerHover(marker as Circle, ctx, {
            seriesId: series.id,
            key,
            value,
            label: this._seriesLabel(series, item),
            radius: symbolRadius(this._markerType(series), series.markerRadius ?? 3),
            highlightColor: state.stroke as string,
        });
    }

    private _buildMarker(series: LineSeriesLike<TData>, item: TData, ctx: LineSeriesContext<TData>): { point: Point;
        marker: SymbolElement; } {
        const { id, value, point, state } = this._markerState(series, item, ctx);

        const marker = createSymbol(this._markerType(series), {
            id,
            ...state,
            radius: 0,
            data: state,
        });

        this._attachHover(marker, series, item, value, state, ctx.getKey(item), ctx);

        return {
            point,
            marker,
        };
    }

    private _labelSpec(series: LineSeriesLike<TData>, item: TData, ctx: LineSeriesContext<TData>): DataLabelSpec {
        const { id, value, point } = this._markerState(series, item, ctx);

        return {
            id: `${id}-label`,
            x: point[0],
            y: point[1],
            anchor: ctx.dataLabels.anchor,
            content: ctx.formatValue(value),
            font: ctx.dataLabels.font,
            fill: ctx.dataLabels.fontColor,
            offset: (series.markerRadius ?? 3) + 4,
        };
    }

    protected buildSeriesGroup(series: LineSeriesLike<TData>, ctx: LineSeriesContext<TData>): Group {
        const color = ctx.getColor(series.id);
        const items = ctx.data.map(item => this._buildMarker(series, item, ctx));

        const line = createPolyline({
            id: `${series.id}-line`,
            lineWidth: series.lineWidth ?? 2,
            stroke: color,
            lineDash: resolveLineDash(series.lineStyle),
            points: items.map(item => item.point),
            renderer: series.lineType,
        });

        this._morphKeys.set(series.id, ctx.data.map(ctx.getKey));

        return createGroup({
            id: series.id,
            children: [
                line,
                ...items.map(item => item.marker),
                ...(ctx.dataLabels.visible ? ctx.data.map(item => createDataLabel(this._labelSpec(series, item, ctx))) : []),
            ],
        });
    }

    protected updateSeriesGroup(series: LineSeriesLike<TData>, group: Group, ctx: LineSeriesContext<TData>, _prepared: void, batch: SeriesLabelBatch): Group {
        const line = group.getElementsByType('polyline')[0] as Polyline;
        const markers = seriesMarkers(group);

        // Apply the curve renderer + dash directly (not via the transition, which would snap them).
        line.renderer = series.lineType;
        line.lineDash = resolveLineDash(series.lineStyle);

        const newKeys = ctx.data.map(ctx.getKey);
        const targetPoints = ctx.data.map(item => this._markerState(series, item, ctx).point);
        const prevKeys = this._morphKeys.get(series.id);

        // When the key set changes, match points by identity so a curved line keeps its shape.
        line.data = {
            points: prevKeys && keysDiffer(prevKeys, newKeys)
                ? interpolatePoints(line.points, targetPoints, {
                    resolveKeys: () => correspondence(prevKeys, newKeys),
                })
                : targetPoints,
        };

        this._morphKeys.set(series.id, newKeys);

        const exitAnimation = ctx.resolveAnimation(ANIMATION_REFERENCE.exit);

        const {
            left: markerEntries,
            inner: markerUpdates,
            right: markerExits,
        } = arrayJoin(ctx.data, markers, (item, marker) => marker.id === `${series.id}-${ctx.getKey(item)}`);

        markerExits.forEach(marker => exitElement(ctx.renderer, marker, exitAnimation, {
            radius: 0,
            opacity: 0,
        }));

        markerEntries.forEach(item => group.add(this._buildMarker(series, item, ctx).marker));

        markerUpdates.forEach(([item, marker]) => {
            const { state, value } = this._markerState(series, item, ctx);
            marker.data = state;
            this._attachHover(marker, series, item, value, state, ctx.getKey(item), ctx);
        });

        this.reconcileLabels(
            group,
            ctx,
            exitAnimation,
            item => `${series.id}-${ctx.getKey(item)}-label`,
            item => this._labelSpec(series, item, ctx),
            batch
        );

        return group;
    }

    protected entryTransitions(groups: Group[], ctx: LineSeriesContext<TData>, enter: ResolvedAnimation): Promise<unknown>[] {
        return groups.flatMap(group => {
            const markers = seriesMarkers(group);
            const line = group.getElementsByType('polyline')[0] as Polyline;

            return [
                ctx.renderer.transition(line, {
                    duration: enter.duration,
                    ease: enter.ease,
                    state: { points: interpolatePath(line.points) },
                }),
                ctx.renderer.transition(markers, (element, index, length) => ({
                    duration: enter.duration,
                    delay: stagger(index, length, enter.duration),
                    ease: enter.ease,
                    state: element.data as CircleState,
                })),
            ];
        });
    }

    protected updateTransitions(groups: Group[], ctx: LineSeriesContext<TData>, update: ResolvedAnimation): Promise<unknown>[] {
        return groups.flatMap(group => {
            const markers = seriesMarkers(group);
            const line = group.getElementsByType('polyline')[0] as Polyline;

            return [
                ctx.renderer.transition(line, {
                    duration: update.duration,
                    ease: update.ease,
                    state: line.data as PolylineState,
                }),
                ctx.renderer.transition(markers, element => ({
                    duration: update.duration,
                    ease: update.ease,
                    state: element.data as CircleState,
                })),
            ];
        });
    }

}
