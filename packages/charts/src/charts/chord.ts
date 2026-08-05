import type {
    BaseChartOptions,
} from '../core/chart';

import {
    Chart,
} from '../core/chart';

import {
    areaCenter,
} from '../core/layout';

import type {
    ChartLegendInput,
    ValueFormatInput,
} from '../core/options';

import {
    resolveSegmentPadWidth,
    resolveValueFormat,
} from '../core/options';

import {
    applySegmentInteraction,
    arcCentroidAnchor,
} from '../core/interaction';

import {
    ANIMATION_REFERENCE,
} from '../core/animation';

import type {
    getColorGenerator,
} from '../constants/colors';

import {
    Tooltip,
} from '../components/tooltip';

import type {
    LegendItem,
} from '../components/legend';

import type {
    Ribbon,
    RibbonState,
} from '../elements';

import {
    createRibbon,
} from '../elements';

import type {
    Arc,
    ArcState,
    Context,
    EventMap,
    Group,
} from '@ripl/core';

import {
    createArc,
    createGroup,
    easeOutCubic,
    setColorAlpha,
    TAU,
} from '@ripl/core';

import {
    arrayJoin,
} from '@ripl/utilities';

/** Fill opacity for a ribbon at rest. */
const RIBBON_REST_ALPHA = 0.2;
/** Fill opacity for a ribbon while hovered. */
const RIBBON_HOVER_ALPHA = 0.5;
/** Stroke opacity for a ribbon. */
const RIBBON_STROKE_ALPHA = 0.4;
/** Fill opacity an outer arc carries at rest, matching the bar series so the two read as one family. */
const SEGMENT_REST_ALPHA = 0.78;

/** Options for configuring a {@link ChordChart}. */
export interface ChordChartOptions extends BaseChartOptions {
    /** Group names, one per row/column of the matrix, rendered as outer arcs. */
    groups: string[];
    /** Square flow matrix where `matrix[i][j]` is the flow from group `i` to group `j`. */
    matrix: number[][];
    /** Explicit color per group; falls back to the generated palette when omitted. */
    palette?: string[];
    /**
     * Angular gap (in radians) between adjacent outer arcs, taken out of the ring before the arcs are
     * sized, so it also shifts where the ribbons attach.
     *
     * @deprecated Use {@link ChordChartOptions.padWidth} for a gap of constant width. Still honored
     * when `padWidth` is not set, so existing charts keep their look.
     */
    padAngle?: number;
    /** Gap between adjacent outer arcs, in logical pixels. Arcs face each other with parallel edges a constant distance apart, and the ring is not resized, so the ribbons keep their attachment points. Defaults to 2; pass 0 for touching arcs. Takes precedence over the deprecated `padAngle`. */
    padWidth?: number;
    /** Legend configuration (`true`/`false`, a position, or detailed legend options). */
    legend?: ChartLegendInput;
    /** Format applied to flow values shown as text (e.g. tooltips). */
    format?: ValueFormatInput;
}

/** Payload emitted for chord outer-arc interaction events. */
export interface ChordChartSegmentEvent {
    /** The x coordinate (in chart pixels) of the arc's centroid. */
    x: number;
    /** The y coordinate (in chart pixels) of the arc's centroid. */
    y: number;
    /** The id of the interacted arc. */
    id: string;
    /** The group label of the interacted arc. */
    label: string;
    /** The group's total flow (sum of its matrix row). */
    value: number;
}

/** Payload emitted for chord ribbon interaction events. */
export interface ChordChartLinkEvent {
    /** The x coordinate (in chart pixels) of the ribbon anchor. */
    x: number;
    /** The y coordinate (in chart pixels) of the ribbon anchor. */
    y: number;
    /** The id of the interacted ribbon. */
    id: string;
    /** The label of the ribbon's source group. */
    sourceLabel: string;
    /** The label of the ribbon's target group. */
    targetLabel: string;
    /** The flow value the ribbon represents. */
    value: number;
}

/** Events emitted by a {@link ChordChart} that consumers can subscribe to via `chart.on(...)`. */
export interface ChordChartEventMap extends EventMap {
    /** Emitted when an outer arc is clicked. */
    segmentclick: ChordChartSegmentEvent;
    /** Emitted when the pointer enters an outer arc. */
    segmententer: ChordChartSegmentEvent;
    /** Emitted when the pointer leaves an outer arc. */
    segmentleave: ChordChartSegmentEvent;
    /** Emitted when a ribbon is clicked. */
    linkclick: ChordChartLinkEvent;
    /** Emitted when the pointer enters a ribbon. */
    linkenter: ChordChartLinkEvent;
    /** Emitted when the pointer leaves a ribbon. */
    linkleave: ChordChartLinkEvent;
}

