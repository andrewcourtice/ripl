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
    easeOutQuart,
    easeOutQuint,
    Group,
    scaleContinuous,
    setColorAlpha,
    TAU,
} from '@ripl/core';

import {
    arrayFlatMap,
    arrayForEach,
    arrayJoin,
    arrayMap,
    arrayReduce,
} from '@ripl/utilities';

export interface SunburstNode {
    id: string;
    label: string;
    value: number;
    color?: string;
    children?: SunburstNode[];
}

export interface SunburstChartOptions extends BaseChartOptions {
    data: SunburstNode[];
    showLegend?: boolean;
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
    const total = arrayReduce(nodes, (sum, node) => sum + node.value, 0);

    if (total === 0) return [];

    const scale = scaleContinuous([0, total], [startAngle, endAngle], {
        clamp: true,
    });

    let currentAngle = startAngle;
    const result: FlattenedArc[] = [];

    arrayForEach(nodes, node => {
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

export class SunburstChart extends Chart<SunburstChartOptions> {

    private groups: Group[] = [];
    private tooltip: Tooltip;
    private legend?: Legend;

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
            const padding = this.getPadding();

            // Pre-resolve top-level node colors so legend and arcs stay in sync
            const resolvedColors = new Map<string, string>();

            arrayForEach(data, node => {
                resolvedColors.set(node.id, node.color ?? colorGenerator.next().value!);
            });

            // Compute legend bounds early to reserve space
            let legendHeight = 0;

            if (this.options.showLegend !== false && data.length > 0) {
                const legendItems: LegendItem[] = arrayMap(data, node => ({
                    id: node.id,
                    label: node.label,
                    color: resolvedColors.get(node.id)!,
                    active: true,
                }));

                if (!this.legend) {
                    this.legend = new Legend({
                        scene: this.scene,
                        renderer: this.renderer,
                        items: legendItems,
                        position: 'bottom',
                        onToggle: () => this.render(),
                    });
                } else {
                    this.legend.update(legendItems);
                }

                const legendWidth = scene.width - padding.left - padding.right;
                legendHeight = this.legend.getBoundingBox(legendWidth).height;
            }

            const cx = scene.width / 2;
            const cy = (scene.height - legendHeight) / 2;
            const size = Math.min(
                scene.width - padding.left - padding.right,
                scene.height - padding.top - padding.bottom - legendHeight
            );

            const offset = TAU / 4;
            const arcs = flattenNodes(data, 0, -offset, TAU - offset, colorGenerator, undefined, resolvedColors);

            // Find max depth
            let maxDepth = 0;

            arrayForEach(arcs, arc => {
                maxDepth = Math.max(maxDepth, arc.depth);
            });

            const ringWidth = (size * 0.45) / (maxDepth + 1);
            const innerBaseRadius = size * 0.08;

            const {
                left: entries,
                inner: updates,
                right: exits,
            } = arrayJoin(arcs, this.groups, (arc, group) => arc.id === group.id);

            arrayForEach(exits, el => el.destroy());

            const entryGroups = arrayMap(entries, arc => {
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
                    fillStyle: setColorAlpha(arc.color, 0.65),
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
                        duration: this.getAnimationDuration(300),
                        ease: easeOutQuart,
                        state: {
                            fillStyle: arc.color,
                        },
                    });

                    segment.on('mouseleave', () => {
                        this.tooltip.hide();

                        renderer.transition(segment, {
                            duration: this.getAnimationDuration(300),
                            ease: easeOutQuart,
                            state: {
                                fillStyle: setColorAlpha(arc.color, 0.65),
                            },
                        });
                    });
                });

                return createGroup({
                    id: arc.id,
                    children: [segment],
                });
            });

            const updateGroups = arrayMap(updates, ([arc, group]) => {
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
                        fillStyle: setColorAlpha(arc.color, 0.65),
                        strokeStyle: arc.color,
                    } as Partial<ArcState>;
                }

                return group;
            });

            scene.add(entryGroups);

            this.groups = [
                ...entryGroups,
                ...updateGroups,
            ];

            // Render legend
            if (this.legend && legendHeight > 0) {
                const legendWidth = scene.width - padding.left - padding.right;
                this.legend.render(padding.left, scene.height - legendHeight, legendWidth);
            }

            // Animate entries
            const entryArcs = arrayFlatMap(entryGroups, g => g.getElementsByType('arc')) as Arc[];

            const entriesTransition = renderer.transition(entryArcs, (element, index, length) => ({
                duration: this.getAnimationDuration(1000),
                delay: index * (this.getAnimationDuration(800) / length),
                ease: easeOutQuint,
                state: element.data as Partial<ArcState>,
            }));

            // Animate updates
            const updateArcs = arrayFlatMap(updateGroups, g => g.getElementsByType('arc')) as Arc[];

            const updatesTransition = renderer.transition(updateArcs, element => ({
                duration: this.getAnimationDuration(1000),
                ease: easeOutQuint,
                state: element.data as Partial<ArcState>,
            }));

            return Promise.all([entriesTransition, updatesTransition]);
        });
    }

}

export function createSunburstChart(target: string | HTMLElement | Context, options: SunburstChartOptions) {
    return new SunburstChart(target, options);
}
