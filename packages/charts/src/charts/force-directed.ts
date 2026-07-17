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
    createSegmentLabel,
} from '../core/labels';

import {
    applyHoverHighlight,
} from '../core/interaction';

import {
    ANIMATION_REFERENCE,
} from '../core/animation';

import type {
    ForceLink,
    ForceNode,
} from '../core/force';

import {
    simulateForce,
} from '../core/force';

import {
    Tooltip,
} from '../components/tooltip';

import type {
    LegendItem,
} from '../components/legend';

import type {
    Circle,
    CircleState,
    Context,
    EventMap,
    Group,
    Line,
    LineState,
    Text,
} from '@ripl/core';

import {
    createCircle,
    createGroup,
    createLine,
    easeOutBack,
    easeOutCubic,
    getExtent,
    setColorAlpha,
} from '@ripl/core';

import {
    arrayJoin,
    functionIdentity,
} from '@ripl/utilities';

/** Opacity applied to a node's fill at rest (full opacity on hover). */
const REST_ALPHA = 0.85;

/** A node in a force-directed network. */
export interface ForceNetworkNode<TData = unknown> {
    /** Unique identifier for the node, referenced by links and used for data joins. */
    id: string;
    /** Text shown beneath the node; defaults to the node's id. */
    label?: string;
    /** Optional magnitude used to size the node; defaults to the node's link degree. */
    value?: number;
    /** Optional grouping — nodes in the same group share a color. */
    group?: string;
    /** Explicit node colour; falls back to the group/palette colour when omitted. */
    color?: string;
    /** Arbitrary datum carried through to node interaction events. */
    data?: TData;
}

/** A link between two nodes. */
export interface ForceNetworkLink {
    /** Id of the node the link starts from. */
    source: string;
    /** Id of the node the link connects to. */
    target: string;
    /** Optional weight; scales the link's line width. */
    value?: number;
}

/** Options for configuring a {@link ForceDirectedChart}. */
export interface ForceDirectedChartOptions<TData = unknown> extends BaseChartOptions {
    /** The nodes in the network. */
    nodes: ForceNetworkNode<TData>[];
    /** The links (edges) connecting pairs of nodes. */
    links: ForceNetworkLink[];
    /** Base node radius (nodes with a `value` scale around this). Defaults to 8. */
    nodeRadius?: number;
    /** Force tuning. */
    charge?: number;
    /** Target resting distance between two linked nodes. */
    linkDistance?: number;
    /** Strength pulling linked nodes toward `linkDistance`. */
    linkStrength?: number;
    /** Strength pulling all nodes toward the layout centre. */
    centerStrength?: number;
    /** Number of simulation iterations run before the layout is drawn. */
    iterations?: number;
    /** Id of the node the layout springs out from on entry. Defaults to the highest-degree node. */
    root?: string;
    /** Legend configuration. Shown automatically when there is more than one node group; pass `false` to hide. */
    legend?: ChartLegendInput;
    /** Format applied to node/link values shown as text (e.g. tooltips). */
    format?: ValueFormatInput;
}

/** Payload emitted for force-directed node interaction events. */
export interface ForceDirectedNodeEvent<TData = unknown> {
    /** The x coordinate (in chart pixels) of the node. */
    x: number;
    /** The y coordinate (in chart pixels) of the node. */
    y: number;
    /** The id of the interacted node. */
    id: string;
    /** The label of the interacted node. */
    label: string;
    /** The node's size value (its `value`, or link degree when none was given). */
    value: number;
    /** The datum from the source {@link ForceNetworkNode}, if one was provided. */
    data?: TData;
}

/** Payload emitted for force-directed link interaction events. */
export interface ForceDirectedLinkEvent {
    /** The x coordinate (in chart pixels) of the link's midpoint. */
    x: number;
    /** The y coordinate (in chart pixels) of the link's midpoint. */
    y: number;
    /** Id of the link's source node. */
    source: string;
    /** Id of the link's target node. */
    target: string;
    /** The link's weight (0 when none was provided). */
    value: number;
}

