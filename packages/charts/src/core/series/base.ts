/**
 * Base class for the series renderers.
 *
 * Owns the pipeline every multi-series chart repeated by hand: join the incoming series against the
 * persisted groups, animate exits out, build entering groups, key-reconcile updating groups, add the
 * entering groups to the plot, assign paint order, and run the enter/update/label transitions. Each
 * concrete renderer (line, area, bar) supplies only the geometry-specific pieces via the abstract
 * hooks; the shared marker-hover wiring and the data-label reconcile live here so all three (and the
 * trend chart that composes them) stay identical.
 */

import type {
    SeriesInteractionEvent,
    SeriesRenderContext,
} from './context';

import {
    ANIMATION_REFERENCE,
    exitElement,
} from '../animation';

import type {
    ResolvedAnimation,
} from '../animation';

import {
    applyHoverHighlight,
} from '../interaction';

import {
    createDataLabel,
    resolveDataLabelLayout,
} from '../labels';

import type {
    DataLabelSpec,
} from '../labels';

import type {
    Circle,
    Group,
    Text,
    TextState,
} from '@ripl/core';

import {
    arrayJoin,
} from '@ripl/utilities';

/** Accumulates labels added or repositioned during an update pass so they can be transitioned together. */
export interface SeriesLabelBatch {
    /** Labels newly added to existing series groups (fade in). */
    entering: Text[];
    /** Labels on existing markers/bars that moved (tween to their new position). */
    updating: Text[];
}

/**
 * Shared enter/update/exit renderer for a single series *type*. Holds the series groups between
 * renders so data joins reconcile against them.
 *
 * @typeParam TSeries - The series option shape this renderer draws.
 * @typeParam TData - The type of each data item in the dataset.
 * @typeParam TContext - The render context this renderer needs (widens {@link SeriesRenderContext}).
 * @typeParam TPrepared - Per-render precompute passed to every hook (stacking tables, sub-scales, …).
 */
export abstract class SeriesRenderer<
    TSeries extends { id: string },
    TData,
    TContext extends SeriesRenderContext<TData>,
    TPrepared = void
