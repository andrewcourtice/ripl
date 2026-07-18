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
    stagger,
} from '../core/animation';

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
    Point,
    Polyline,
    PolylineState,
    Text,
    TextState,
} from '@ripl/core';

import {
    createCircle,
    createGroup,
    createLine,
    createPolyline,
    createText,
    easeOutCubic,
    interpolatePath,
    setColorAlpha,
} from '@ripl/core';

import {
    arrayJoin,
    functionIdentity,
    numberExtent,
} from '@ripl/utilities';

/** Opacity applied to a node's fill at rest (full opacity on hover). */
const REST_ALPHA = 0.9;

/** Points sampled along each arc. */
const ARC_SAMPLES = 24;

/** Neutral colour for the axis line and node ticks. */
const AXIS_COLOR = '#cbd5e1';

/** How the node axis is oriented. */
export type ArcDiagramOrientation = 'horizontal' | 'vertical';

/** A node in an arc diagram. */
export interface ArcDiagramNode<TData = unknown> {
    /** Unique identifier for the node, referenced by links and used for data joins. */
    id: string;
    /** Text shown beside the node; defaults to the node's id. */
    label?: string;
    /** Optional grouping — nodes in the same group share a colour. */
    group?: string;
    /** Explicit node colour; falls back to the group/palette colour when omitted. */
    color?: string;
    /** Arbitrary datum carried through to node interaction events. */
    data?: TData;
}

/** A link between two nodes. */
export interface ArcDiagramLink {
    /** Id of the node the link starts from. */
    source: string;
    /** Id of the node the link connects to. */
    target: string;
    /** Optional flow magnitude; scales the arc's thickness. */
    value?: number;
}

/** Options for configuring an {@link ArcDiagramChart}. */
export interface ArcDiagramChartOptions<TData = unknown> extends BaseChartOptions {
    /** The nodes laid out along the axis. */
    nodes: ArcDiagramNode<TData>[];
    /** The links drawn as arcs between pairs of nodes. */
    links: ArcDiagramLink[];
    /** Node dot radius (the max radius when `sizeByConnections` is on). Defaults to 6. */
    nodeRadius?: number;
    /** Lay the node axis horizontally (default) or vertically (a Y axis with arcs bulging right). */
    orientation?: ArcDiagramOrientation;
    /** Scale each node's dot by its connection count (degree), like a bubble chart. Defaults to false. */
    sizeByConnections?: boolean;
    /** Legend configuration. Shown automatically when there is more than one node group; pass `false` to hide. */
    legend?: ChartLegendInput;
    /** Format applied to link values shown as text (e.g. tooltips). */
    format?: ValueFormatInput;
}

/** Payload emitted for arc diagram node interaction events. */
export interface ArcDiagramNodeEvent<TData = unknown> {
    /** The x coordinate (in chart pixels) of the node. */
    x: number;
    /** The y coordinate (in chart pixels) of the node. */
    y: number;
    /** The id of the interacted node. */
    id: string;
    /** The label of the interacted node. */
    label: string;
    /** The datum from the source {@link ArcDiagramNode}, if one was provided. */
    data?: TData;
}

/** Payload emitted for arc diagram link interaction events. */
export interface ArcDiagramLinkEvent {
    /** The x coordinate (in chart pixels) of the arc's midpoint. */
    x: number;
    /** The y coordinate (in chart pixels) of the arc's midpoint. */
    y: number;
    /** Id of the link's source node. */
    source: string;
    /** Id of the link's target node. */
    target: string;
    /** The link's flow value (0 when none was provided). */
    value: number;
}

