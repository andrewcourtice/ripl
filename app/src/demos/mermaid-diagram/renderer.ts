import {
    createRect,
    createCircle,
    createPath,
    createText,
    createPolyline,
    createGroup,
    easeOutCubic,
    easeOutQuart,
} from '@ripl/core';

import type {
    Scene,
    Renderer,
    Element,
    Group,
} from '@ripl/core';

import type {
    DiagramLayout,
    PositionedNode,
    PositionedSubgraph,
    RoutedEdge,
} from './layout';

// Colors
const NODE_FILL = '#3b82f6';
const NODE_FILL_HOVER = '#60a5fa';
const NODE_STROKE = '#2563eb';
const NODE_TEXT_FILL = '#ffffff';
const EDGE_STROKE = '#94a3b8';
const EDGE_STROKE_THICK = '#64748b';
const SUBGRAPH_FILL = 'rgba(148, 163, 184, 0.08)';
const SUBGRAPH_STROKE = 'rgba(148, 163, 184, 0.3)';
const SUBGRAPH_TEXT_FILL = '#94a3b8';
const EDGE_LABEL_FILL = '#cbd5e1';
const ARROW_FILL = '#94a3b8';

const ARROW_SIZE = 8;

function createNodeShape(node: PositionedNode): Element {
    switch (node.shape) {
        case 'circle':
            return createCircle({
                id: `node-shape-${node.id}`,
                cx: node.x + node.width / 2,
                cy: node.y + node.height / 2,
                radius: node.width / 2,
                fillStyle: NODE_FILL,
                strokeStyle: NODE_STROKE,
                lineWidth: 1.5,
                pointerEvents: 'fill',
            });

        case 'diamond':
            return createPath({
                id: `node-shape-${node.id}`,
                x: node.x,
                y: node.y,
                width: node.width,
                height: node.height,
                fillStyle: NODE_FILL,
                strokeStyle: NODE_STROKE,
                lineWidth: 1.5,
                pointerEvents: 'fill',
                pathRenderer: (path, state) => {
                    const cx = state.x + state.width / 2;
                    const cy = state.y + state.height / 2;
                    const hw = state.width / 2;
                    const hh = state.height / 2;

                    path.moveTo(cx, cy - hh);
                    path.lineTo(cx + hw, cy);
                    path.lineTo(cx, cy + hh);
                    path.lineTo(cx - hw, cy);
                    path.closePath();
                },
            });

        case 'rounded':
            return createRect({
                id: `node-shape-${node.id}`,
                x: node.x,
                y: node.y,
                width: node.width,
                height: node.height,
                borderRadius: 12,
                fillStyle: NODE_FILL,
                strokeStyle: NODE_STROKE,
                lineWidth: 1.5,
                pointerEvents: 'fill',
            });

        case 'rect':
        default:
            return createRect({
                id: `node-shape-${node.id}`,
                x: node.x,
                y: node.y,
                width: node.width,
                height: node.height,
                borderRadius: 4,
                fillStyle: NODE_FILL,
                strokeStyle: NODE_STROKE,
                lineWidth: 1.5,
                pointerEvents: 'fill',
            });
    }
}

function createNodeLabel(node: PositionedNode): Element {
    return createText({
        id: `node-label-${node.id}`,
        x: node.x + node.width / 2,
        y: node.y + node.height / 2,
        content: node.label,
        fillStyle: NODE_TEXT_FILL,
        textAlign: 'center',
        textBaseline: 'middle',
        font: '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        pointerEvents: 'none',
    });
}