interface ChordArc {
    id: string;
    label: string;
    color: string;
    startAngle: number;
    endAngle: number;
    value: number;
}

interface ChordRibbon {
    id: string;
    sourceLabel: string;
    targetLabel: string;
    sourceStart: number;
    sourceEnd: number;
    targetStart: number;
    targetEnd: number;
    value: number;
    color: string;
}

interface ChordLayout {
    arcs: ChordArc[];
    ribbons: ChordRibbon[];
}

function computeChordLayout(
    labels: string[],
    matrix: number[][],
    padAngle: number,
    colorGenerator: ReturnType<typeof getColorGenerator>,
    colors?: string[]
): ChordLayout {
    const count = labels.length;
    const groupTotals: number[] = [];
    let grandTotal = 0;

    for (let i = 0; i < count; i++) {
        let total = 0;

        for (let col = 0; col < count; col++) {
            total += (matrix[i]?.[col] ?? 0);
        }

        groupTotals.push(total);
        grandTotal += total;
    }

    if (grandTotal === 0) {
        return {
            arcs: [],
            ribbons: [],
        };
    }

    const totalPad = padAngle * count;
    const availableAngle = TAU - totalPad;

    // Compute arc angles
    const arcs: ChordArc[] = [];
    let currentAngle = -TAU / 4;

    const arcStarts: number[] = [];
    const arcEnds: number[] = [];

    for (let i = 0; i < count; i++) {
        const arcAngle = (groupTotals[i] / grandTotal) * availableAngle;
        const start = currentAngle;
        const end = currentAngle + arcAngle;
        const color = colors?.[i] ?? colorGenerator.next().value!;

        arcStarts.push(start);
        arcEnds.push(end);

        arcs.push({
            id: `arc-${labels[i]}`,
            label: labels[i],
            color,
            startAngle: start,
            endAngle: end,
            value: groupTotals[i],
        });

        currentAngle = end + padAngle;
    }

    // Compute ribbon positions
    const ribbons: ChordRibbon[] = [];
    const groupOffsets: number[] = arcStarts.map(start => start);

    for (let i = 0; i < count; i++) {
        for (let col = 0; col < count; col++) {
            const value = matrix[i]?.[col] ?? 0;

            if (value <= 0) continue;

            const sourceAngle = (value / grandTotal) * availableAngle;
            const sourceStart = groupOffsets[i];
            const sourceEnd = sourceStart + sourceAngle;
            groupOffsets[i] = sourceEnd;

            const targetAngle = ((matrix[col]?.[i] ?? 0) / grandTotal) * availableAngle;
            const targetStart = groupOffsets[col];
            const targetEnd = targetStart + targetAngle;
            groupOffsets[col] = targetEnd;

            // Only add one ribbon per pair (avoid duplicates)
            if (i <= col) {
                ribbons.push({
                    id: `ribbon-${labels[i]}-${labels[col]}`,
                    sourceLabel: labels[i],
                    targetLabel: labels[col],
                    sourceStart,
                    sourceEnd,
                    targetStart,
                    targetEnd,
                    value,
                    color: arcs[i].color,
                });
            }
        }
    }

    return {
        arcs,
        ribbons,
    };
}

/**
 * Chord diagram visualizing inter-relationships in a square matrix.
 *
 * Outer arcs represent groups (labels) with angular extent proportional
 * to their total flow. Inner ribbons connect pairs of groups with width
 * proportional to the flow value. Supports legend, tooltips, and
 * sequential animation (arcs first, then ribbons).
 */
export class ChordChart extends Chart<ChordChartOptions, ChordChartEventMap> {

    private _arcGroups: Group[] = [];
    private _ribbonGroups: Group[] = [];
    private _tooltip: Tooltip;

    constructor(target: string | HTMLElement | Context, options: ChordChartOptions) {
        super(target, options);

        this._tooltip = new Tooltip({
            scene: this.scene,
            renderer: this.renderer,
            placement: 'center',
        });

        this.init();
    }

