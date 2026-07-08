import {
    BaseChartOptions,
    Chart,
} from '../core/chart';

import type {
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
    stagger,
} from '../core/animation';

import {
    ForceLink,
    ForceNode,
    simulateForce,
} from '../core/force';

import {
    Tooltip,
} from '../components/tooltip';

import {
    Circle,
    CircleState,
    Context,
    createCircle,
    createGroup,
    createLine,
    easeOutCubic,
    EventMap,
    getExtent,
    Group,
    Line,
    LineState,
    setColorAlpha,
    Text,
} from '@ripl/core';

import {
    arrayJoin,
    functionIdentity,
} from '@ripl/utilities';

/** Opacity applied to a node's fill at rest (full opacity on hover). */
const REST_ALPHA = 0.85;

/** A node in a force-directed network. */
export interface ForceNetworkNode {
    id: string;
    label?: string;
    value?: number;
    /** Optional grouping — nodes in the same group share a color. */
    group?: string;
    color?: string;
}

/** A link between two nodes. */
export interface ForceNetworkLink {
    source: string;
    target: string;
    value?: number;
}

/** Options for configuring a {@link ForceDirectedChart}. */
export interface ForceDirectedChartOptions extends BaseChartOptions {
    nodes: ForceNetworkNode[];
    links: ForceNetworkLink[];
    /** Base node radius (nodes with a `value` scale around this). Defaults to 8. */
    nodeRadius?: number;
    /** Force tuning. */
    charge?: number;
    linkDistance?: number;
    linkStrength?: number;
    centerStrength?: number;
    iterations?: number;
    /** Format applied to node/link values shown as text (e.g. tooltips). */
    format?: ValueFormatInput;
}

/** Payload emitted for force-directed node interaction events. */
export interface ForceDirectedNodeEvent {
    x: number;
    y: number;
    id: string;
    label: string;
    value: number;
}

/** Payload emitted for force-directed link interaction events. */
export interface ForceDirectedLinkEvent {
    x: number;
    y: number;
    source: string;
    target: string;
    value: number;
}

/** Events emitted by a {@link ForceDirectedChart} that consumers can subscribe to via `chart.on(...)`. */
export interface ForceDirectedChartEventMap extends EventMap {
    nodeclick: ForceDirectedNodeEvent;
    nodeenter: ForceDirectedNodeEvent;
    nodeleave: ForceDirectedNodeEvent;
    linkclick: ForceDirectedLinkEvent;
    linkenter: ForceDirectedLinkEvent;
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
export class ForceDirectedChart extends Chart<ForceDirectedChartOptions, ForceDirectedChartEventMap> {

    private nodesGroup?: Group;
    private linksGroup?: Group;
    private nodeElements: Group[] = [];
    private linkElements: Line[] = [];
    private tooltip: Tooltip;

    constructor(target: string | HTMLElement | Context, options: ForceDirectedChartOptions) {
        super(target, options);

        this.tooltip = new Tooltip({
            scene: this.scene,
            renderer: this.renderer,
        });

        this.init();
    }

