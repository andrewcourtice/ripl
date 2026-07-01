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
    Arc,
    ArcState,
    Context,
    createArc,
    createGroup,
    easeOutQuart,
    easeOutQuint,
    Group,
    scaleContinuous,
    setColorAlpha,
    TAU,
} from '@ripl/core';

import {
    arrayJoin,
} from '@ripl/utilities';

/** A node in a sunburst hierarchy with optional nested children. */
export interface SunburstNode {
    id: string;
    label: string;
    value: number;
    color?: string;
    children?: SunburstNode[];
}

/** Options for configuring a {@link SunburstChart}. */
export interface SunburstChartOptions extends BaseChartOptions {
    data: SunburstNode[];
    legend?: ChartLegendInput;
}

interface FlattenedArc {
    id: string;
    label: string;
    value: number;
    color: string;
    depth: number;
    startAngle: number;
    endAngle: number;
}

function flattenNodes(
    nodes: SunburstNode[],
    depth: number,
    startAngle: number,
    endAngle: number,
    colorGenerator: ReturnType<typeof getColorGenerator>,
    parentColor?: string,
    resolvedColors?: Map<string, string>
): FlattenedArc[] {
    const total = nodes.reduce((sum, node) => sum + node.value, 0);

    if (total === 0) return [];

    const scale = scaleContinuous([0, total], [startAngle, endAngle], {
        clamp: true,
    });

    let currentAngle = startAngle;
    const result: FlattenedArc[] = [];

    nodes.forEach(node => {
        const nodeEndAngle = currentAngle + (scale(node.value) - scale(0));
        const color = resolvedColors?.get(node.id) ?? node.color ?? parentColor ?? colorGenerator.next().value!;

        result.push({
            id: node.id,
            label: node.label,
            value: node.value,
            color,
            depth,
            startAngle: currentAngle,
            endAngle: nodeEndAngle,
        });

        if (node.children && node.children.length > 0) {
            result.push(...flattenNodes(
                node.children,
                depth + 1,
                currentAngle,
                nodeEndAngle,
                colorGenerator,
                color
            ));
        }

        currentAngle = nodeEndAngle;
    });

    return result;
}

/**
 * Sunburst chart rendering hierarchical data as concentric arc rings.
 *
 * Each depth level is rendered as a ring of arc segments whose angular
 * extent is proportional to the node's value. Child nodes inherit parent
 * colors and are positioned within the parent's angular range. Supports
 * legend, tooltips, and staggered radial entry animations.
 */
export class SunburstChart extends Chart<SunburstChartOptions> {

    private groups: Group[] = [];
    private tooltip: Tooltip;

    constructor(target: string | HTMLElement | Context, options: SunburstChartOptions) {
        super(target, options);

        this.tooltip = new Tooltip({
            scene: this.scene,
            renderer: this.renderer,
        });

        this.init();
    }

    public async render() {
        return super.render(async (scene, renderer) => {
            const { data } = this.options;

            const colorGenerator = this.colorGenerator;

            // Resolve top-level node colours through the shared, id-keyed colour map so they stay
            // stable across data updates (randomising values must not reshuffle colours). Child
            // nodes inherit their parent's colour via `flattenNodes`.
            this.resolveSeriesColors(data.map(node => ({
                id: node.id,
                color: node.color,
            })));

            const resolvedColors = new Map<string, string>(
                data.map(node => [node.id, node.color ?? this.getSeriesColor(node.id)])
            );

            // Shared layout pass: reserve title and legend bands.
            const layout = this.createLayout();
            this.reserveTitle(layout);

            const legendItems: LegendItem[] = data.map(node => ({
                id: node.id,
                label: node.label,
                color: resolvedColors.get(node.id)!,
                active: true,
            }));

            this.reserveLegend(layout, legendItems, this.options.legend);

            const area = layout.area;
            const cx = area.x + area.width / 2;
            const cy = area.y + area.height / 2;
            const size = Math.min(area.width, area.height);

            const offset = TAU / 4;
            const arcs = flattenNodes(data, 0, -offset, TAU - offset, colorGenerator, undefined, resolvedColors);

            // Find max depth
            let maxDepth = 0;

            arcs.forEach(arc => {
                maxDepth = Math.max(maxDepth, arc.depth);
            });

            const ringWidth = (size * 0.45) / (maxDepth + 1);
            const innerBaseRadius = size * 0.08;

            const {
                left: entries,
                inner: updates,
                right: exits,
            } = arrayJoin(arcs, this.groups, (arc, group) => arc.id === group.id);

            exits.forEach(el => el.destroy());

            const entryGroups = entries.map(arc => {
                const innerRadius = innerBaseRadius + arc.depth * ringWidth;
                const outerRadius = innerRadius + ringWidth - 2;
                const padAngle = 0.02;

                const segment = createArc({
                    id: `${arc.id}-arc`,
                    cx,
                    cy,
                    startAngle: arc.startAngle,
                    endAngle: arc.startAngle,
                    radius: 0,
                    innerRadius: 0,
                    padAngle,
                    fill: setColorAlpha(arc.color, 0.65),
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
                        duration: this.getAnimationDuration(300),
                        ease: easeOutQuart,
                        state: {
                            fill: arc.color,
                        },
                    });

                    segment.on('mouseleave', () => {
                        this.tooltip.hide();

                        renderer.transition(segment, {
                            duration: this.getAnimationDuration(300),
                            ease: easeOutQuart,
                            state: {
                                fill: setColorAlpha(arc.color, 0.65),
                            },
                        });
                    });
                });

                return createGroup({
                    id: arc.id,
                    children: [segment],
                });
            });

            const updateGroups = updates.map(([arc, group]) => {
                const innerRadius = innerBaseRadius + arc.depth * ringWidth;
                const outerRadius = innerRadius + ringWidth - 2;
                const segment = group.query('arc') as Arc;

                if (segment) {
                    segment.data = {
                        cx,
                        cy,
                        startAngle: arc.startAngle,
                        endAngle: arc.endAngle,
                        radius: outerRadius,
                        innerRadius,
                        fill: setColorAlpha(arc.color, 0.65),
                        stroke: arc.color,
                    } as Partial<ArcState>;
                }

                return group;
            });

            scene.add(entryGroups);

            this.groups = [
                ...entryGroups,
                ...updateGroups,
            ];

            // Animate entries
            const entryArcs = entryGroups.flatMap(g => g.getElementsByType('arc')) as Arc[];

            const entriesTransition = renderer.transition(entryArcs, (element, index, length) => ({
                duration: this.getAnimationDuration(1000),
                delay: index * (this.getAnimationDuration(800) / length),
                ease: easeOutQuint,
                state: element.data as Partial<ArcState>,
            }));

            // Animate updates
            const updateArcs = updateGroups.flatMap(g => g.getElementsByType('arc')) as Arc[];

            const updatesTransition = renderer.transition(updateArcs, element => ({
                duration: this.getAnimationDuration(1000),
                ease: easeOutQuint,
                state: element.data as Partial<ArcState>,
            }));

            return Promise.all([entriesTransition, updatesTransition]);
        });
    }

}

/** Factory function that creates a new {@link SunburstChart} instance. */
export function createSunburstChart(target: string | HTMLElement | Context, options: SunburstChartOptions) {
    return new SunburstChart(target, options);
}
