import {
    BaseChartOptions,
    Chart,
} from '../core/chart';

import {
    getColorGenerator,
} from '../constants/colors';

import {
    Tooltip,
} from '../components/tooltip';

import {
    Legend,
    LegendItem,
} from '../components/legend';

import {
    Arc,
    ArcState,
    Context,
    createArc,
    createGroup,
    createPath,
    easeOutCubic,
    easeOutQuart,
    Group,
    Path,
    setColorAlpha,
    TAU,
} from '@ripl/core';

import {
    arrayForEach,
    arrayJoin,
    arrayMap,
} from '@ripl/utilities';

export interface ChordChartOptions extends BaseChartOptions {
    labels: string[];
    matrix: number[][];
    colors?: string[];
    padAngle?: number;
    showLegend?: boolean;
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

export class ChordChart extends Chart<ChordChartOptions> {

    private arcGroups: Group[] = [];
    private ribbonGroups: Group[] = [];
    private tooltip: Tooltip;
    private legend?: Legend;

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
            const padding = this.getPadding();
            const cx = scene.width / 2;
            const cy = scene.height / 2;
            const size = Math.min(
                scene.width - padding.left - padding.right,
                scene.height - padding.top - padding.bottom
            );
            const outerRadius = size * 0.42;
            const innerRadius = outerRadius - 15;

            const layout = computeChordLayout(labels, matrix, padAngle, colorGenerator, colors);

            // Draw arcs
            const {
                left: arcEntries,
                inner: arcUpdates,
                right: arcExits,
            } = arrayJoin(layout.arcs, this.arcGroups, (arc, group) => arc.id === group.id);

            arrayForEach(arcExits, group => group.destroy());

            const arcEntryGroups = arrayMap(arcEntries, arc => {
                const segment = createArc({
                    id: `${arc.id}-segment`,
                    cx,
                    cy,
                    startAngle: arc.startAngle,
                    endAngle: arc.startAngle,
                    radius: 0,
                    innerRadius: 0,
                    padAngle: 0,
                    fillStyle: setColorAlpha(arc.color, 0.8),
                    strokeStyle: arc.color,
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
                            fillStyle: arc.color,
                        },
                    });

                    segment.on('mouseleave', () => {
                        this.tooltip.hide();

                        renderer.transition(segment, {
                            duration: this.getAnimationDuration(200),
                            ease: easeOutQuart,
                            state: {
                                fillStyle: setColorAlpha(arc.color, 0.8),
                            },
                        });
                    });
                });

                return createGroup({
                    id: arc.id,
                    children: [segment],
                });
            });

            const arcUpdateGroups = arrayMap(arcUpdates, ([arc, group]) => {
                const segment = group.query('arc') as Arc;

                if (segment) {
                    segment.data = {
                        startAngle: arc.startAngle,
                        endAngle: arc.endAngle,
                        radius: outerRadius,
                        innerRadius,
                        fillStyle: setColorAlpha(arc.color, 0.8),
                        strokeStyle: arc.color,
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

            arrayForEach(ribbonExits, group => group.destroy());

            const ribbonEntryGroups = arrayMap(ribbonEntries, ribbon => {
                const path = createPath({
                    id: `${ribbon.id}-path`,
                    x: 0,
                    y: 0,
                    width: 0,
                    height: 0,
                    fillStyle: setColorAlpha(ribbon.color, 0.2),
                    strokeStyle: setColorAlpha(ribbon.color, 0.4),
                    lineWidth: 0.5,
                    globalAlpha: 0,
                    data: {
                        globalAlpha: 1,
                    },
                    pathRenderer: (ctx) => {
                        const r = innerRadius - 2;

                        ctx.moveTo(
                            cx + r * Math.cos(ribbon.sourceStart),
                            cy + r * Math.sin(ribbon.sourceStart)
                        );

                        ctx.arc(cx, cy, r, ribbon.sourceStart, ribbon.sourceEnd);

                        ctx.quadraticCurveTo(
                            cx, cy,
                            cx + r * Math.cos(ribbon.targetStart),
                            cy + r * Math.sin(ribbon.targetStart)
                        );

                        ctx.arc(cx, cy, r, ribbon.targetStart, ribbon.targetEnd);

                        ctx.quadraticCurveTo(
                            cx, cy,
                            cx + r * Math.cos(ribbon.sourceStart),
                            cy + r * Math.sin(ribbon.sourceStart)
                        );

                        ctx.closePath();
                    },
                });

                path.on('mouseenter', () => {
                    this.tooltip.show(cx, cy, `${ribbon.sourceLabel} → ${ribbon.targetLabel}: ${ribbon.value}`);

                    renderer.transition(path, {
                        duration: this.getAnimationDuration(200),
                        ease: easeOutQuart,
                        state: {
                            fillStyle: setColorAlpha(ribbon.color, 0.5),
                        },
                    });

                    path.on('mouseleave', () => {
                        this.tooltip.hide();

                        renderer.transition(path, {
                            duration: this.getAnimationDuration(200),
                            ease: easeOutQuart,
                            state: {
                                fillStyle: setColorAlpha(ribbon.color, 0.2),
                            },
                        });
                    });
                });

                return createGroup({
                    id: ribbon.id,
                    children: [path],
                });
            });

            const ribbonUpdateGroups = arrayMap(ribbonUpdates, ([, group]) => group);

            scene.add(ribbonEntryGroups);

            this.ribbonGroups = [
                ...ribbonEntryGroups,
                ...ribbonUpdateGroups,
            ];

            // Legend
            if (this.options.showLegend !== false && layout.arcs.length > 0) {
                const legendItems: LegendItem[] = arrayMap(layout.arcs, arc => ({
                    id: arc.id,
                    label: arc.label,
                    color: arc.color,
                    active: true,
                }));

                if (!this.legend) {
                    this.legend = new Legend({
                        scene: this.scene,
                        renderer: this.renderer,
                        items: legendItems,
                        position: 'top',
                    });
                } else {
                    this.legend.update(legendItems);
                }

                this.legend.render(padding.left, 0, scene.width - padding.left - padding.right);
            }

            // Sequential animation: arcs first, then ribbons
            const entryArcs = arcEntryGroups.flatMap(g => g.getElementsByType('arc')) as Arc[];

            const arcsTransition = renderer.transition(entryArcs, (element, index, length) => ({
                duration: this.getAnimationDuration(800),
                delay: index * (this.getAnimationDuration(600) / length),
                ease: easeOutCubic,
                state: element.data as Partial<ArcState>,
            }));

            // Ribbons animate after arcs complete
            const entryPaths = ribbonEntryGroups.flatMap(g => g.getElementsByType('path')) as Path[];
            const arcAnimDuration = this.getAnimationDuration(800) + this.getAnimationDuration(600);

            const ribbonsTransition = renderer.transition(entryPaths, (element, index, length) => ({
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

export function createChordChart(target: string | HTMLElement | Context, options: ChordChartOptions) {
    return new ChordChart(target, options);
}
