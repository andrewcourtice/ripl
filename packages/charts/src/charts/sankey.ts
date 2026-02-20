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
    Context,
    createGroup,
    createRect,
    createText,
    easeOutCubic,
    easeOutQuart,
    Group,
    Rect,
    RectState,
    setColorAlpha,
} from '@ripl/core';

import {
    createSankeyLink,
    SankeyLinkPath,
} from '../elements';

import {
    arrayForEach,
    arrayJoin,
    arrayMap,
} from '@ripl/utilities';

export interface SankeyLink {
    source: string;
    target: string;
    value: number;
}

export interface SankeyNode {
    id: string;
    label: string;
    color?: string;
}

export interface SankeyChartOptions extends BaseChartOptions {
    nodes: SankeyNode[];
    links: SankeyLink[];
    nodeWidth?: number;
    nodePadding?: number;
    iterations?: number;
}

interface LayoutNode {
    id: string;
    label: string;
    color: string;
    x: number;
    y: number;
    width: number;
    height: number;
    depth: number;
    value: number;
    sourceY: number;
    targetY: number;
}

interface LayoutLink {
    id: string;
    source: LayoutNode;
    target: LayoutNode;
    value: number;
    sourceY: number;
    targetY: number;
    width: number;
    color: string;
}

interface SankeyLayoutResult {
    layoutNodes: LayoutNode[];
    layoutLinks: LayoutLink[];
}

function computeSankeyLayout(
    nodes: SankeyNode[],
    links: SankeyLink[],
    width: number,
    height: number,
    nodeWidth: number,
    nodePadding: number,
    colorGenerator: ReturnType<typeof getColorGenerator>
): SankeyLayoutResult {
    // Assign depths via BFS
    const depthMap = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    arrayForEach(nodes, node => {
        adjacency.set(node.id, []);
    });

    arrayForEach(links, link => {
        const targets = adjacency.get(link.source) ?? [];
        targets.push(link.target);
        adjacency.set(link.source, targets);
    });

    // Find source nodes (no incoming links)
    const targetSet = new Set(links.map(l => l.target));
    const sourceNodes = nodes.filter(n => !targetSet.has(n.id));

    const queue = sourceNodes.map(n => n.id);
    const visited = new Set<string>();

    arrayForEach(queue, id => {
        depthMap.set(id, 0);
    });

    let qi = 0;

    while (qi < queue.length) {
        const current = queue[qi++];

        if (visited.has(current)) continue;
        visited.add(current);

        const targets = adjacency.get(current) ?? [];
        const currentDepth = depthMap.get(current) ?? 0;

        arrayForEach(targets, target => {
            const existingDepth = depthMap.get(target) ?? 0;
            depthMap.set(target, Math.max(existingDepth, currentDepth + 1));

            if (!visited.has(target)) {
                queue.push(target);
            }
        });
    }

    // Assign any unvisited nodes
    arrayForEach(nodes, node => {
        if (!depthMap.has(node.id)) {
            depthMap.set(node.id, 0);
        }
    });

    const maxDepth = Math.max(...Array.from(depthMap.values()), 0);

    // Compute node values
    const nodeValueMap = new Map<string, number>();

    arrayForEach(nodes, node => {
        const outgoing = links.filter(l => l.source === node.id).reduce((s, l) => s + l.value, 0);
        const incoming = links.filter(l => l.target === node.id).reduce((s, l) => s + l.value, 0);
        nodeValueMap.set(node.id, Math.max(outgoing, incoming));
    });

    // Position nodes
    const depthGroups = new Map<number, string[]>();

    arrayForEach(nodes, node => {
        const depth = depthMap.get(node.id) ?? 0;
        const group = depthGroups.get(depth) ?? [];
        group.push(node.id);
        depthGroups.set(depth, group);
    });

    const xStep = maxDepth > 0 ? (width - nodeWidth) / maxDepth : 0;
    const layoutNodeMap = new Map<string, LayoutNode>();

    depthGroups.forEach((nodeIds, depth) => {
        const totalValue = nodeIds.reduce((sum, id) => sum + (nodeValueMap.get(id) ?? 0), 0);
        const availableHeight = height - nodePadding * (nodeIds.length - 1);
        let currentY = 0;

        arrayForEach(nodeIds, nodeId => {
            const nodeConfig = nodes.find(n => n.id === nodeId);
            const value = nodeValueMap.get(nodeId) ?? 0;
            const nodeHeight = totalValue > 0 ? (value / totalValue) * availableHeight : availableHeight / nodeIds.length;
            const color = nodeConfig?.color ?? colorGenerator.next().value!;

            layoutNodeMap.set(nodeId, {
                id: nodeId,
                label: nodeConfig?.label ?? nodeId,
                color,
                x: depth * xStep,
                y: currentY,
                width: nodeWidth,
                height: Math.max(nodeHeight, 2),
                depth,
                value,
                sourceY: currentY,
                targetY: currentY,
            });

            currentY += nodeHeight + nodePadding;
        });
    });

    const layoutNodes = Array.from(layoutNodeMap.values());

    // Compute link positions
    const sourceOffsets = new Map<string, number>();
    const targetOffsets = new Map<string, number>();

    const layoutLinks: LayoutLink[] = arrayMap(links, link => {
        const source = layoutNodeMap.get(link.source)!;
        const target = layoutNodeMap.get(link.target)!;

        if (!source || !target) {
            return null as unknown as LayoutLink;
        }

        const sourceValue = nodeValueMap.get(link.source) ?? 1;
        const targetValue = nodeValueMap.get(link.target) ?? 1;
        const linkWidth = Math.max((link.value / sourceValue) * source.height, 1);

        const sourceOffset = sourceOffsets.get(link.source) ?? 0;
        const targetOffset = targetOffsets.get(link.target) ?? 0;

        const sourceY = source.y + sourceOffset + linkWidth / 2;
        const targetY = target.y + targetOffset + (link.value / targetValue) * target.height / 2;

        sourceOffsets.set(link.source, sourceOffset + linkWidth);
        targetOffsets.set(link.target, targetOffset + (link.value / targetValue) * target.height);

        return {
            id: `${link.source}-${link.target}`,
            source,
            target,
            value: link.value,
            sourceY,
            targetY,
            width: linkWidth,
            color: source.color,
        };
    }).filter(Boolean);

    return {
        layoutNodes,
        layoutLinks,
    };
}