> {

    protected _groups: Group[] = [];

    /** The series groups from the most recent render, in `[…entering, …updating]` order. */
    public get groups(): Group[] {
        return this._groups;
    }

    /**
     * Renders `series` against the persisted groups and returns once the entry/update/label
     * transitions settle. The groups are populated synchronously before the returned promise, so a
     * host can read {@link groups} immediately (e.g. to register legend highlighting across several
     * renderers) without awaiting.
     */
    public render(series: TSeries[], ctx: TContext): Promise<Group[]> {
        const exitAnimation = ctx.resolveAnimation(ANIMATION_REFERENCE.exit);

        const {
            left: entries,
            inner: updates,
            right: exits,
        } = arrayJoin(series, this._groups, 'id');

        const prepared = this.prepare(series, ctx);

        exits.forEach(group => this.exitSeries(group, ctx, exitAnimation, prepared));

        const batch: SeriesLabelBatch = {
            entering: [],
            updating: [],
        };

        const entryGroups = entries.map(srs => this.buildSeriesGroup(srs, ctx, prepared));
        const updateGroups = updates.map(([srs, group]) => this.updateSeriesGroup(srs, group, ctx, prepared, batch));

        ctx.addContent(entryGroups);

        this._groups = [
            ...entryGroups,
            ...updateGroups,
        ];

        this.orderGroups(series, ctx, prepared);

        const enter = ctx.resolveAnimation(ANIMATION_REFERENCE.enter);
        const update = ctx.resolveAnimation(ANIMATION_REFERENCE.update);

        return Promise.all([
            ...this.entryTransitions(entryGroups, ctx, enter, prepared),
            ...this.updateTransitions(updateGroups, ctx, update, prepared),
            ...this.labelTransitions(entryGroups, batch, enter, update, ctx),
        ]).then(() => this._groups);
    }

    /** Computes per-render precompute shared by all hooks. Defaults to nothing. */
    protected prepare(_series: TSeries[], _ctx: TContext): TPrepared {
        return undefined as TPrepared;
    }

    /** Builds a group of marks (at their start state, targets stashed on `data`) for an entering series. */
    protected abstract buildSeriesGroup(series: TSeries, ctx: TContext, prepared: TPrepared): Group;

    /** Reconciles the marks of an existing series group against the new data (enter/update/exit marks). */
    protected abstract updateSeriesGroup(series: TSeries, group: Group, ctx: TContext, prepared: TPrepared, batch: SeriesLabelBatch): Group;

    /** The entry transitions for the newly built groups. */
    protected abstract entryTransitions(groups: Group[], ctx: TContext, enter: ResolvedAnimation, prepared: TPrepared): Promise<unknown>[];

    /** The update transitions for the reconciled groups. */
    protected abstract updateTransitions(groups: Group[], ctx: TContext, update: ResolvedAnimation, prepared: TPrepared): Promise<unknown>[];

    /** Animates a removed series' marks out and destroys the group. Overridable for type-specific collapse. */
    protected exitSeries(group: Group, ctx: TContext, exitAnimation: ResolvedAnimation, _prepared: TPrepared): void {
        const exits = group.graph(false).map(element => exitElement(ctx.renderer, element, exitAnimation));
        void Promise.all(exits).then(() => group.destroy());
    }

    /**
     * Assigns each group an explicit z-index from `ctx.zIndexBase` (in series order) so a mixed chart
     * can layer this renderer's series between other types. No-op for standalone charts (no base set),
     * which keep their natural insertion order.
     */
    protected orderGroups(series: TSeries[], ctx: TContext, _prepared: TPrepared): void {
        if (ctx.zIndexBase === undefined) {
            return;
        }

        const rankById = new Map(series.map((srs, index) => [srs.id, index]));

        this._groups.forEach(group => {
            group.zIndex = ctx.zIndexBase! + (rankById.get(group.id) ?? 0);
        });
    }

    /** Wires the shared hover highlight + tooltip + interaction events onto a point marker. */
    protected attachMarkerHover(marker: Circle, ctx: SeriesRenderContext<TData>, spec: {
        seriesId: string;
        key: string;
        value: number;
        label: string;
        radius: number;
        highlightColor: string;
    }): void {
        const payload = (point: { x: number;
            y: number; }): SeriesInteractionEvent => ({
            x: point.x,
            y: point.y,
            xValue: spec.key,
            yValue: spec.value,
            seriesId: spec.seriesId,
        });

        applyHoverHighlight(marker, {
            renderer: ctx.renderer,
            animation: () => ctx.resolveAnimation(ANIMATION_REFERENCE.hover),
            tooltip: ctx.tooltip,
            anchor: () => ({
                x: marker.cx,
                y: marker.cy,
            }),
            content: () => `${spec.label}: ${ctx.formatValue(spec.value)}`,
            highlight: {
                fill: spec.highlightColor,
                radius: spec.radius + 2,
            },
            restore: {
                fill: '#FFFFFF',
                radius: spec.radius,
            },
            onEnter: point => ctx.emit('enter', payload(point)),
            onLeave: point => ctx.emit('leave', payload(point)),
            onClick: point => ctx.emit('click', payload(point)),
        });
    }

    /**
     * Reconciles a series group's data labels against the new data (enter/update/exit), collecting the
     * entering and updating labels into `batch` for the shared {@link labelTransitions}.
     */
    protected reconcileLabels(
        group: Group,
        ctx: SeriesRenderContext<TData>,
        exitAnimation: ResolvedAnimation,
        labelId: (item: TData) => string,
        buildSpec: (item: TData) => DataLabelSpec,
        batch: SeriesLabelBatch
    ): void {
        const labels = group.getElementsByType('text') as Text[];

        if (!ctx.dataLabels.visible) {
            labels.forEach(label => exitElement(ctx.renderer, label, exitAnimation, { opacity: 0 }));
            return;
        }

        const {
            left: entries,
            inner: updates,
            right: exits,
        } = arrayJoin(ctx.data, labels, (item, label) => label.id === labelId(item));

        exits.forEach(label => exitElement(ctx.renderer, label, exitAnimation, { opacity: 0 }));

        entries.forEach(item => {
            const label = createDataLabel(buildSpec(item));
            group.add(label);
            batch.entering.push(label);
        });

        updates.forEach(([item, label]) => {
            const spec = buildSpec(item);
            const layout = resolveDataLabelLayout(spec);

            label.content = spec.content;
            label.data = {
                x: layout.x,
                y: layout.y,
                opacity: 1,
            } as Partial<TextState>;

            batch.updating.push(label);
        });
    }

    /** The transitions that fade entry labels in and move updated labels to their refreshed positions. */
    protected labelTransitions(
        entryGroups: Group[],
        batch: SeriesLabelBatch,
        enter: ResolvedAnimation,
        update: ResolvedAnimation,
        ctx: SeriesRenderContext<TData>
    ): Promise<unknown>[] {
        const entryLabels = entryGroups.flatMap(group => group.getElementsByType('text') as Text[]);
        const transitions: Promise<unknown>[] = [];

        if (entryLabels.length > 0) {
            transitions.push(ctx.renderer.transition(entryLabels, {
                duration: enter.duration,
                ease: enter.ease,
                state: { opacity: 1 },
            }));
        }

        if (batch.entering.length > 0) {
            transitions.push(ctx.renderer.transition(batch.entering, {
                duration: update.duration,
                ease: update.ease,
                state: { opacity: 1 },
            }));
        }

        if (batch.updating.length > 0) {
            transitions.push(ctx.renderer.transition(batch.updating, element => ({
                duration: update.duration,
                ease: update.ease,
                state: element.data as Partial<TextState>,
            })));
        }

        return transitions;
    }

}