function createArrowhead(
    points: [number, number][],
    fillColor: string,
): Element | null {
    if (points.length < 2) return null;

    const end = points[points.length - 1];
    const prev = points[points.length - 2];

    const dx = end[0] - prev[0];
    const dy = end[1] - prev[1];
    const len = Math.sqrt(dx * dx + dy * dy);

    if (len === 0) return null;

    const ux = dx / len;
    const uy = dy / len;
    const px = -uy;
    const py = ux;

    const tipX = end[0];
    const tipY = end[1];
    const baseX = tipX - ux * ARROW_SIZE;
    const baseY = tipY - uy * ARROW_SIZE;

    return createPath({
        x: Math.min(tipX, baseX - px * ARROW_SIZE / 2) - 1,
        y: Math.min(tipY, baseY - py * ARROW_SIZE / 2) - 1,
        width: ARROW_SIZE + 2,
        height: ARROW_SIZE + 2,
        fillStyle: fillColor,
        pointerEvents: 'none',
        pathRenderer: (path) => {
            path.moveTo(tipX, tipY);
            path.lineTo(baseX + px * ARROW_SIZE / 2, baseY + py * ARROW_SIZE / 2);
            path.lineTo(baseX - px * ARROW_SIZE / 2, baseY - py * ARROW_SIZE / 2);
            path.closePath();
        },
    });
}

function createEdgeElements(edge: RoutedEdge): Element[] {
    if (edge.points.length < 2) return [];

    const elements: Element[] = [];

    const isThick = edge.style === 'thick';
    const isDotted = edge.style === 'dotted';
    const hasArrow = edge.style === 'arrow' || edge.style === 'thick' || edge.style === 'dotted';

    const lineColor = isThick ? EDGE_STROKE_THICK : EDGE_STROKE;

    const polyline = createPolyline({
        id: `edge-${edge.from}-${edge.to}`,
        points: edge.points,
        renderer: 'linear',
        strokeStyle: lineColor,
        lineWidth: isThick ? 3 : 1.5,
        lineDash: isDotted ? [6, 4] : undefined,
        autoFill: false,
        pointerEvents: 'none',
    });

    elements.push(polyline);

    if (hasArrow) {
        const arrow = createArrowhead(edge.points, lineColor);
        if (arrow) elements.push(arrow);
    }

    // Edge label
    if (edge.label) {
        const mid = Math.floor(edge.points.length / 2);
        const p1 = edge.points[mid - 1] || edge.points[0];
        const p2 = edge.points[mid];

        const lx = (p1[0] + p2[0]) / 2;
        const ly = (p1[1] + p2[1]) / 2;

        elements.push(createText({
            id: `edge-label-${edge.from}-${edge.to}`,
            x: lx,
            y: ly - 8,
            content: edge.label,
            fillStyle: EDGE_LABEL_FILL,
            textAlign: 'center',
            textBaseline: 'middle',
            font: '11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            pointerEvents: 'none',
        }));
    }

    return elements;
}

function createSubgraphElements(sg: PositionedSubgraph): Element[] {
    const bg = createRect({
        id: `subgraph-bg-${sg.id}`,
        x: sg.x,
        y: sg.y,
        width: sg.width,
        height: sg.height,
        borderRadius: 8,
        fillStyle: SUBGRAPH_FILL,
        strokeStyle: SUBGRAPH_STROKE,
        lineWidth: 1,
        pointerEvents: 'none',
    });

    const label = createText({
        id: `subgraph-label-${sg.id}`,
        x: sg.x + 12,
        y: sg.y + 16,
        content: sg.label,
        fillStyle: SUBGRAPH_TEXT_FILL,
        textAlign: 'left',
        textBaseline: 'middle',
        font: '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        pointerEvents: 'none',
    });

    return [bg, label];
}