export class SankeyChart extends Chart<SankeyChartOptions> {

    private nodeGroups: Group[] = [];
    private linkGroups: Group[] = [];
    private tooltip: Tooltip;

    constructor(target: string | HTMLElement | Context, options: SankeyChartOptions) {
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
                nodes,
                links,
                nodeWidth = 20,
                nodePadding = 10,
            } = this.options;

            const colorGenerator = getColorGenerator();
            const padding = this.getPadding();
            const chartWidth = scene.width - padding.left - padding.right;
            const chartHeight = scene.height - padding.top - padding.bottom;

            const { layoutNodes, layoutLinks } = computeSankeyLayout(
                nodes,
                links,
                chartWidth,
                chartHeight,
                nodeWidth,
                nodePadding,
                colorGenerator
            );

            // Draw links
            const {
                left: linkEntries,
                inner: linkUpdates,
                right: linkExits,
            } = arrayJoin(layoutLinks, this.linkGroups, (link, group) => link.id === group.id);

            arrayForEach(linkExits, group => group.destroy());

            const linkEntryGroups = arrayMap(linkEntries, link => {
                const sx = padding.left + link.source.x + link.source.width;
                const sy = padding.top + link.sourceY;
                const tx = padding.left + link.target.x;
                const ty = padding.top + link.targetY;
                const midX = (sx + tx) / 2;

                const linkEl = createSankeyLink({
                    id: `${link.id}-link`,
                    sx,
                    sy,
                    tx,
                    ty,
                    strokeStyle: setColorAlpha(link.color, 0.3),
                    lineWidth: Math.max(link.width, 4),
                    pointerEvents: 'stroke',
                    globalAlpha: 0,
                    data: {
                        globalAlpha: 1,
                    },
                });

                linkEl.on('mouseenter', () => {
                    this.tooltip.show(midX, (sy + ty) / 2, `${link.source.label} → ${link.target.label}: ${link.value}`);

                    renderer.transition(linkEl, {
                        duration: this.getAnimationDuration(200),
                        ease: easeOutQuart,
                        state: {
                            strokeStyle: setColorAlpha(link.color, 0.6),
                        },
                    });

                    linkEl.on('mouseleave', () => {
                        this.tooltip.hide();

                        renderer.transition(linkEl, {
                            duration: this.getAnimationDuration(200),
                            ease: easeOutQuart,
                            state: {
                                strokeStyle: setColorAlpha(link.color, 0.3),
                            },
                        });
                    });
                });

                return createGroup({
                    id: link.id,
                    children: [linkEl],
                });
            });

            const linkUpdateGroups = arrayMap(linkUpdates, ([, group]) => group);

