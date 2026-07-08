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
    applyHoverHighlight,
} from '../core/interaction';

import {
    ANIMATION_REFERENCE,
    stagger,
} from '../core/animation';

import {
    Tooltip,
} from '../components/tooltip';

import {
    Circle,
    CircleState,
    Context,
    createCircle,
    createGroup,
    createPolyline,
    createText,
    easeOutCubic,
    EventMap,
    getExtent,
    Group,
    Point,
    Polyline,
    PolylineState,
    setColorAlpha,
    Text,
} from '@ripl/core';

import {
    arrayJoin,
    functionIdentity,
} from '@ripl/utilities';

/** Opacity applied to a node's fill at rest (full opacity on hover). */
const REST_ALPHA = 0.9;

/** A node in an arc diagram. */
export interface ArcDiagramNode {
    id: string;
    label?: string;
    group?: string;
    color?: string;
}

/** A link between two nodes. */
export interface ArcDiagramLink {
    source: string;
    target: string;
    value?: number;
}

/** Options for configuring an {@link ArcDiagramChart}. */
export interface ArcDiagramChartOptions extends BaseChartOptions {
    nodes: ArcDiagramNode[];
    links: ArcDiagramLink[];
    /** Node dot radius. Defaults to 5. */
    nodeRadius?: number;
    /** Format applied to link values shown as text (e.g. tooltips). */
    format?: ValueFormatInput;
}

/** Payload emitted for arc diagram node interaction events. */
export interface ArcDiagramNodeEvent {
    x: number;
    y: number;
    id: string;
    label: string;
}

/** Payload emitted for arc diagram link interaction events. */
export interface ArcDiagramLinkEvent {
    x: number;
    y: number;
    source: string;
    target: string;
    value: number;
}

/** Events emitted by an {@link ArcDiagramChart} that consumers can subscribe to via `chart.on(...)`. */
export interface ArcDiagramChartEventMap extends EventMap {
    nodeclick: ArcDiagramNodeEvent;
    nodeenter: ArcDiagramNodeEvent;
    nodeleave: ArcDiagramNodeEvent;
    linkclick: ArcDiagramLinkEvent;
    linkenter: ArcDiagramLinkEvent;
    linkleave: ArcDiagramLinkEvent;
}

const ARC_SAMPLES = 24;

/**
 * Arc diagram laying nodes out along a horizontal baseline and connecting them with semicircular
 * arcs whose thickness encodes the link value. A compact way to reveal structure in a one-dimensional
 * ordering of nodes. Supports labels, tooltips, typed node/link interaction events, and animated
 * entry/update/exit transitions.
 */
export class ArcDiagramChart extends Chart<ArcDiagramChartOptions, ArcDiagramChartEventMap> {

    private linksGroup?: Group;
    private nodesGroup?: Group;
    private linkElements: Polyline[] = [];
    private nodeElements: Group[] = [];
    private tooltip: Tooltip;

    constructor(target: string | HTMLElement | Context, options: ArcDiagramChartOptions) {
        super(target, options);

        this.tooltip = new Tooltip({
            scene: this.scene,
            renderer: this.renderer,
        });

        this.init();
    }

    /** Samples a semicircular arc (bulging up) between two baseline x positions. */
    private arcPoints(x1: number, x2: number, baseY: number, maxHeight: number): Point[] {
        const rx = Math.abs(x2 - x1) / 2;
        const ry = Math.min(rx, maxHeight);
        const midX = (x1 + x2) / 2;
        const points: Point[] = [];

        for (let i = 0; i <= ARC_SAMPLES; i++) {
            const t = i / ARC_SAMPLES;
            const angle = Math.PI * (1 - t);
            points.push([midX + rx * Math.cos(angle), baseY - ry * Math.sin(angle)]);
        }

        return points;
    }