export function renderDiagram(
    scene: Scene,
    renderer: Renderer,
    layout: DiagramLayout,
): Promise<unknown> {
    // Clear previous elements
    scene.clear();

    if (layout.nodes.length === 0) {
        scene.render();
        return Promise.resolve();
    }

    // Scale and center the diagram within the scene
    const padding = 40;
    const availW = scene.width - padding * 2;
    const availH = scene.height - padding * 2;
    const scaleX = layout.width > 0 ? availW / layout.width : 1;
    const scaleY = layout.height > 0 ? availH / layout.height : 1;
    const scale = Math.min(scaleX, scaleY, 1.5);

    const scaledW = layout.width * scale;
    const scaledH = layout.height * scale;
    const offsetX = (scene.width - scaledW) / 2;
    const offsetY = (scene.height - scaledH) / 2;

    function tx(x: number): number {
        return x * scale + offsetX;
    }

    function ty(y: number): number {
        return y * scale + offsetY;
    }

    function ts(v: number): number {
        return v * scale;
    }

    // Create subgraph elements (rendered behind everything)
    const subgraphElements: Element[] = [];
    for (const sg of layout.subgraphs) {
        const scaledSg = {
            ...sg,
            x: tx(sg.x),
            y: ty(sg.y),
            width: ts(sg.width),
            height: ts(sg.height),
        };
        subgraphElements.push(...createSubgraphElements(scaledSg));
    }

    const subgraphGroup = createGroup({
        id: 'subgraphs',
        children: subgraphElements,
    });
    subgraphGroup.zIndex = 0;

    // Create edge elements
    const edgeElements: Element[] = [];
    for (const edge of layout.edges) {
        const scaledEdge: RoutedEdge = {
            ...edge,
            points: edge.points.map(([x, y]) => [tx(x), ty(y)] as [number, number]),
        };
        edgeElements.push(...createEdgeElements(scaledEdge));
    }

    const edgesGroup = createGroup({
        id: 'edges',
        children: edgeElements,
    });
    edgesGroup.zIndex = 1;

    // Create node elements
    const nodeGroups: Group[] = [];
    const nodeShapes: Element[] = [];

    for (const node of layout.nodes) {
        const scaledNode: PositionedNode = {
            ...node,
            x: tx(node.x),
            y: ty(node.y),
            width: ts(node.width),
            height: ts(node.height),
        };

        const shape = createNodeShape(scaledNode);
        const label = createNodeLabel(scaledNode);

        // Store target fill for transition animations
        shape.data = {
            fillStyle: NODE_FILL,
        };

        // Start with zero opacity for entry animation
        shape.globalAlpha = 0;
        label.globalAlpha = 0;

        // Hover interactions
        shape.on('mouseenter', () => {
            renderer.transition(shape, {
                duration: 200,
                ease: easeOutQuart,
                state: {
                    fillStyle: NODE_FILL_HOVER,
                },
            });
        });

        shape.on('mouseleave', () => {
            renderer.transition(shape, {
                duration: 200,
                ease: easeOutQuart,
                state: {
                    fillStyle: NODE_FILL,
                },
            });
        });

        const group = createGroup({
            id: `node-group-${node.id}`,
            children: [shape, label],
        });

        nodeGroups.push(group);
        nodeShapes.push(shape);
    }

    const nodesGroup = createGroup({
        id: 'nodes',
        children: nodeGroups,
    });
    nodesGroup.zIndex = 2;

    // Add all groups to scene
    scene.add([subgraphGroup, edgesGroup, nodesGroup]);

    // Start edge elements hidden
    for (const el of edgeElements) {
        el.globalAlpha = 0;
    }

    for (const el of subgraphElements) {
        el.globalAlpha = 0;
    }

    // Animate subgraphs in
    const subgraphTransition = subgraphElements.length > 0
        ? renderer.transition(subgraphElements, (_el, index, length) => ({
            duration: 400,
            delay: index * (200 / Math.max(length, 1)),
            ease: easeOutCubic,
            state: {
                globalAlpha: 1,
            },
        }))
        : Promise.resolve();

    // Animate nodes in with staggered fade
    const allNodeElements = nodeGroups.flatMap(g => g.children);

    const nodesTransition = allNodeElements.length > 0
        ? renderer.transition(allNodeElements, (_el, index, length) => ({
            duration: 600,
            delay: 100 + index * (400 / Math.max(length, 1)),
            ease: easeOutCubic,
            state: {
                globalAlpha: 1,
            },
        }))
        : Promise.resolve();

    // Animate edges in after nodes
    const nodeAnimDuration = 600 + 400 + 100;

    const edgesTransition = edgeElements.length > 0
        ? renderer.transition(edgeElements, (_el, index, length) => ({
            duration: 400,
            delay: nodeAnimDuration + index * (300 / Math.max(length, 1)),
            ease: easeOutCubic,
            state: {
                globalAlpha: 1,
            },
        }))
        : Promise.resolve();

    return Promise.all([subgraphTransition, nodesTransition, edgesTransition]);
}
