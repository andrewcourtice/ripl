import type {
    BaseChartOptions,
} from '../core/chart';

import {
    Chart,
} from '../core/chart';

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

import {
    createSegmentLabel,
    SEGMENT_LABEL_OUTSIDE_FILL,
} from '../core/labels';

import {
    getColorGenerator,
} from '../constants/colors';

import {
    Tooltip,
} from '../components/tooltip';

import type {
    LegendItem,
} from '../components/legend';

import type {
    SankeyLinkPath,
    SankeyLinkState,
} from '../elements';

import {
    createSankeyLink,
} from '../elements';

import type {
    Context,
    EventMap,
    Group,
    Rect,
    RectState,
    Text,
    TextState,
} from '@ripl/core';

import {
    createGroup,
    createRect,
    easeOutCubic,
    setColorAlpha,
} from '@ripl/core';

import {
    arrayJoin,
    numberSum,
} from '@ripl/utilities';

/** A directional flow between two nodes in a Sankey diagram. */
export interface SankeyLink {
    /** Id of the node the flow originates from. */
    source: string;
    /** Id of the node the flow terminates at. */
    target: string;
    /** Magnitude of the flow, which determines the link's width. */
    value: number;
}

/** A node in a Sankey diagram, with an optional typed datum carried through to node events. */
export interface SankeyNode<TData = unknown> {
    /** Unique identifier for the node, referenced by link `source`/`target`. */
    id: string;
    /** Display label shown beside the node. */
    label: string;
    /** Optional colour override for the node (otherwise a palette colour is generated). */
    color?: string;
    /** Arbitrary datum carried through to node interaction events. */
    data?: TData;
}

/** Options for configuring a {@link SankeyChart}. */
export interface SankeyChartOptions<TData = unknown> extends BaseChartOptions {
    /** The nodes in the diagram. */
    nodes: SankeyNode<TData>[];
    /** The directional flows connecting nodes. */
    links: SankeyLink[];
    /** Width of each node rectangle in pixels. Defaults to 20. */
    nodeWidth?: number;
    /** Vertical gap between stacked nodes in a column, in pixels. Defaults to 10. */
    nodePadding?: number;
    /** Number of layout relaxation iterations (reserved for tuning node positioning). */
    iterations?: number;
    /** Legend configuration. Shown automatically when there is more than one node; pass `false` to hide. */
    legend?: ChartLegendInput;
    /** Format applied to node and link values shown as text (e.g. tooltips). */
    format?: ValueFormatInput;
}

/** Payload emitted for Sankey node interaction events. */
export interface SankeyChartNodeEvent<TData = unknown> {
    /** X position of the node's top-centre anchor, in canvas coordinates. */
    x: number;
    /** Y position of the node's top-centre anchor, in canvas coordinates. */
    y: number;
    /** The node's unique id. */
    id: string;
    /** The node's display label. */
    label: string;
    /** The node's total flow value. */
    value: number;
    /** The datum from the source {@link SankeyNode}, if one was provided. */
    data?: TData;
}

/** Payload emitted for Sankey link interaction events. */
export interface SankeyChartLinkEvent {
    /** X position of the link's mid-point anchor, in canvas coordinates. */
    x: number;
    /** Y position of the link's mid-point anchor, in canvas coordinates. */
    y: number;
    /** The link's unique id (`"<source>-<target>"`). */
    id: string;
    /** Display label of the link's source node. */
    sourceLabel: string;
    /** Display label of the link's target node. */
    targetLabel: string;
    /** The link's flow value. */
    value: number;
}