    public async render() {
        return super.render(async (scene, renderer) => {
            const {
                groups: labels,
                matrix,
                palette: colors,
            } = this.options;

            const padWidth = resolveSegmentPadWidth(this.options.padWidth, this.options.padAngle);
            const padAngle = padWidth === undefined ? (this.options.padAngle ?? 0) : 0;

            const colorGenerator = this.colorGenerator;

            this.resolveSeriesColors(labels.map((label, index) => ({
                id: `arc-${label}`,
                color: colors?.[index],
            })));

            const resolvedColors = labels.map(label => this.getSeriesColor(`arc-${label}`));

            // Shared layout pass: reserve title and legend bands.
            const chartLayout = this.createLayout();
            this.reserveTitle(chartLayout);

            const legendItems: LegendItem[] = labels.map((label, index) => ({
                id: `arc-${label}`,
                label,
                color: resolvedColors[index],
                active: this.isItemActive(`arc-${label}`),
            }));

            this.reserveLegend(chartLayout, legendItems, this.options.legend);

            const area = chartLayout.area;
            const { cx, cy, size } = areaCenter(area);
            const outerRadius = size * 0.42;
            const innerRadius = outerRadius - 15;

            const activeIndices = labels
                .map((_, index) => index)
                .filter(index => this.isItemActive(`arc-${labels[index]}`));
            const activeLabels = activeIndices.map(index => labels[index]);
            const activeMatrix = activeIndices.map(row => activeIndices.map(col => matrix[row]?.[col] ?? 0));
            const activeColors = activeIndices.map(index => resolvedColors[index]);

            const layout = computeChordLayout(activeLabels, activeMatrix, padAngle, colorGenerator, activeColors);

            // Draw arcs
            const {
                left: arcEntries,
                inner: arcUpdates,
                right: arcExits,
            } = arrayJoin(layout.arcs, this._arcGroups, (arc, group) => arc.id === group.id);

            arcExits.forEach(el => el.destroy());

            const arcEntryGroups = arcEntries.map(arc => {
                const segment = createArc({
                    id: `${arc.id}-segment`,
                    cx,
                    cy,
                    startAngle: arc.startAngle,
                    endAngle: arc.startAngle,
                    radius: 0,
                    innerRadius: 0,
                    padWidth,
                    fill: setColorAlpha(arc.color, SEGMENT_REST_ALPHA),
                    data: {
                        endAngle: arc.endAngle,
                        radius: outerRadius,
                        innerRadius,
                    } as Partial<ArcState>,
                });

                this._attachArcHover(segment, arc);

                return createGroup({
                    id: arc.id,
                    children: [segment],
                });
            });

            const arcUpdateGroups = arcUpdates.map(([arc, group]) => {
                const segment = group.query('arc') as Arc;

                if (segment) {
                    segment.padWidth = padWidth;
                    segment.data = {
                        startAngle: arc.startAngle,
                        endAngle: arc.endAngle,
                        radius: outerRadius,
                        innerRadius,
                        fill: setColorAlpha(arc.color, SEGMENT_REST_ALPHA),
                    } as Partial<ArcState>;

                    this._attachArcHover(segment, arc);
                }

                return group;
            });

            scene.add(arcEntryGroups);

            this._arcGroups = [
                ...arcEntryGroups,
                ...arcUpdateGroups,
            ];

            // Draw ribbons
            const {
                left: ribbonEntries,
                inner: ribbonUpdates,
                right: ribbonExits,
            } = arrayJoin(layout.ribbons, this._ribbonGroups, (ribbon, group) => ribbon.id === group.id);

            ribbonExits.forEach(el => el.destroy());

            const ribbonEntryGroups = ribbonEntries.map(ribbon => {
                const ribbonEl = createRibbon({
                    id: `${ribbon.id}-ribbon`,
                    cx,
                    cy,
                    radius: innerRadius - 2,
                    sourceStart: ribbon.sourceStart,
                    sourceEnd: ribbon.sourceEnd,
                    targetStart: ribbon.targetStart,
                    targetEnd: ribbon.targetEnd,
                    fill: setColorAlpha(ribbon.color, RIBBON_REST_ALPHA),
                    stroke: setColorAlpha(ribbon.color, RIBBON_STROKE_ALPHA),
                    lineWidth: 0.5,
                    opacity: 0,
                    data: {
                        opacity: 1,
                    },
                });

                this._attachRibbonHover(ribbonEl, ribbon, cx, cy);

                return createGroup({
                    id: ribbon.id,
                    children: [ribbonEl],
                });
            });

            // Update ribbon geometry too, or only the outer ring moves on a data update
            const ribbonUpdateGroups = ribbonUpdates.map(([ribbon, group]) => {
                const ribbonEl = group.query('ribbon') as Ribbon;

                if (ribbonEl) {
                    ribbonEl.data = {
                        cx,
                        cy,
                        radius: innerRadius - 2,
                        sourceStart: ribbon.sourceStart,
                        sourceEnd: ribbon.sourceEnd,
                        targetStart: ribbon.targetStart,
                        targetEnd: ribbon.targetEnd,
                        fill: setColorAlpha(ribbon.color, RIBBON_REST_ALPHA),
                        stroke: setColorAlpha(ribbon.color, RIBBON_STROKE_ALPHA),
                        opacity: 1,
                    } as Partial<RibbonState>;

                    this._attachRibbonHover(ribbonEl, ribbon, cx, cy);
                }

                return group;
            });

            scene.add(ribbonEntryGroups);

            this._ribbonGroups = [
                ...ribbonEntryGroups,
                ...ribbonUpdateGroups,
            ];

            // Outer arcs map 1:1 to legend items by id; a ribbon is incident to the two arcs it joins.
            const ribbonOwners = new Map(layout.ribbons.map(ribbon => [
                ribbon.id,
                [`arc-${ribbon.sourceLabel}`, `arc-${ribbon.targetLabel}`],
            ]));

            this.registerHighlightGroups(
                [...this._arcGroups, ...this._ribbonGroups],
                group => ribbonOwners.get(group.id) ?? group.id
            );

            // Sequential animation: arcs first, then ribbons
            const entryArcs = arcEntryGroups.flatMap(g => g.getElementsByType('arc')) as Arc[];

            const arcsTransition = renderer.transition(entryArcs, (element, index, length) => ({
                duration: this.getAnimationDuration(800),
                delay: index * (this.getAnimationDuration(600) / length),
                ease: easeOutCubic,
                state: element.data as Partial<ArcState>,
            }));

            // Ribbons animate after arcs complete
            const entryRibbons = ribbonEntryGroups.flatMap(g => g.getElementsByType('ribbon')) as Ribbon[];
            const arcAnimDuration = this.getAnimationDuration(800) + this.getAnimationDuration(600);

            const ribbonsTransition = renderer.transition(entryRibbons, (element, index, length) => ({
                duration: this.getAnimationDuration(600),
                delay: arcAnimDuration + index * (this.getAnimationDuration(400) / length),
                ease: easeOutCubic,
                state: element.data as Record<string, unknown>,
            }));

            // Animate updates
            const updateArcs = arcUpdateGroups.flatMap(g => g.getElementsByType('arc')) as Arc[];

            const updatesTransition = renderer.transition(updateArcs, element => ({
                duration: this.getAnimationDuration(800),
                ease: easeOutCubic,
                state: element.data as Partial<ArcState>,
            }));

            const updateRibbons = ribbonUpdateGroups.flatMap(g => g.getElementsByType('ribbon')) as Ribbon[];

            const ribbonUpdatesTransition = renderer.transition(updateRibbons, element => ({
                duration: this.getAnimationDuration(800),
                ease: easeOutCubic,
                state: element.data as Record<string, unknown>,
            }));

            return Promise.all([arcsTransition, ribbonsTransition, updatesTransition, ribbonUpdatesTransition]);
        });
    }