    private attachNodeHover(circle: Circle, node: PlacedNode, content: string) {
        const hover = this.resolveAnimation(ANIMATION_REFERENCE.hover);

        const payload = (point: { x: number;
            y: number; }): ForceDirectedNodeEvent => ({
            x: point.x,
            y: point.y,
            id: node.id,
            label: node.label,
            value: node.value,
        });

        applyHoverHighlight(circle, {
            renderer: this.renderer,
            duration: hover.duration,
            ease: hover.ease,
            tooltip: this.tooltip,
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

    private attachLinkHover(line: Line, link: ForceNetworkLink, content: string) {
        const hover = this.resolveAnimation(ANIMATION_REFERENCE.hover);

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
            duration: hover.duration,
            ease: hover.ease,
            tooltip: this.tooltip,
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

            // Run the (deterministic) simulation centred on the origin, then fit to the area.
            const simNodes: ForceNode[] = nodes.map(node => ({ id: node.id, x: 0, y: 0, vx: 0, vy: 0 }));
            const simLinks: ForceLink[] = links.map(link => ({ source: link.source, target: link.target }));

            simulateForce(simNodes, simLinks, {
                charge,
                linkDistance,
                linkStrength,
                centerStrength,
                iterations,
                centerX: 0,
                centerY: 0,
            });

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

            // --- Links (drawn under the nodes) ---
            if (!this.linksGroup) {
                this.linksGroup = createGroup({ id: 'force-links', class: 'force-links', zIndex: 0 });
                this.scene.add(this.linksGroup);
            }

            const linkValues = links.map(link => link.value ?? 1);
            const [, linkMax] = linkValues.length ? getExtent(linkValues, functionIdentity) : [0, 1];
            const linkWidth = (link: ForceNetworkLink) => 1 + ((link.value ?? 1) / (linkMax || 1)) * 3;
            const linkId = (link: ForceNetworkLink) => `link-${link.source}~${link.target}`;

            const {
                left: linkEntries,
                inner: linkUpdates,
                right: linkExits,
            } = arrayJoin(links, this.linkElements, (link, line) => line.id === linkId(link));

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

            const newLinks = linkEntries.map(link => {
                const ends = linkEndpoints(link);
                const line = createLine({
                    id: linkId(link),
                    ...ends,
                    stroke: '#cbd5e1',
                    lineWidth: linkWidth(link),
                    opacity: 0,
                    data: { opacity: 0.9 } as Partial<LineState>,
                });

                this.attachLinkHover(line, link, `${link.source} → ${link.target}${link.value !== undefined ? `: ${formatValue(link.value)}` : ''}`);
                this.linksGroup!.add(line);

                return line;
            });

            linkUpdates.forEach(([link, line]) => {
                line.lineWidth = linkWidth(link);
                line.data = {
                    ...linkEndpoints(link),
                    opacity: 0.9,
                } as Partial<LineState>;
                this.attachLinkHover(line, link, `${link.source} → ${link.target}${link.value !== undefined ? `: ${formatValue(link.value)}` : ''}`);
            });

            this.linkElements = [
                ...newLinks,
                ...linkUpdates.map(([, line]) => line),
            ];

            // --- Nodes ---
            if (!this.nodesGroup) {
                this.nodesGroup = createGroup({ id: 'force-nodes', class: 'force-nodes', zIndex: 1 });
                this.scene.add(this.nodesGroup);
            }

            const {
                left: nodeEntries,
                inner: nodeUpdates,
                right: nodeExits,
            } = arrayJoin(nodes, this.nodeElements, (node, group) => group.id === `node-${node.id}`);

            nodeExits.forEach(group => group.destroy());

            const nodeContent = (node: PlacedNode) => `${node.label}: ${formatValue(node.value)}`;

            const entryNodeGroups = nodeEntries.map(node => {
                const placedNode = placed.get(node.id)!;
                const restFill = setColorAlpha(placedNode.color, REST_ALPHA);

                const circle = createCircle({
                    id: `node-${node.id}-circle`,
                    cx: placedNode.x,
                    cy: placedNode.y,
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

                this.attachNodeHover(circle, placedNode, nodeContent(placedNode));

                const text = createSegmentLabel({
                    id: `node-${node.id}-label`,
                    x: placedNode.x,
                    y: placedNode.y + placedNode.r + 8,
                    content: placedNode.label,
                    fill: '#6b7280',
                    font: '10px sans-serif',
                });

                text.data = { opacity: 1 };

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
                    this.attachNodeHover(circle, placedNode, nodeContent(placedNode));
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

            entryNodeGroups.forEach(group => this.nodesGroup!.add(group));

            this.nodeElements = [
                ...entryNodeGroups,
                ...nodeUpdates.map(([, group]) => group),
            ];

            const enter = this.resolveAnimation(ANIMATION_REFERENCE.enter);
            const update = this.resolveAnimation(ANIMATION_REFERENCE.update);

            const entryCircles = entryNodeGroups.flatMap(group => group.getElementsByType('circle') as Circle[]);
            const entryLabels = entryNodeGroups.flatMap(group => group.getElementsByType('text') as Text[]);
            const updateCircles = nodeUpdates.flatMap(([, group]) => group.getElementsByType('circle') as Circle[]);

            return Promise.all([
                newLinks.length ? this.renderer.transition(newLinks, {
                    duration: enter.duration,
                    ease: easeOutCubic,
                    state: { opacity: 0.9 },
                }) : Promise.resolve(),
                linkUpdates.length ? this.renderer.transition(linkUpdates.map(([, line]) => line), element => ({
                    duration: update.duration,
                    ease: easeOutCubic,
                    state: element.data as Partial<LineState>,
                })) : Promise.resolve(),
                this.renderer.transition(entryCircles, (element, index, length) => ({
                    duration: enter.duration,
                    delay: stagger(index, length, enter.duration),
                    ease: easeOutCubic,
                    state: element.data as CircleState,
                })),
                entryLabels.length ? this.renderer.transition(entryLabels, {
                    duration: enter.duration,
                    ease: easeOutCubic,
                    state: { opacity: 1 },
                }) : Promise.resolve(),
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

/** Factory function that creates a new {@link ForceDirectedChart} instance. */
export function createForceDirectedChart(target: string | HTMLElement | Context, options: ForceDirectedChartOptions) {
    return new ForceDirectedChart(target, options);
}