/** Events emitted by a {@link SankeyChart} that consumers can subscribe to via `chart.on(...)`. */
export interface SankeyChartEventMap<TData = unknown> extends EventMap {
    /** Emitted when a node is clicked. */
    nodeclick: SankeyChartNodeEvent<TData>;
    /** Emitted when the pointer enters a node. */
    nodeenter: SankeyChartNodeEvent<TData>;
    /** Emitted when the pointer leaves a node. */
    nodeleave: SankeyChartNodeEvent<TData>;
    /** Emitted when a link is clicked. */
    linkclick: SankeyChartLinkEvent;
    /** Emitted when the pointer enters a link. */
    linkenter: SankeyChartLinkEvent;
    /** Emitted when the pointer leaves a link. */
    linkleave: SankeyChartLinkEvent;
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
    nodeColors: Map<string, string>
): SankeyLayoutResult {
    // Assign depths via BFS
    const depthMap = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    nodes.forEach(node => {
        adjacency.set(node.id, []);
    });

    links.forEach(link => {
        const targets = adjacency.get(link.source) ?? [];
        targets.push(link.target);
        adjacency.set(link.source, targets);
    });

    // Find source nodes (no incoming links)
    const targetSet = new Set(links.map(l => l.target));
    const sourceNodes = nodes.filter(n => !targetSet.has(n.id));

    const queue = sourceNodes.map(n => n.id);
    const visited = new Set<string>();

    queue.forEach(id => {
        depthMap.set(id, 0);
    });

    let qi = 0;

    while (qi < queue.length) {
        const current = queue[qi++];

        if (visited.has(current)) continue;
        visited.add(current);

        const targets = adjacency.get(current) ?? [];
        const currentDepth = depthMap.get(current) ?? 0;

        targets.forEach(target => {
            const existingDepth = depthMap.get(target) ?? 0;
            depthMap.set(target, Math.max(existingDepth, currentDepth + 1));

            if (!visited.has(target)) {
                queue.push(target);
            }
        });
    }

    // Assign any unvisited nodes
    nodes.forEach(node => {
        if (!depthMap.has(node.id)) {
            depthMap.set(node.id, 0);
        }
    });

    const maxDepth = Math.max(...Array.from(depthMap.values()), 0);

    // Compute node values
    const nodeValueMap = new Map<string, number>();

    nodes.forEach(node => {
        const outgoing = numberSum(links.filter(l => l.source === node.id), l => l.value);
        const incoming = numberSum(links.filter(l => l.target === node.id), l => l.value);
        nodeValueMap.set(node.id, Math.max(outgoing, incoming));
    });

    // Position nodes
    const depthGroups = new Map<number, string[]>();

    nodes.forEach(node => {
        const depth = depthMap.get(node.id) ?? 0;
        const group = depthGroups.get(depth) ?? [];
        group.push(node.id);
        depthGroups.set(depth, group);
    });

    const xStep = maxDepth > 0 ? (width - nodeWidth) / maxDepth : 0;
    const layoutNodeMap = new Map<string, LayoutNode>();

    // A single global value→pixel scale shared by every column: the densest column must fit the
    // available height, and using one scale everywhere makes a link's width identical at its source
    // and target ends (so links tile the node edges instead of overlapping/gapping).
    let scale = Infinity;

    depthGroups.forEach(nodeIds => {
        const columnValue = numberSum(nodeIds, id => nodeValueMap.get(id) ?? 0);
        const availableHeight = height - nodePadding * (nodeIds.length - 1);

        if (columnValue > 0 && availableHeight > 0) {
            scale = Math.min(scale, availableHeight / columnValue);
        }
    });

    if (!Number.isFinite(scale)) {
        scale = 1;
    }

    depthGroups.forEach((nodeIds, depth) => {
        const columnValue = numberSum(nodeIds, id => nodeValueMap.get(id) ?? 0);
        const columnHeight = columnValue * scale + nodePadding * Math.max(nodeIds.length - 1, 0);
        // Centre each column's stack vertically within the plot area.
        let currentY = Math.max(0, (height - columnHeight) / 2);

        nodeIds.forEach(nodeId => {
            const nodeConfig = nodes.find(n => n.id === nodeId);
            const value = nodeValueMap.get(nodeId) ?? 0;
            const nodeHeight = Math.max(value * scale, 2);
            const color = nodeColors.get(nodeId) ?? '#a1afc4';

            layoutNodeMap.set(nodeId, {
                id: nodeId,
                label: nodeConfig?.label ?? nodeId,
                color,
                x: depth * xStep,
                y: currentY,
                width: nodeWidth,
                height: nodeHeight,
                depth,
                value,
                sourceY: currentY,
                targetY: currentY,
            });

            // Advance by the actual (clamped) height so sub-2px nodes don't drift.
            currentY += nodeHeight + nodePadding;
        });
    });

    const layoutNodes = Array.from(layoutNodeMap.values());

    // Compute link positions
    const sourceOffsets = new Map<string, number>();
    const targetOffsets = new Map<string, number>();

    const layoutLinks: LayoutLink[] = links.map(link => {
        const source = layoutNodeMap.get(link.source)!;
        const target = layoutNodeMap.get(link.target)!;

        if (!source || !target) {
            return null as unknown as LayoutLink;
        }

        // One global scale → the link's width is the same at both ends, so it tiles the node edges.
        const linkWidth = Math.max(link.value * scale, 1);

        const sourceOffset = sourceOffsets.get(link.source) ?? 0;
        const targetOffset = targetOffsets.get(link.target) ?? 0;

        const sourceY = source.y + sourceOffset + linkWidth / 2;
        const targetY = target.y + targetOffset + linkWidth / 2;

        sourceOffsets.set(link.source, sourceOffset + linkWidth);
        targetOffsets.set(link.target, targetOffset + linkWidth);

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
    }) as LayoutLink[];

    return {
        layoutNodes,
        layoutLinks: layoutLinks.filter(Boolean),
    };
}