    private _attachArcHover(segment: Arc, arc: ChordArc) {
        const formatValue = resolveValueFormat(this.options.format);

        applySegmentInteraction<Arc, ChordChartSegmentEvent>(segment, {
            renderer: this.renderer,
            animation: () => this.resolveAnimation(ANIMATION_REFERENCE.hover),
            tooltip: this._tooltip,
            anchor: arcCentroidAnchor(segment),
            content: () => `${arc.label}: ${formatValue(arc.value)}`,
            payload: {
                id: arc.id,
                label: arc.label,
                value: arc.value,
            },
            onHighlight: hovered => this.highlightSeries(hovered ? arc.id : null),
            onEnter: event => this.emit('segmententer', event),
            onLeave: event => this.emit('segmentleave', event),
            onClick: event => this.emit('segmentclick', event),
        });
    }

    private _attachRibbonHover(ribbonEl: Ribbon, ribbon: ChordRibbon, cx: number, cy: number) {
        const formatValue = resolveValueFormat(this.options.format);

        applySegmentInteraction<Ribbon, ChordChartLinkEvent>(ribbonEl, {
            renderer: this.renderer,
            animation: () => this.resolveAnimation(ANIMATION_REFERENCE.hover),
            tooltip: this._tooltip,
            anchor: () => ({
                x: cx,
                y: cy,
            }),
            content: () => `${ribbon.sourceLabel} → ${ribbon.targetLabel}: ${formatValue(ribbon.value)}`,
            highlight: { fill: setColorAlpha(ribbon.color, RIBBON_HOVER_ALPHA) },
            restore: { fill: setColorAlpha(ribbon.color, RIBBON_REST_ALPHA) },
            payload: {
                id: ribbon.id,
                sourceLabel: ribbon.sourceLabel,
                targetLabel: ribbon.targetLabel,
                value: ribbon.value,
            },
            onEnter: event => this.emit('linkenter', event),
            onLeave: event => this.emit('linkleave', event),
            onClick: event => this.emit('linkclick', event),
        });
    }

}

/**
 * Factory function that creates a new {@link ChordChart} instance.
 *
 * @example
 * ```ts
 * createChordChart(target, {
 *     labels: ['A', 'B', 'C'],
 *     matrix: [
 *         [0, 5, 2],
 *         [5, 0, 3],
 *         [2, 3, 0],
 *     ],
 * });
 * ```
 */
export function createChordChart(target: string | HTMLElement | Context, options: ChordChartOptions) {
    return new ChordChart(target, options);
}
