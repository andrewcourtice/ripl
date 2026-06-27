import {
    BaseChartOptions,
    Chart,
} from '../core/chart';

import type {
    ChartLegendInput,
} from '../core/options';

import {
    getColorGenerator,
} from '../constants/colors';

import {
    Tooltip,
} from '../components/tooltip';

import {
    LegendItem,
} from '../components/legend';

import {
    createRibbon,
    Ribbon,
} from '../elements';

import {
    Arc,
    ArcState,
    Context,
    createArc,
    createGroup,
    easeOutCubic,
    easeOutQuart,
    Group,
    setColorAlpha,
    TAU,
} from '@ripl/core';

import {
    arrayJoin,
} from '@ripl/utilities';

/** Options for configuring a {@link ChordChart}. */
export interface ChordChartOptions extends BaseChartOptions {
    labels: string[];
    matrix: number[][];
    colors?: string[];
    padAngle?: number;
    legend?: ChartLegendInput;
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
export class ChordChart extends Chart<ChordChartOptions> {

    private arcGroups: Group[] = [];
    private ribbonGroups: Group[] = [];
    private tooltip: Tooltip;

    constructor(target: string | HTMLElement | Context, options: ChordChartOptions) {
        super(target, options);

        this.tooltip = new Tooltip({
            scene: this.scene,
            renderer: this.renderer,
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

            // Pre-assign a stable colour per label so the legend and arcs stay in sync. Colours
            // are geometry-independent, so this can happen before the layout area is known.
            const resolvedColors = labels.map((_, index) => colors?.[index] ?? colorGenerator.next().value!);

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
            const cx = area.x + area.width / 2;
            const cy = area.y + area.height / 2;
            const size = Math.min(area.width, area.height);
            const outerRadius = size * 0.42;
            const innerRadius = outerRadius - 15;

            const layout = computeChordLayout(labels, matrix, padAngle, colorGenerator, resolvedColors);

            // Draw arcs
            const {
                left: arcEntries,
                inner: arcUpdates,
                right: arcExits,
            } = arrayJoin(layout.arcs, this.arcGroups, (arc, group) => arc.id === group.id);

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
                    fill: setColorAlpha(arc.color, 0.8),
                    stroke: arc.color,
                    lineWidth: 1,
                    data: {
                        endAngle: arc.endAngle,
                        radius: outerRadius,
                        innerRadius,
                    } as Partial<ArcState>,
                });

                segment.on('mouseenter', () => {
                    const [centroidX, centroidY] = segment.getCentroid(segment.data as Partial<ArcState>);
                    this.tooltip.show(centroidX, centroidY, `${arc.label}: ${arc.value}`);

                    renderer.transition(segment, {
                        duration: this.getAnimationDuration(200),
                        ease: easeOutQuart,
                        state: {
                            fill: arc.color,
                        },
                    });

                    segment.on('mouseleave', () => {
                        this.tooltip.hide();

                        renderer.transition(segment, {
                            duration: this.getAnimationDuration(200),
                            ease: easeOutQuart,
                            state: {
                                fill: setColorAlpha(arc.color, 0.8),
                            },
                        });
                    });
                });

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
                        fill: setColorAlpha(arc.color, 0.8),
                        stroke: arc.color,
                    } as Partial<ArcState>;
                }

                return group;
            });

            scene.add(arcEntryGroups);

            this.arcGroups = [
                ...arcEntryGroups,
                ...arcUpdateGroups,
            ];

            // Draw ribbons
            const {
                left: ribbonEntries,
                inner: ribbonUpdates,
                right: ribbonExits,
            } = arrayJoin(layout.ribbons, this.ribbonGroups, (ribbon, group) => ribbon.id === group.id);

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
                    fill: setColorAlpha(ribbon.color, 0.2),
                    stroke: setColorAlpha(ribbon.color, 0.4),
                    lineWidth: 0.5,
                    opacity: 0,
                    data: {
                        opacity: 1,
                    },
                });

                ribbonEl.on('mouseenter', () => {
                    this.tooltip.show(cx, cy, `${ribbon.sourceLabel} → ${ribbon.targetLabel}: ${ribbon.value}`);

                    renderer.transition(ribbonEl, {
                        duration: this.getAnimationDuration(200),
                        ease: easeOutQuart,
                        state: {
                            fill: setColorAlpha(ribbon.color, 0.5),
                        },
                    });

                    ribbonEl.on('mouseleave', () => {
                        this.tooltip.hide();

                        renderer.transition(ribbonEl, {
                            duration: this.getAnimationDuration(200),
                            ease: easeOutQuart,
                            state: {
                                fill: setColorAlpha(ribbon.color, 0.2),
                            },
                        });
                    });
                });

                return createGroup({
                    id: ribbon.id,
                    children: [ribbonEl],
                });
            });

            const ribbonUpdateGroups = ribbonUpdates.map(([, group]) => group);

            scene.add(ribbonEntryGroups);

            this.ribbonGroups = [
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

            return Promise.all([arcsTransition, ribbonsTransition, updatesTransition]);
        });
    }

}

/** Factory function that creates a new {@link ChordChart} instance. */
export function createChordChart(target: string | HTMLElement | Context, options: ChordChartOptions) {
    return new ChordChart(target, options);
}