/** Events emitted by an {@link ArcDiagramChart} that consumers can subscribe to via `chart.on(...)`. */
export interface ArcDiagramChartEventMap<TData = unknown> extends EventMap {
    /** Emitted when a node is clicked. */
    nodeclick: ArcDiagramNodeEvent<TData>;
    /** Emitted when the pointer enters a node. */
    nodeenter: ArcDiagramNodeEvent<TData>;
    /** Emitted when the pointer leaves a node. */
    nodeleave: ArcDiagramNodeEvent<TData>;
    /** Emitted when a link arc is clicked. */
    linkclick: ArcDiagramLinkEvent;
    /** Emitted when the pointer enters a link arc. */
    linkenter: ArcDiagramLinkEvent;
    /** Emitted when the pointer leaves a link arc. */
    linkleave: ArcDiagramLinkEvent;
}

/**
 * Arc diagram: a cartesian axis whose points are nodes, connected by semicircular arcs whose
 * thickness encodes the link value. Nodes are laid out in order along the axis (horizontal by
 * default, or vertical), optionally sized by their connection count. On entry the arcs draw out of
 * each node and cascade along the axis — a ripple that fades each node in as its arcs reach it — and
 * updates animate arcs reshaping and nodes resizing. Supports labels, tooltips, and typed node/link
 * interaction events.
 */
export class ArcDiagramChart<TData = unknown> extends Chart<ArcDiagramChartOptions<TData>, ArcDiagramChartEventMap<TData>> {

    private _axisGroup?: Group;
    private _axisLine?: Line;
    private _linksGroup?: Group;
    private _nodesGroup?: Group;
    private _linkElements: Polyline[] = [];
    private _nodeElements: Group[] = [];
    private _tooltip: Tooltip;

    constructor(target: string | HTMLElement | Context, options: ArcDiagramChartOptions<TData>) {
        super(target, options);

        this._tooltip = new Tooltip({
            scene: this.scene,
            renderer: this.renderer,
        });

        this.init();
    }