/**
 * Sankey diagram visualizing directional flow between nodes.
 *
 * Nodes are positioned in depth columns computed via BFS, with heights
 * proportional to their total flow value. Links are rendered as curved
 * paths connecting source and target nodes. Supports tooltips and
 * staggered entry animations for nodes, labels, and links.
 */
export class SankeyChart<TData = unknown> extends Chart<SankeyChartOptions<TData>, SankeyChartEventMap<TData>> {

    private _nodeGroups: Group[] = [];
    private _linkGroups: Group[] = [];
    private _tooltip: Tooltip;

    constructor(target: string | HTMLElement | Context, options: SankeyChartOptions<TData>) {
        super(target, options);

        this._tooltip = new Tooltip({
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
            const nodeColors = new Map<string, string>();

            // Resolve a stable colour per node up-front so the legend swatches match the rendered
            // nodes (and honour any explicit per-node colour).
            nodes.forEach(node => {
                nodeColors.set(node.id, node.color ?? colorGenerator.next().value!);
            });

            const layout = this.createLayout();
            this.reserveTitle(layout);

            const legendItems: LegendItem[] = nodes.map(node => ({
                id: node.id,
                label: node.label,
                color: nodeColors.get(node.id)!,
                active: true,
            }));

            this.reserveLegend(layout, legendItems, this.options.legend);

            const area = layout.area;
            const offsetX = area.x;
            const offsetY = area.y;
            const chartWidth = area.width;
            const chartHeight = area.height;

            const { layoutNodes, layoutLinks } = computeSankeyLayout(
                nodes,
                links,
                chartWidth,
                chartHeight,
                nodeWidth,
                nodePadding,
                nodeColors
            );

            // Draw links
            const {
                left: linkEntries,
                inner: linkUpdates,
                right: linkExits,
            } = arrayJoin(layoutLinks, this._linkGroups, (link, group) => link.id === group.id);

            linkExits.forEach(el => el.destroy());

            const linkEntryGroups = linkEntries.map(link => {
                const sx = offsetX + link.source.x + link.source.width;
                const sy = offsetY + link.sourceY;
                const tx = offsetX + link.target.x;
                const ty = offsetY + link.targetY;
                const midX = (sx + tx) / 2;

                const linkEl = createSankeyLink({
                    id: `${link.id}-link`,
                    sx,
                    sy,
                    tx,
                    ty,
                    stroke: setColorAlpha(link.color, 0.3),
                    lineWidth: link.width,
                    pointerEvents: 'stroke',
                    opacity: 0,
                    data: {
                        opacity: 1,
                    },
                });

                this._attachLinkHover(linkEl, link, midX, (sy + ty) / 2);

                return createGroup({
                    id: link.id,
                    children: [linkEl],
                });
            });

            // Reposition existing links to their new geometry (previously the update path discarded
            // it, freezing links while nodes moved).
            const linkUpdateGroups = linkUpdates.map(([link, group]) => {
                const linkEl = group.getElementsByType('sankey-link')[0] as SankeyLinkPath;

                if (linkEl) {
                    const sx = offsetX + link.source.x + link.source.width;
                    const sy = offsetY + link.sourceY;
                    const tx = offsetX + link.target.x;
                    const ty = offsetY + link.targetY;

                    linkEl.stroke = setColorAlpha(link.color, 0.3);
                    linkEl.lineWidth = link.width;
                    linkEl.data = {
                        sx,
                        sy,
                        tx,
                        ty,
                        opacity: 1,
                    } as Partial<SankeyLinkState>;

                    this._attachLinkHover(linkEl, link, (sx + tx) / 2, (sy + ty) / 2);
                }

                return group;
            });

            scene.add(linkEntryGroups);

            this._linkGroups = [
                ...linkEntryGroups,
                ...linkUpdateGroups,
            ];

            // Draw nodes
            const {
                left: nodeEntries,
                inner: nodeUpdates,
                right: nodeExits,
            } = arrayJoin(layoutNodes, this._nodeGroups, (node, group) => node.id === group.id);

            nodeExits.forEach(el => el.destroy());

            const nodeEntryGroups = nodeEntries.map(node => {
                const rect = createRect({
                    id: `${node.id}-rect`,
                    x: offsetX + node.x,
                    y: offsetY + node.y,
                    width: node.width,
                    height: 0,
                    fill: setColorAlpha(node.color, 0.8),
                    borderRadius: 2,
                    data: {
                        height: node.height,
                        fill: setColorAlpha(node.color, 0.8),
                    } as RectState,
                });

                this._attachNodeHover(rect, node, offsetX + node.x + node.width / 2, offsetY + node.y);

                // Node labels sit to the right of the node (outside), so use the shared segment-label
                // helper with the outside fill — consistent with the other charts' labels.
                const label = createSegmentLabel({
                    id: `${node.id}-label`,
                    x: offsetX + node.x + node.width + 5,
                    y: offsetY + node.y + node.height / 2,
                    content: node.label,
                    fill: SEGMENT_LABEL_OUTSIDE_FILL,
                    textAlign: 'left',
                    textBaseline: 'middle',
                });

                label.data = { opacity: 1 } as Partial<TextState>;

                return createGroup({
                    id: node.id,
                    children: [rect, label],
                });
            });

            const nodeUpdateGroups = nodeUpdates.map(([node, group]) => {
                const rect = group.getElementsByType('rect')[0] as Rect;
                const label = group.getElementsByType('text')[0] as Text;

                if (rect) {
                    rect.data = {
                        x: offsetX + node.x,
                        y: offsetY + node.y,
                        width: node.width,
                        height: node.height,
                        fill: setColorAlpha(node.color, 0.8),
                    } as RectState;

                    this._attachNodeHover(rect, node, offsetX + node.x + node.width / 2, offsetY + node.y);
                }

                // Re-centre the label on the node's new position (was previously left stale).
                if (label) {
                    label.content = node.label;
                    label.data = {
                        x: offsetX + node.x + node.width + 5,
                        y: offsetY + node.y + node.height / 2,
                        opacity: 1,
                    } as Partial<TextState>;
                }

                return group;
            });

            scene.add(nodeEntryGroups);

            this._nodeGroups = [
                ...nodeEntryGroups,
                ...nodeUpdateGroups,
            ];

            // Legend hover highlights the node plus its incident links, dimming the rest. Node group
            // ids equal the node id; link group ids are `${source}-${target}`, owned by both ends.
            const linkOwners = new Map<string, string[]>();
            links.forEach(link => linkOwners.set(`${link.source}-${link.target}`, [link.source, link.target]));
            this.registerHighlightGroups(
                [...this._nodeGroups, ...this._linkGroups],
                group => linkOwners.get(group.id) ?? group.id
            );

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

            // Updates: nodes, their labels, and links all re-animate to their new geometry.
            const updateElements = [
                ...nodeUpdateGroups.flatMap(g => g.graph(false)),
                ...linkUpdateGroups.flatMap(g => g.getElementsByType('sankey-link')),
            ];

            const updatesTransition = renderer.transition(updateElements, element => ({
                duration: this.getAnimationDuration(800),
                ease: easeOutCubic,
                state: element.data as Record<string, unknown>,
            }));

            return Promise.all([
                linksTransition,
                nodesTransition,
                labelsTransition,
                updatesTransition,
            ]);
        });
    }