    private attachNodeHover(circle: Circle, node: ArcDiagramNode, color: string) {
        const hover = this.resolveAnimation(ANIMATION_REFERENCE.hover);

        const payload = (point: { x: number;
            y: number; }): ArcDiagramNodeEvent => ({
            x: point.x,
            y: point.y,
            id: node.id,
            label: node.label ?? node.id,
        });

        applyHoverHighlight(circle, {
            renderer: this.renderer,
            duration: hover.duration,
            ease: hover.ease,
            tooltip: this.tooltip,
            anchor: () => ({
                x: circle.cx,
                y: circle.cy,
            }),
            content: () => node.label ?? node.id,
            highlight: { fill: color },
            restore: { fill: setColorAlpha(color, REST_ALPHA) },
            onEnter: point => this.emit('nodeenter', payload(point)),
            onLeave: point => this.emit('nodeleave', payload(point)),
            onClick: point => this.emit('nodeclick', payload(point)),
        });
    }

    private attachLinkHover(arc: Polyline, link: ArcDiagramLink, content: string, color: string) {
        const hover = this.resolveAnimation(ANIMATION_REFERENCE.hover);

        const payload = (point: { x: number;
            y: number; }): ArcDiagramLinkEvent => ({
            x: point.x,
            y: point.y,
            source: link.source,
            target: link.target,
            value: link.value ?? 0,
        });

        applyHoverHighlight(arc, {
            renderer: this.renderer,
            duration: hover.duration,
            ease: hover.ease,
            tooltip: this.tooltip,
            anchor: () => {
                const points = arc.points;
                const mid = points[Math.floor(points.length / 2)] ?? [0, 0];
                return {
                    x: mid[0],
                    y: mid[1],
                };
            },
            content: () => content,
            highlight: { stroke: color },
            restore: { stroke: setColorAlpha(color, 0.4) },
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
                nodeRadius = 5,
            } = this.options;

            const formatValue = resolveValueFormat(this.options.format);

            this.resolveSeriesColors(nodes.map(node => ({
                id: node.group ?? node.id,
                color: node.color,
            })));

            const colorFor = (node: ArcDiagramNode) => node.color ?? this.getSeriesColor(node.group ?? node.id);

            const layout = this.createLayout();
            this.reserveTitle(layout);
            const area = layout.area;

            const margin = Math.max(nodeRadius + 4, area.width * 0.04);
            const baseY = area.y + area.height * 0.78;
            const maxArcHeight = baseY - area.y - 4;
            const span = Math.max(1, nodes.length - 1);

            const nodeX = new Map<string, number>();
            nodes.forEach((node, index) => {
                const t = nodes.length === 1 ? 0.5 : index / span;
                nodeX.set(node.id, area.x + margin + t * (area.width - 2 * margin));
            });

            // --- Links (semicircular arcs under/over the baseline) ---
            if (!this.linksGroup) {
                this.linksGroup = createGroup({ id: 'arc-links', class: 'arc-links', zIndex: 0 });
                this.scene.add(this.linksGroup);
            }

            const linkValues = links.map(link => link.value ?? 1);
            const [, linkMax] = linkValues.length ? getExtent(linkValues, functionIdentity) : [0, 1];
            const linkWidth = (link: ArcDiagramLink) => 1 + ((link.value ?? 1) / (linkMax || 1)) * 5;
            const linkId = (link: ArcDiagramLink) => `arc-${link.source}~${link.target}`;

            const {
                left: linkEntries,
                inner: linkUpdates,
                right: linkExits,
            } = arrayJoin(links, this.linkElements, (link, poly) => poly.id === linkId(link));

            linkExits.forEach(el => el.destroy());

            const arcColor = (link: ArcDiagramLink) => {
                const source = nodes.find(node => node.id === link.source);
                return source ? colorFor(source) : '#94a3b8';
            };

            const linkPoints = (link: ArcDiagramLink) => this.arcPoints(
                nodeX.get(link.source) ?? area.x,
                nodeX.get(link.target) ?? area.x,
                baseY,
                maxArcHeight
            );

            const linkContent = (link: ArcDiagramLink) => `${link.source} → ${link.target}${link.value !== undefined ? `: ${formatValue(link.value)}` : ''}`;

            const newLinks = linkEntries.map(link => {
                const points = linkPoints(link);
                const color = arcColor(link);

                const arc = createPolyline({
                    id: linkId(link),
                    points,
                    stroke: setColorAlpha(color, 0.4),
                    lineWidth: linkWidth(link),
                    opacity: 0,
                    data: { opacity: 1 } as Partial<PolylineState>,
                });

                arc.autoFill = false;
                this.attachLinkHover(arc, link, linkContent(link), color);
                this.linksGroup!.add(arc);

                return arc;
            });

            linkUpdates.forEach(([link, arc]) => {
                arc.lineWidth = linkWidth(link);
                arc.stroke = setColorAlpha(arcColor(link), 0.4);
                arc.data = {
                    points: linkPoints(link),
                    opacity: 1,
                } as Partial<PolylineState>;
                this.attachLinkHover(arc, link, linkContent(link), arcColor(link));
            });

            this.linkElements = [
                ...newLinks,
                ...linkUpdates.map(([, arc]) => arc),
            ];

            // --- Nodes (dots + labels along the baseline) ---
            if (!this.nodesGroup) {
                this.nodesGroup = createGroup({ id: 'arc-nodes', class: 'arc-nodes', zIndex: 1 });
                this.scene.add(this.nodesGroup);
            }

            const {
                left: nodeEntries,
                inner: nodeUpdates,
                right: nodeExits,
            } = arrayJoin(nodes, this.nodeElements, (node, group) => group.id === `arc-node-${node.id}`);

            nodeExits.forEach(group => group.destroy());

            const entryNodeGroups = nodeEntries.map(node => {
                const x = nodeX.get(node.id) ?? area.x;
                const color = colorFor(node);
                const restFill = setColorAlpha(color, REST_ALPHA);

                const circle = createCircle({
                    id: `arc-node-${node.id}-dot`,
                    cx: x,
                    cy: baseY,
                    radius: 0,
                    fill: restFill,
                    stroke: '#ffffff',
                    lineWidth: 1,
                    data: {
                        cx: x,
                        cy: baseY,
                        radius: nodeRadius,
                        fill: restFill,
                    } as CircleState,
                });

                this.attachNodeHover(circle, node, color);

                const text = createText({
                    id: `arc-node-${node.id}-label`,
                    x,
                    y: baseY + nodeRadius + 6,
                    content: node.label ?? node.id,
                    fill: '#6b7280',
                    font: '10px sans-serif',
                    textAlign: 'center',
                    textBaseline: 'top',
                    opacity: 0,
                    data: { opacity: 1 },
                });

                return createGroup({
                    id: `arc-node-${node.id}`,
                    class: 'arc-node',
                    children: [circle, text],
                });
            });

            const updateTexts: Text[] = [];

            nodeUpdates.forEach(([node, group]) => {
                const x = nodeX.get(node.id) ?? area.x;
                const color = colorFor(node);
                const restFill = setColorAlpha(color, REST_ALPHA);
                const circle = group.getElementsByType('circle')[0] as Circle;
                const text = group.getElementsByType('text')[0] as Text | undefined;

                if (circle) {
                    circle.data = {
                        cx: x,
                        cy: baseY,
                        radius: nodeRadius,
                        fill: restFill,
                    } as CircleState;
                    this.attachNodeHover(circle, node, color);
                }

                if (text) {
                    text.content = node.label ?? node.id;
                    text.data = {
                        x,
                        y: baseY + nodeRadius + 6,
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
                    state: { opacity: 1 },
                }) : Promise.resolve(),
                linkUpdates.length ? this.renderer.transition(linkUpdates.map(([, arc]) => arc), element => ({
                    duration: update.duration,
                    ease: easeOutCubic,
                    state: element.data as Partial<PolylineState>,
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

/** Factory function that creates a new {@link ArcDiagramChart} instance. */
export function createArcDiagramChart(target: string | HTMLElement | Context, options: ArcDiagramChartOptions) {
    return new ArcDiagramChart(target, options);
}