/** Events emitted by a {@link ForceDirectedChart} that consumers can subscribe to via `chart.on(...)`. */
export interface ForceDirectedChartEventMap<TData = unknown> extends EventMap {
    /** Emitted when a node is clicked. */
    nodeclick: ForceDirectedNodeEvent<TData>;
    /** Emitted when the pointer enters a node. */
    nodeenter: ForceDirectedNodeEvent<TData>;
    /** Emitted when the pointer leaves a node. */
    nodeleave: ForceDirectedNodeEvent<TData>;
    /** Emitted when a link is clicked. */
    linkclick: ForceDirectedLinkEvent;
    /** Emitted when the pointer enters a link. */
    linkenter: ForceDirectedLinkEvent;
    /** Emitted when the pointer leaves a link. */
    linkleave: ForceDirectedLinkEvent;
}

interface PlacedNode {
    id: string;
    label: string;
    value: number;
    color: string;
    x: number;
    y: number;
    r: number;
}

/**
 * Force-directed network chart laying out nodes and links with a settling physics simulation.
 *
 * Runs a deterministic charge/link/centre simulation to position the graph, then scales it to fit
 * the plot area. Nodes are circles (sized by value or degree), links are lines (width by value), with
 * labels, tooltips, typed node/link interaction events, and animated entry/update/exit transitions.
 */
export class ForceDirectedChart<TData = unknown> extends Chart<ForceDirectedChartOptions<TData>, ForceDirectedChartEventMap<TData>> {

    private _nodesGroup?: Group;
    private _linksGroup?: Group;
    private _nodeElements: Group[] = [];
    private _linkElements: Line[] = [];
    private _tooltip: Tooltip;
    /** Last settled sim-space positions per node id, so reweights relax from the previous layout. */
    private _positions = new Map<string, { x: number;
        y: number; }>();

    constructor(target: string | HTMLElement | Context, options: ForceDirectedChartOptions<TData>) {
        super(target, options);

        this._tooltip = new Tooltip({
            scene: this.scene,
            renderer: this.renderer,
        });

        this.init();
    }

    private _attachNodeHover(circle: Circle, node: PlacedNode, content: string) {

        const payload = (point: { x: number;
            y: number; }): ForceDirectedNodeEvent<TData> => ({
            x: point.x,
            y: point.y,
            id: node.id,
            label: node.label,
            value: node.value,
            data: this.options.nodes.find(candidate => candidate.id === node.id)?.data,
        });

        applyHoverHighlight(circle, {
            renderer: this.renderer,
            animation: () => this.resolveAnimation(ANIMATION_REFERENCE.hover),
            tooltip: this._tooltip,
            anchor: () => ({
                x: circle.cx,
                y: circle.cy - node.r,
            }),
            content: () => content,
            highlight: { fill: node.color },
            restore: { fill: setColorAlpha(node.color, REST_ALPHA) },
            onEnter: point => this.emit('nodeenter', payload(point)),
            onLeave: point => this.emit('nodeleave', payload(point)),
            onClick: point => this.emit('nodeclick', payload(point)),
        });
    }

    private _attachLinkHover(line: Line, link: ForceNetworkLink, content: string) {

        const payload = (point: { x: number;
            y: number; }): ForceDirectedLinkEvent => ({
            x: point.x,
            y: point.y,
            source: link.source,
            target: link.target,
            value: link.value ?? 0,
        });

        applyHoverHighlight(line, {
            renderer: this.renderer,
            animation: () => this.resolveAnimation(ANIMATION_REFERENCE.hover),
            tooltip: this._tooltip,
            anchor: () => ({
                x: (line.x1 + line.x2) / 2,
                y: (line.y1 + line.y2) / 2,
            }),
            content: () => content,
            highlight: { stroke: '#94a3b8' },
            restore: { stroke: '#cbd5e1' },
            onEnter: point => this.emit('linkenter', payload(point)),
            onLeave: point => this.emit('linkleave', payload(point)),
            onClick: point => this.emit('linkclick', payload(point)),
        });
    }

