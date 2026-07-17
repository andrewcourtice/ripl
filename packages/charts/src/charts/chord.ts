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
    resolveValueFormat,
} from '../core/options';

import {
    applyHoverHighlight,
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

/** Fill opacity for an outer arc at rest (full opacity on hover). */
const ARC_REST_ALPHA = 0.8;
/** Fill opacity for a ribbon at rest. */
const RIBBON_REST_ALPHA = 0.2;
/** Fill opacity for a ribbon while hovered. */
const RIBBON_HOVER_ALPHA = 0.5;
/** Stroke opacity for a ribbon. */
const RIBBON_STROKE_ALPHA = 0.4;

/** Options for configuring a {@link ChordChart}. */
export interface ChordChartOptions extends BaseChartOptions {
    /** Group labels, one per row/column of the matrix, rendered as outer arcs. */
    labels: string[];
    /** Square flow matrix where `matrix[i][j]` is the flow from group `i` to group `j`. */
    matrix: number[][];
    /** Explicit colour per group; falls back to the generated palette when omitted. */
    colors?: string[];
    /** Angular gap (in radians) between adjacent outer arcs. Defaults to 0.04. */
    padAngle?: number;
    /** Legend configuration (`true`/`false`, a position, or detailed legend options). */
    legend?: ChartLegendInput;
    /** Format applied to flow values shown as text (e.g. tooltips). */
    format?: ValueFormatInput;
}

/** Payload emitted for chord outer-arc interaction events. */
export interface ChordChartArcEvent {
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
export interface ChordChartRibbonEvent {
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
    arcclick: ChordChartArcEvent;
    /** Emitted when the pointer enters an outer arc. */
    arcenter: ChordChartArcEvent;
    /** Emitted when the pointer leaves an outer arc. */
    arcleave: ChordChartArcEvent;
    /** Emitted when a ribbon is clicked. */
    ribbonclick: ChordChartRibbonEvent;
    /** Emitted when the pointer enters a ribbon. */
    ribbonenter: ChordChartRibbonEvent;
    /** Emitted when the pointer leaves a ribbon. */
    ribbonleave: ChordChartRibbonEvent;
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
                labels,
                matrix,
                colors,
                padAngle = 0.04,
            } = this.options;

            const colorGenerator = this.colorGenerator;

            // Resolve a stable colour per label through the shared, id-keyed colour map so colours
            // are preserved across data updates (not reshuffled each render) and stay in sync with
            // the legend. Keyed by `arc-${label}` to match the arc group / legend item ids.
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
                active: true,
            }));

            this.reserveLegend(chartLayout, legendItems, this.options.legend);

            const area = chartLayout.area;
            const { cx, cy, size } = areaCenter(area);
            const outerRadius = size * 0.42;
            const innerRadius = outerRadius - 15;

            const layout = computeChordLayout(labels, matrix, padAngle, colorGenerator, resolvedColors);

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
                    padAngle: 0,
                    fill: setColorAlpha(arc.color, ARC_REST_ALPHA),
                    stroke: arc.color,
                    lineWidth: 1,
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
                    segment.data = {
                        startAngle: arc.startAngle,
                        endAngle: arc.endAngle,
                        radius: outerRadius,
                        innerRadius,
                        fill: setColorAlpha(arc.color, ARC_REST_ALPHA),
                        stroke: arc.color,
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

            // Outer arcs map 1:1 to legend items (by id), so register them for legend hover-highlight.
            this.registerHighlightGroups(this._arcGroups);

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

            // Apply the new layout to existing ribbons so the inner ribbons animate to their new
            // positions on data update (previously the update path discarded ribbon geometry, so
            // only the outer ring moved).
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

        const payload = (point: { x: number;
            y: number; }): ChordChartArcEvent => ({
            x: point.x,
            y: point.y,
            id: arc.id,
            label: arc.label,
            value: arc.value,
        });

        applyHoverHighlight(segment, {
            renderer: this.renderer,
            animation: () => this.resolveAnimation(ANIMATION_REFERENCE.hover),
            tooltip: this._tooltip,
            anchor: () => {
                const [x, y] = segment.getCentroid(segment.data as Partial<ArcState>);
                return {
                    x,
                    y,
                };
            },
            content: () => `${arc.label}: ${formatValue(arc.value)}`,
            highlight: { fill: arc.color },
            restore: { fill: setColorAlpha(arc.color, ARC_REST_ALPHA) },
            onEnter: point => this.emit('arcenter', payload(point)),
            onLeave: point => this.emit('arcleave', payload(point)),
            onClick: point => this.emit('arcclick', payload(point)),
        });
    }

    private _attachRibbonHover(ribbonEl: Ribbon, ribbon: ChordRibbon, cx: number, cy: number) {
        const formatValue = resolveValueFormat(this.options.format);

        const payload = (point: { x: number;
            y: number; }): ChordChartRibbonEvent => ({
            x: point.x,
            y: point.y,
            id: ribbon.id,
            sourceLabel: ribbon.sourceLabel,
            targetLabel: ribbon.targetLabel,
            value: ribbon.value,
        });

        applyHoverHighlight(ribbonEl, {
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
            onEnter: point => this.emit('ribbonenter', payload(point)),
            onLeave: point => this.emit('ribbonleave', payload(point)),
            onClick: point => this.emit('ribbonclick', payload(point)),
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