            scene.add(linkEntryGroups);

            this.linkGroups = [
                ...linkEntryGroups,
                ...linkUpdateGroups,
            ];

            // Draw nodes
            const {
                left: nodeEntries,
                inner: nodeUpdates,
                right: nodeExits,
            } = arrayJoin(layoutNodes, this.nodeGroups, (node, group) => node.id === group.id);

            arrayForEach(nodeExits, group => group.destroy());

            const nodeEntryGroups = arrayMap(nodeEntries, node => {
                const rect = createRect({
                    id: `${node.id}-rect`,
                    x: padding.left + node.x,
                    y: padding.top + node.y,
                    width: node.width,
                    height: 0,
                    fillStyle: setColorAlpha(node.color, 0.8),
                    borderRadius: 2,
                    data: {
                        height: node.height,
                        fillStyle: setColorAlpha(node.color, 0.8),
                    } as RectState,
                });

                rect.on('mouseenter', () => {
                    this.tooltip.show(
                        padding.left + node.x + node.width / 2,
                        padding.top + node.y,
                        `${node.label}: ${node.value}`
                    );

                    renderer.transition(rect, {
                        duration: this.getAnimationDuration(200),
                        ease: easeOutQuart,
                        state: {
                            fillStyle: node.color,
                        },
                    });

                    rect.on('mouseleave', () => {
                        this.tooltip.hide();

                        renderer.transition(rect, {
                            duration: this.getAnimationDuration(200),
                            ease: easeOutQuart,
                            state: {
                                fillStyle: setColorAlpha(node.color, 0.8),
                            },
                        });
                    });
                });

                const label = createText({
                    id: `${node.id}-label`,
                    x: padding.left + node.x + node.width + 5,
                    y: padding.top + node.y + node.height / 2,
                    content: node.label,
                    fillStyle: '#333',
                    font: '11px sans-serif',
                    textAlign: 'left',
                    textBaseline: 'middle',
                    globalAlpha: 0,
                    data: {
                        globalAlpha: 1,
                    },
                });

                return createGroup({
                    id: node.id,
                    children: [rect, label],
                });
            });

            const nodeUpdateGroups = arrayMap(nodeUpdates, ([node, group]) => {
                const rect = group.getElementsByType('rect')[0] as Rect;

                if (rect) {
                    rect.data = {
                        x: padding.left + node.x,
                        y: padding.top + node.y,
                        width: node.width,
                        height: node.height,
                        fillStyle: setColorAlpha(node.color, 0.8),
                    } as RectState;
                }

                return group;
            });

            scene.add(nodeEntryGroups);

            this.nodeGroups = [
                ...nodeEntryGroups,
                ...nodeUpdateGroups,
            ];

            // Animate
            const linkPaths = linkEntryGroups.flatMap(g => g.getElementsByType('sankey-link')) as SankeyLinkPath[];

            const linksTransition = renderer.transition(linkPaths, (element, index, length) => ({
                duration: this.getAnimationDuration(800),
                delay: this.getAnimationDuration(200) + index * (this.getAnimationDuration(600) / length),
                ease: easeOutCubic,
                state: element.data as Record<string, unknown>,
            }));

            const nodeRects = nodeEntryGroups.flatMap(g => g.getElementsByType('rect')) as Rect[];

            const nodesTransition = renderer.transition(nodeRects, (element, index, length) => ({
                duration: this.getAnimationDuration(800),
                delay: index * (this.getAnimationDuration(400) / length),
                ease: easeOutCubic,
                state: element.data as RectState,
            }));

            const nodeLabels = nodeEntryGroups.flatMap(g => g.getElementsByType('text'));

            const labelsTransition = renderer.transition(nodeLabels, (element, index, length) => ({
                duration: this.getAnimationDuration(500),
                delay: this.getAnimationDuration(400) + index * (this.getAnimationDuration(400) / length),
                ease: easeOutCubic,
                state: (element.data ?? {}) as Record<string, unknown>,
            }));

            const updateRects = nodeUpdateGroups.flatMap(g => g.getElementsByType('rect')) as Rect[];

            const updatesTransition = renderer.transition(updateRects, element => ({
                duration: this.getAnimationDuration(800),
                ease: easeOutCubic,
                state: element.data as RectState,
            }));

            return Promise.all([
                linksTransition,
                nodesTransition,
                labelsTransition,
                updatesTransition,
            ]);
        });
    }

}

export function createSankeyChart(target: string | HTMLElement | Context, options: SankeyChartOptions) {
    return new SankeyChart(target, options);
}