    private _attachNodeHover(circle: Circle, node: ArcDiagramNode<TData>, color: string) {

        const payload = (point: { x: number;
            y: number; }): ArcDiagramNodeEvent<TData> => ({
            x: point.x,
            y: point.y,
            id: node.id,
            label: node.label ?? node.id,
            data: node.data,
        });

        applyHoverHighlight(circle, {
            renderer: this.renderer,
            animation: () => this.resolveAnimation(ANIMATION_REFERENCE.hover),
            tooltip: this._tooltip,
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

    private _attachLinkHover(arc: Polyline, link: ArcDiagramLink, content: string, color: string) {

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
            animation: () => this.resolveAnimation(ANIMATION_REFERENCE.hover),
            tooltip: this._tooltip,
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
                nodeRadius = 6,
                orientation = 'horizontal',
                sizeByConnections = false,
            } = this.options;

            const horizontal = orientation === 'horizontal';
            const formatValue = resolveValueFormat(this.options.format);

            this.resolveSeriesColors(nodes.map(node => ({
                id: node.group ?? node.id,
                color: node.color,
            })));

            const colorFor = (node: ArcDiagramNode) => node.color ?? this.getSeriesColor(node.group ?? node.id);

            // Legend-hidden groups are excluded from the axis layout and rendering; links keep only
            // active endpoints, so the remaining nodes re-space to fill the axis.
            const activeNodes = this.filterActive(nodes, node => node.group ?? node.id);
            const activeNodeIds = new Set(activeNodes.map(node => node.id));
            const activeLinks = links.filter(link => activeNodeIds.has(link.source) && activeNodeIds.has(link.target));

            // Node degree drives optional connection-based sizing (bubble vs scatter).
            const degree = new Map<string, number>();
            activeLinks.forEach(link => {
                degree.set(link.source, (degree.get(link.source) ?? 0) + 1);
                degree.set(link.target, (degree.get(link.target) ?? 0) + 1);
            });

            const degrees = activeNodes.map(node => degree.get(node.id) ?? 0);
            const [degreeMin, degreeMax] = degrees.length ? numberExtent(degrees, functionIdentity) : [0, 1];
            const minRadius = Math.max(2, nodeRadius * 0.45);
            const radiusFor = (node: ArcDiagramNode) => {
                if (!sizeByConnections) {
                    return nodeRadius;
                }

                const value = degree.get(node.id) ?? 0;
                const ratio = degreeMax > degreeMin ? (value - degreeMin) / (degreeMax - degreeMin) : 0.5;
                return minRadius + ratio * (nodeRadius - minRadius);
            };

            const maxRadius = activeNodes.length ? Math.max(nodeRadius, ...activeNodes.map(radiusFor)) : nodeRadius;

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
                    active: this.isItemActive(legendId),
                });
            });

            this.reserveLegend(layout, legendItems, this.options.legend);

            const area = layout.area;

            // --- Axis geometry, parameterised by orientation ---
            // `along` runs down the axis (x when horizontal, y when vertical); `cross` is the fixed
            // axis position, with arcs bulging away from the labels (up / right).
            const labelGutter = 22;
            const margin = maxRadius + 6;

            const alongStart = horizontal ? area.x + margin : area.y + margin;
            const alongEnd = horizontal ? area.x + area.width - margin : area.y + area.height - margin;
            const baseCross = horizontal
                ? area.y + area.height - labelGutter - maxRadius
                : area.x + labelGutter + maxRadius;
            const bulgeSign = horizontal ? -1 : 1;
            const maxArcHeight = horizontal
                ? baseCross - area.y - 4
                : area.x + area.width - baseCross - 4;

            const span = Math.max(1, activeNodes.length - 1);
            const alongOf = (index: number) => activeNodes.length === 1
                ? (alongStart + alongEnd) / 2
                : alongStart + (index / span) * (alongEnd - alongStart);

            const nodeInfo = new Map<string, { along: number;
                index: number; }>();
            activeNodes.forEach((node, index) => nodeInfo.set(node.id, {
                along: alongOf(index),
                index,
            }));

            const toXY = (along: number, cross: number): Point => horizontal ? [along, cross] : [cross, along];
            const nodePoint = (id: string): Point => toXY(nodeInfo.get(id)?.along ?? alongStart, baseCross);

            // Semicircle sampled from the lower `along` endpoint to the higher one, so `interpolatePath`
            // reveals it growing outward from the earlier node (left→right / top→bottom).
            const arcPoints = (alongA: number, alongB: number): Point[] => {
                const lo = Math.min(alongA, alongB);
                const hi = Math.max(alongA, alongB);
                const radiusAlong = (hi - lo) / 2;
                const radiusCross = Math.min(radiusAlong, maxArcHeight);
                const mid = (lo + hi) / 2;
                const points: Point[] = [];

                for (let i = 0; i <= ARC_SAMPLES; i++) {
                    const t = i / ARC_SAMPLES;
                    const angle = Math.PI * (1 - t);
                    const along = mid + radiusAlong * Math.cos(angle);
                    const cross = baseCross + bulgeSign * radiusCross * Math.sin(angle);
                    points.push(toXY(along, cross));
                }

                return points;
            };

            const linkPoints = (link: ArcDiagramLink) => arcPoints(
                nodeInfo.get(link.source)?.along ?? alongStart,
                nodeInfo.get(link.target)?.along ?? alongStart
            );

            const linkOrderIndex = (link: ArcDiagramLink) => Math.min(
                nodeInfo.get(link.source)?.index ?? 0,
                nodeInfo.get(link.target)?.index ?? 0
            );

            const enter = this.resolveAnimation(ANIMATION_REFERENCE.enter);
            const update = this.resolveAnimation(ANIMATION_REFERENCE.update);

            // --- Axis line ---
            if (!this._axisGroup) {
                this._axisGroup = createGroup({
                    id: 'arc-axis',
                    class: 'arc-axis',
                    zIndex: 0,
                });
                this.scene.add(this._axisGroup);
            }

            const axisFrom = toXY(alongStart - margin / 2, baseCross);
            const axisTo = toXY(alongEnd + margin / 2, baseCross);

            if (!this._axisLine) {
                this._axisLine = createLine({
                    id: 'arc-axis-line',
                    x1: axisFrom[0],
                    y1: axisFrom[1],
                    x2: axisTo[0],
                    y2: axisTo[1],
                    stroke: AXIS_COLOR,
                    lineWidth: 1,
                    pointerEvents: 'none',
                });
                this._axisGroup.add(this._axisLine);
            } else {
                this._axisLine.data = {
                    x1: axisFrom[0],
                    y1: axisFrom[1],
                    x2: axisTo[0],
                    y2: axisTo[1],
                } as Partial<LineState>;
            }

            // --- Links (semicircular arcs off the axis) ---
            if (!this._linksGroup) {
                this._linksGroup = createGroup({
                    id: 'arc-links',
                    class: 'arc-links',
                    zIndex: 1,
                });
                this.scene.add(this._linksGroup);
            }

            const linkValues = activeLinks.map(link => link.value ?? 1);
            const [, linkMax] = linkValues.length ? numberExtent(linkValues, functionIdentity) : [0, 1];
            const linkWidth = (link: ArcDiagramLink) => 1 + ((link.value ?? 1) / (linkMax || 1)) * 5;
            const linkId = (link: ArcDiagramLink) => `arc-${link.source}~${link.target}`;

            const arcColor = (link: ArcDiagramLink) => {
                const source = nodes.find(node => node.id === link.source);
                return source ? colorFor(source) : '#94a3b8';
            };

            const linkContent = (link: ArcDiagramLink) => `${link.source} → ${link.target}${link.value !== undefined ? `: ${formatValue(link.value)}` : ''}`;

            const {
                left: linkEntries,
                inner: linkUpdates,
                right: linkExits,
            } = arrayJoin(activeLinks, this._linkElements, (link, poly) => poly.id === linkId(link));

            linkExits.forEach(el => el.destroy());

            // Per-arc entry delay: draw once the ripple reaches its earlier (root-ward) endpoint.
            const arcEntryDelays = new Map<string, number>();

            const newLinks = linkEntries.map(link => {
                const points = linkPoints(link);
                const color = arcColor(link);

                const arc = createPolyline({
                    id: linkId(link),
                    points,
                    stroke: setColorAlpha(color, 0.4),
                    lineWidth: linkWidth(link),
                    opacity: 0,
                    data: {
                        points,
                        opacity: 1,
                    } as Partial<PolylineState>,
                });

                arc.autoFill = false;
                arcEntryDelays.set(arc.id, stagger(linkOrderIndex(link), activeNodes.length, enter.duration, 0.6));
                this._attachLinkHover(arc, link, linkContent(link), color);
                this._linksGroup!.add(arc);

                return arc;
            });

            linkUpdates.forEach(([link, arc]) => {
                arc.lineWidth = linkWidth(link);
                arc.stroke = setColorAlpha(arcColor(link), 0.4);
                arc.data = {
                    points: linkPoints(link),
                    opacity: 1,
                } as Partial<PolylineState>;
                this._attachLinkHover(arc, link, linkContent(link), arcColor(link));
            });

            this._linkElements = [
                ...newLinks,
                ...linkUpdates.map(([, arc]) => arc),
            ];

            // --- Nodes (tick + dot + label along the axis) ---
            if (!this._nodesGroup) {
                this._nodesGroup = createGroup({
                    id: 'arc-nodes',
                    class: 'arc-nodes',
                    zIndex: 2,
                });
                this.scene.add(this._nodesGroup);
            }

            // Outward direction (toward the labels) for ticks + label placement.
            const tickEnd = (point: Point): Point => horizontal ? [point[0], point[1] + 6] : [point[0] - 6, point[1]];
            const labelState = (point: Point) => horizontal
                ? {
                    x: point[0],
                    y: point[1] + 10,
                    textAlign: 'center' as const,
                    textBaseline: 'top' as const,
                }
                : {
                    x: point[0] - 10,
                    y: point[1],
                    textAlign: 'right' as const,
                    textBaseline: 'middle' as const,
                };

            const {
                left: nodeEntries,
                inner: nodeUpdates,
                right: nodeExits,
            } = arrayJoin(nodes, this._nodeElements, (node, group) => group.id === `arc-node-${node.id}`);

            nodeExits.forEach(group => group.destroy());

            const nodeEntryDelays = new Map<string, number>();

            const entryNodeGroups = nodeEntries.map(node => {
                const point = nodePoint(node.id);
                const color = colorFor(node);
                const restFill = setColorAlpha(color, REST_ALPHA);
                const radius = radiusFor(node);
                const label = labelState(point);
                const tip = tickEnd(point);
                const delay = stagger(nodeInfo.get(node.id)?.index ?? 0, nodes.length, enter.duration, 0.6);

                const tick = createLine({
                    id: `arc-node-${node.id}-tick`,
                    x1: point[0],
                    y1: point[1],
                    x2: tip[0],
                    y2: tip[1],
                    stroke: AXIS_COLOR,
                    lineWidth: 1,
                    opacity: 0,
                    pointerEvents: 'none',
                    data: { opacity: 1 } as Partial<LineState>,
                });

                const circle = createCircle({
                    id: `arc-node-${node.id}-dot`,
                    cx: point[0],
                    cy: point[1],
                    radius: 0,
                    fill: restFill,
                    stroke: '#ffffff',
                    lineWidth: 1,
                    data: {
                        cx: point[0],
                        cy: point[1],
                        radius,
                        fill: restFill,
                    } as CircleState,
                });

                this._attachNodeHover(circle, node, color);

                const text = createText({
                    id: `arc-node-${node.id}-label`,
                    content: node.label ?? node.id,
                    fill: '#6b7280',
                    font: '10px sans-serif',
                    opacity: 0,
                    ...label,
                    data: {
                        ...label,
                        opacity: 1,
                    } as Partial<TextState>,
                });

                [tick.id, circle.id, text.id].forEach(id => nodeEntryDelays.set(id, delay));

                return createGroup({
                    id: `arc-node-${node.id}`,
                    class: 'arc-node',
                    children: [tick, circle, text],
                });
            });

            const updateTicks: Line[] = [];
            const updateTexts: Text[] = [];

            nodeUpdates.forEach(([node, group]) => {
                const point = nodePoint(node.id);
                const color = colorFor(node);
                const restFill = setColorAlpha(color, REST_ALPHA);
                const radius = radiusFor(node);
                const label = labelState(point);
                const tip = tickEnd(point);

                const circle = group.getElementsByType('circle')[0] as Circle;
                const text = group.getElementsByType('text')[0] as Text | undefined;
                const tick = group.getElementsByType('line')[0] as Line | undefined;

                if (circle) {
                    circle.data = {
                        cx: point[0],
                        cy: point[1],
                        radius,
                        fill: restFill,
                    } as CircleState;
                    this._attachNodeHover(circle, node, color);
                }

                if (tick) {
                    tick.data = {
                        x1: point[0],
                        y1: point[1],
                        x2: tip[0],
                        y2: tip[1],
                        opacity: 1,
                    } as Partial<LineState>;
                    updateTicks.push(tick);
                }

                if (text) {
                    text.content = node.label ?? node.id;
                    text.data = {
                        ...label,
                        opacity: 1,
                    } as Partial<TextState>;
                    updateTexts.push(text);
                }
            });

            entryNodeGroups.forEach(group => this._nodesGroup!.add(group));

            this._nodeElements = [
                ...entryNodeGroups,
                ...nodeUpdates.map(([, group]) => group),
            ];

            // Legend hover highlights the hovered cluster's nodes (legend id = node.group ?? node.id;
            // node group ids are `arc-node-<id>`), dimming the other clusters.
            const nodeClusterOf = new Map<string, string>();
            nodes.forEach(node => nodeClusterOf.set(`arc-node-${node.id}`, node.group ?? node.id));
            this.registerHighlightGroups(this._nodeElements, group => nodeClusterOf.get(group.id) ?? group.id);

            const entryCircles = entryNodeGroups.flatMap(group => group.getElementsByType('circle') as Circle[]);
            const entryTicks = entryNodeGroups.flatMap(group => group.getElementsByType('line') as Line[]);
            const entryLabels = entryNodeGroups.flatMap(group => group.getElementsByType('text') as Text[]);
            const updateCircles = nodeUpdates.flatMap(([, group]) => group.getElementsByType('circle') as Circle[]);

            return Promise.all([
                this._axisLine ? this.renderer.transition(this._axisLine, {
                    duration: update.duration,
                    ease: easeOutCubic,
                    state: (this._axisLine.data ?? {}) as Partial<LineState>,
                }) : Promise.resolve(),

                // Entry arcs draw out of their earlier node and fade in, cascading along the axis.
                newLinks.length ? this.renderer.transition(newLinks, element => ({
                    duration: enter.duration,
                    delay: arcEntryDelays.get(element.id) ?? 0,
                    ease: easeOutCubic,
                    state: {
                        points: interpolatePath((element.data as PolylineState).points),
                        opacity: 1,
                    },
                })) : Promise.resolve(),

                linkUpdates.length ? this.renderer.transition(linkUpdates.map(([, arc]) => arc), element => ({
                    duration: update.duration,
                    ease: easeOutCubic,
                    state: element.data as Partial<PolylineState>,
                })) : Promise.resolve(),

                // Entry nodes pop in on the same cascade so each fades in as its arcs reach it.
                entryCircles.length ? this.renderer.transition(entryCircles, element => ({
                    duration: enter.duration,
                    delay: nodeEntryDelays.get(element.id) ?? 0,
                    ease: easeOutCubic,
                    state: element.data as CircleState,
                })) : Promise.resolve(),
                entryTicks.length ? this.renderer.transition(entryTicks, element => ({
                    duration: enter.duration,
                    delay: nodeEntryDelays.get(element.id) ?? 0,
                    ease: easeOutCubic,
                    state: (element.data ?? {}) as Partial<LineState>,
                })) : Promise.resolve(),
                entryLabels.length ? this.renderer.transition(entryLabels, element => ({
                    duration: enter.duration,
                    delay: nodeEntryDelays.get(element.id) ?? 0,
                    ease: easeOutCubic,
                    state: (element.data ?? {}) as Record<string, unknown>,
                })) : Promise.resolve(),

                updateCircles.length ? this.renderer.transition(updateCircles, element => ({
                    duration: update.duration,
                    ease: easeOutCubic,
                    state: element.data as CircleState,
                })) : Promise.resolve(),
                updateTicks.length ? this.renderer.transition(updateTicks, element => ({
                    duration: update.duration,
                    ease: easeOutCubic,
                    state: (element.data ?? {}) as Partial<LineState>,
                })) : Promise.resolve(),
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
 * Factory function that creates a new {@link ArcDiagramChart} instance.
 *
 * @example
 * ```ts
 * createArcDiagramChart(target, {
 *     nodes: [
 *         { id: 'a', label: 'Alice' },
 *         { id: 'b', label: 'Bob' },
 *         { id: 'c', label: 'Carol' },
 *     ],
 *     links: [
 *         { source: 'a', target: 'b', value: 3 },
 *         { source: 'b', target: 'c', value: 1 },
 *     ],
 * });
 * ```
 */
export function createArcDiagramChart<TData = unknown>(target: string | HTMLElement | Context, options: ArcDiagramChartOptions<TData>) {
    return new ArcDiagramChart<TData>(target, options);
}