    public async render() {
        return super.render(async () => {
            const {
                nodes,
                links,
                nodeRadius = 8,
                charge,
                linkDistance,
                linkStrength,
                centerStrength,
                iterations,
            } = this.options;

            const formatValue = resolveValueFormat(this.options.format);

            // Color nodes by group (shared) or by id.
            this.resolveSeriesColors(nodes.map(node => ({
                id: node.group ?? node.id,
                color: node.color,
            })));

            const colorFor = (node: ForceNetworkNode) => node.color ?? this.getSeriesColor(node.group ?? node.id);

            const layout = this.createLayout();
            this.reserveTitle(layout);

            // One legend entry per distinct node group (or per node when ungrouped), using the
            // group's/node's resolved colour.
            const legendSeen = new Set<string>();
            const legendItems: LegendItem[] = [];

            nodes.forEach(node => {
                const legendId = node.group ?? node.id;

                if (legendSeen.has(legendId)) {
                    return;
                }

                legendSeen.add(legendId);
                legendItems.push({
                    id: legendId,
                    label: node.group ?? node.label ?? node.id,
                    color: this.getSeriesColor(legendId),
                    active: true,
                });
            });

            this.reserveLegend(layout, legendItems, this.options.legend);

            const area = layout.area;

            // Node degree (for sizing when no value is given).
            const degree = new Map<string, number>();
            links.forEach(link => {
                degree.set(link.source, (degree.get(link.source) ?? 0) + 1);
                degree.set(link.target, (degree.get(link.target) ?? 0) + 1);
            });

            const sizeValue = (node: ForceNetworkNode) => node.value ?? (degree.get(node.id) ?? 1);
            const sizes = nodes.map(sizeValue);
            const [sMin, sMax] = sizes.length ? getExtent(sizes, functionIdentity) : [1, 1];
            const nodeRadiusFor = (node: ForceNetworkNode) => {
                const ratio = sMax > sMin ? (sizeValue(node) - sMin) / (sMax - sMin) : 0.5;
                return nodeRadius * (0.7 + ratio * 0.9);
            };

            // Run the (deterministic) simulation centred on the origin, then fit to the area. Seed
            // existing nodes from their last settled positions so a reweight relaxes from the current
            // layout (nodes glide to new spots) rather than re-seeding from scratch (a full reshuffle).
            const simNodes: ForceNode[] = nodes.map(node => {
                const previous = this._positions.get(node.id);
                return {
                    id: node.id,
                    x: previous?.x ?? 0,
                    y: previous?.y ?? 0,
                    vx: 0,
                    vy: 0,
                };
            });
            const simLinks: ForceLink[] = links.map(link => ({
                source: link.source,
                target: link.target,
            }));

            simulateForce(simNodes, simLinks, {
                charge,
                linkDistance,
                linkStrength,
                centerStrength,
                iterations,
                centerX: 0,
                centerY: 0,
            });

            // Persist the settled positions (and drop nodes that no longer exist) for the next render.
            this._positions = new Map(simNodes.map(node => [node.id, {
                x: node.x,
                y: node.y,
            }]));

            const simById = new Map(simNodes.map(node => [node.id, node]));

            const xs = simNodes.map(node => node.x);
            const ys = simNodes.map(node => node.y);
            const [minX, maxX] = xs.length ? getExtent(xs, functionIdentity) : [-1, 1];
            const [minY, maxY] = ys.length ? getExtent(ys, functionIdentity) : [-1, 1];
            const maxNodeR = Math.max(nodeRadius, ...nodes.map(nodeRadiusFor));
            const spanX = Math.max(1e-3, maxX - minX);
            const spanY = Math.max(1e-3, maxY - minY);
            const pad = maxNodeR + 12;
            const scale = Math.min((area.width - 2 * pad) / spanX, (area.height - 2 * pad) / spanY);
            const cx = area.x + area.width / 2;
            const cy = area.y + area.height / 2;
            const midX = (minX + maxX) / 2;
            const midY = (minY + maxY) / 2;

            const placed = new Map<string, PlacedNode>();

            nodes.forEach(node => {
                const sim = simById.get(node.id)!;
                placed.set(node.id, {
                    id: node.id,
                    label: node.label ?? node.id,
                    value: sizeValue(node),
                    color: colorFor(node),
                    x: cx + (sim.x - midX) * scale,
                    y: cy + (sim.y - midY) * scale,
                    r: nodeRadiusFor(node),
                });
            });

            // Root + BFS depth drive the springy entry: nodes spring out from the root in waves, each
            // wave delayed by its graph distance so the layout unfolds from the centre outward.
            const adjacency = new Map<string, string[]>();
            nodes.forEach(node => adjacency.set(node.id, []));
            links.forEach(link => {
                adjacency.get(link.source)?.push(link.target);
                adjacency.get(link.target)?.push(link.source);
            });

            const rootId = this.options.root && placed.has(this.options.root)
                ? this.options.root
                : nodes.reduce<ForceNetworkNode | undefined>((best, node) => (
                    !best || (degree.get(node.id) ?? 0) > (degree.get(best.id) ?? 0) ? node : best
                ), undefined)?.id;

            const depthById = new Map<string, number>();
            if (rootId) {
                const queue = [rootId];
                depthById.set(rootId, 0);

                while (queue.length) {
                    const current = queue.shift()!;
                    const nextDepth = depthById.get(current)! + 1;

                    (adjacency.get(current) ?? []).forEach(neighbour => {
                        if (!depthById.has(neighbour)) {
                            depthById.set(neighbour, nextDepth);
                            queue.push(neighbour);
                        }
                    });
                }
            }

            const maxDepth = depthById.size ? Math.max(...depthById.values()) : 0;
            const depthOf = (id: string) => depthById.get(id) ?? maxDepth + 1;

            const rootPlaced = rootId ? placed.get(rootId) : undefined;
            const springOriginX = rootPlaced?.x ?? cx;
            const springOriginY = rootPlaced?.y ?? cy;

            const enter = this.resolveAnimation(ANIMATION_REFERENCE.enter);
            const update = this.resolveAnimation(ANIMATION_REFERENCE.update);
            // Each graph-distance ring waits ~18% of the entry duration behind the previous one.
            const springDelay = (id: string) => depthOf(id) * enter.duration * 0.18;

            // --- Links (drawn under the nodes) ---
            if (!this._linksGroup) {
                this._linksGroup = createGroup({
                    id: 'force-links',
                    class: 'force-links',
                    zIndex: 0,
                });
                this.scene.add(this._linksGroup);
            }

            const linkValues = links.map(link => link.value ?? 1);
            const [, linkMax] = linkValues.length ? getExtent(linkValues, functionIdentity) : [0, 1];
            const linkWidth = (link: ForceNetworkLink) => 1 + ((link.value ?? 1) / (linkMax || 1)) * 3;
            const linkId = (link: ForceNetworkLink) => `link-${link.source}~${link.target}`;

            const {
                left: linkEntries,
                inner: linkUpdates,
                right: linkExits,
            } = arrayJoin(links, this._linkElements, (link, line) => line.id === linkId(link));

            linkExits.forEach(el => el.destroy());

            const linkEndpoints = (link: ForceNetworkLink) => {
                const source = placed.get(link.source);
                const target = placed.get(link.target);
                return {
                    x1: source?.x ?? cx,
                    y1: source?.y ?? cy,
                    x2: target?.x ?? cx,
                    y2: target?.y ?? cy,
                };
            };

            // The endpoint nearer the root is the one the link grows out from during entry.
            const linkOrigin = (link: ForceNetworkLink, ends: ReturnType<typeof linkEndpoints>) => (
                depthOf(link.source) <= depthOf(link.target)
                    ? {
                        x: ends.x1,
                        y: ends.y1,
                    }
                    : {
                        x: ends.x2,
                        y: ends.y2,
                    }
            );

            // Entry delay per new link, keyed by its element id — it draws once the ripple reaches its
            // root-ward endpoint (the shallower of its two nodes).
            const linkEntryDelays = new Map<string, number>();

            const newLinks = linkEntries.map(link => {
                const ends = linkEndpoints(link);
                const origin = linkOrigin(link, ends);
                linkEntryDelays.set(linkId(link), Math.min(depthOf(link.source), depthOf(link.target)) * enter.duration * 0.18);
                // Start collapsed at the root-ward node, then grow out to the full endpoints so the
                // link appears to draw itself toward the child as the ripple reaches it.
                const line = createLine({
                    id: linkId(link),
                    x1: origin.x,
                    y1: origin.y,
                    x2: origin.x,
                    y2: origin.y,
                    stroke: '#cbd5e1',
                    lineWidth: linkWidth(link),
                    opacity: 0,
                    data: {
                        ...ends,
                        opacity: 0.9,
                    } as Partial<LineState>,
                });

                this._attachLinkHover(line, link, `${link.source} → ${link.target}${link.value !== undefined ? `: ${formatValue(link.value)}` : ''}`);
                this._linksGroup!.add(line);

                return line;
            });

            linkUpdates.forEach(([link, line]) => {
                line.lineWidth = linkWidth(link);
                line.data = {
                    ...linkEndpoints(link),
                    opacity: 0.9,
                } as Partial<LineState>;
                this._attachLinkHover(line, link, `${link.source} → ${link.target}${link.value !== undefined ? `: ${formatValue(link.value)}` : ''}`);
            });

            this._linkElements = [
                ...newLinks,
                ...linkUpdates.map(([, line]) => line),
            ];

            // --- Nodes ---
            if (!this._nodesGroup) {
                this._nodesGroup = createGroup({
                    id: 'force-nodes',
                    class: 'force-nodes',
                    zIndex: 1,
                });
                this.scene.add(this._nodesGroup);
            }

            const {
                left: nodeEntries,
                inner: nodeUpdates,
                right: nodeExits,
            } = arrayJoin(nodes, this._nodeElements, (node, group) => group.id === `node-${node.id}`);

            nodeExits.forEach(group => group.destroy());

            const nodeContent = (node: PlacedNode) => `${node.label}: ${formatValue(node.value)}`;

            const entryNodeGroups = nodeEntries.map(node => {
                const placedNode = placed.get(node.id)!;
                const restFill = setColorAlpha(placedNode.color, REST_ALPHA);

                // Start each node at the root's position and spring it out to its settled spot.
                const circle = createCircle({
                    id: `node-${node.id}-circle`,
                    cx: springOriginX,
                    cy: springOriginY,
                    radius: 0,
                    fill: restFill,
                    stroke: '#ffffff',
                    lineWidth: 1.5,
                    data: {
                        cx: placedNode.x,
                        cy: placedNode.y,
                        radius: placedNode.r,
                        fill: restFill,
                    } as CircleState,
                });

                this._attachNodeHover(circle, placedNode, nodeContent(placedNode));

                const text = createSegmentLabel({
                    id: `node-${node.id}-label`,
                    x: springOriginX,
                    y: springOriginY,
                    content: placedNode.label,
                    fill: '#6b7280',
                    font: '10px sans-serif',
                });

                text.data = {
                    x: placedNode.x,
                    y: placedNode.y + placedNode.r + 8,
                    opacity: 1,
                };

                return createGroup({
                    id: `node-${node.id}`,
                    class: 'force-node',
                    children: [circle, text],
                });
            });

            const updateTexts: Text[] = [];

            nodeUpdates.forEach(([node, group]) => {
                const placedNode = placed.get(node.id)!;
                const restFill = setColorAlpha(placedNode.color, REST_ALPHA);
                const circle = group.getElementsByType('circle')[0] as Circle;
                const text = group.getElementsByType('text')[0] as Text | undefined;

                if (circle) {
                    circle.data = {
                        cx: placedNode.x,
                        cy: placedNode.y,
                        radius: placedNode.r,
                        fill: restFill,
                    } as CircleState;
                    this._attachNodeHover(circle, placedNode, nodeContent(placedNode));
                }

                if (text) {
                    text.content = placedNode.label;
                    text.data = {
                        x: placedNode.x,
                        y: placedNode.y + placedNode.r + 8,
                        opacity: 1,
                    };
                    updateTexts.push(text);
                }
            });

            entryNodeGroups.forEach(group => this._nodesGroup!.add(group));

            this._nodeElements = [
                ...entryNodeGroups,
                ...nodeUpdates.map(([, group]) => group),
            ];

            const entryCircles = entryNodeGroups.flatMap(group => group.getElementsByType('circle') as Circle[]);
            const entryLabels = entryNodeGroups.flatMap(group => group.getElementsByType('text') as Text[]);
            const updateCircles = nodeUpdates.flatMap(([, group]) => group.getElementsByType('circle') as Circle[]);

            // Recover a node id from a child element id (`node-<id>-circle` / `-label`) to look up its
            // spring delay — robust even when node ids contain dashes.
            const delayForChild = (elementId: string, suffix: string) => (
                springDelay(elementId.replace(/^node-/, '').replace(new RegExp(`-${suffix}$`), ''))
            );

            return Promise.all([
                newLinks.length ? this.renderer.transition(newLinks, element => ({
                    duration: enter.duration,
                    // Wait for the ripple to reach this link's root-ward endpoint before drawing it.
                    delay: linkEntryDelays.get((element as Line).id) ?? 0,
                    ease: easeOutCubic,
                    state: element.data as Partial<LineState>,
                })) : Promise.resolve(),
                linkUpdates.length ? this.renderer.transition(linkUpdates.map(([, line]) => line), element => ({
                    duration: update.duration,
                    ease: easeOutCubic,
                    state: element.data as Partial<LineState>,
                })) : Promise.resolve(),
                this.renderer.transition(entryCircles, element => ({
                    duration: enter.duration,
                    delay: delayForChild(element.id, 'circle'),
                    // Springy overshoot as each node arrives at its settled position.
                    ease: easeOutBack,
                    state: element.data as CircleState,
                })),
                entryLabels.length ? this.renderer.transition(entryLabels, element => ({
                    duration: enter.duration,
                    delay: delayForChild(element.id, 'label'),
                    ease: easeOutCubic,
                    state: (element.data ?? {}) as Record<string, unknown>,
                })) : Promise.resolve(),
                this.renderer.transition(updateCircles, element => ({
                    duration: update.duration,
                    ease: easeOutCubic,
                    state: element.data as CircleState,
                })),
                updateTexts.length ? this.renderer.transition(updateTexts, element => ({
                    duration: update.duration,
                    ease: easeOutCubic,
                    state: (element.data ?? {}) as Record<string, unknown>,
                })) : Promise.resolve(),
            ]);
        });
    }

}

/**
 * Factory function that creates a new {@link ForceDirectedChart} instance.
 *
 * @example
 * ```ts
 * createForceDirectedChart(target, {
 *     nodes: [
 *         { id: 'a', label: 'A' },
 *         { id: 'b', label: 'B' },
 *         { id: 'c', label: 'C' },
 *     ],
 *     links: [
 *         { source: 'a', target: 'b' },
 *         { source: 'a', target: 'c' },
 *     ],
 * });
 * ```
 */
export function createForceDirectedChart<TData = unknown>(target: string | HTMLElement | Context, options: ForceDirectedChartOptions<TData>) {
    return new ForceDirectedChart<TData>(target, options);
}