    private _attachLinkHover(linkEl: SankeyLinkPath, link: LayoutLink, anchorX: number, anchorY: number) {
        const formatValue = resolveValueFormat(this.options.format);

        const payload = (point: { x: number;
            y: number; }): SankeyChartLinkEvent => ({
            x: point.x,
            y: point.y,
            id: link.id,
            sourceLabel: link.source.label,
            targetLabel: link.target.label,
            value: link.value,
        });

        applyHoverHighlight(linkEl, {
            renderer: this.renderer,
            animation: () => this.resolveAnimation(ANIMATION_REFERENCE.hover),
            tooltip: this._tooltip,
            anchor: () => ({
                x: anchorX,
                y: anchorY,
            }),
            content: () => `${link.source.label} → ${link.target.label}: ${formatValue(link.value)}`,
            highlight: { stroke: setColorAlpha(link.color, 0.6) },
            restore: { stroke: setColorAlpha(link.color, 0.3) },
            onEnter: point => this.emit('linkenter', payload(point)),
            onLeave: point => this.emit('linkleave', payload(point)),
            onClick: point => this.emit('linkclick', payload(point)),
        });
    }

    private _attachNodeHover(rect: Rect, node: LayoutNode, anchorX: number, anchorY: number) {
        const formatValue = resolveValueFormat(this.options.format);

        const payload = (point: { x: number;
            y: number; }): SankeyChartNodeEvent<TData> => ({
            x: point.x,
            y: point.y,
            id: node.id,
            label: node.label,
            value: node.value,
            data: this.options.nodes.find(candidate => candidate.id === node.id)?.data,
        });

        applyHoverHighlight(rect, {
            renderer: this.renderer,
            animation: () => this.resolveAnimation(ANIMATION_REFERENCE.hover),
            tooltip: this._tooltip,
            anchor: () => ({
                x: anchorX,
                y: anchorY,
            }),
            content: () => `${node.label}: ${formatValue(node.value)}`,
            highlight: { fill: node.color },
            restore: { fill: setColorAlpha(node.color, 0.8) },
            onEnter: point => this.emit('nodeenter', payload(point)),
            onLeave: point => this.emit('nodeleave', payload(point)),
            onClick: point => this.emit('nodeclick', payload(point)),
        });
    }

}

/**
 * Factory function that creates a new {@link SankeyChart} instance.
 *
 * @example
 * ```ts
 * createSankeyChart(target, {
 *     nodes: [
 *         { id: 'a', label: 'Source' },
 *         { id: 'b', label: 'Process' },
 *         { id: 'c', label: 'Output' },
 *     ],
 *     links: [
 *         { source: 'a', target: 'b', value: 10 },
 *         { source: 'b', target: 'c', value: 6 },
 *     ],
 * });
 * ```
 */
export function createSankeyChart<TData = unknown>(target: string | HTMLElement | Context, options: SankeyChartOptions<TData>) {
    return new SankeyChart<TData>(target, options);
}
