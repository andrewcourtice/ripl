import type {
    FlowchartIR,
    GraphNode,
    GraphEdge,
    Direction,
    Subgraph,
} from './parser';

export interface PositionedNode extends GraphNode {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface RoutedEdge extends GraphEdge {
    points: [number, number][];
}

export interface PositionedSubgraph extends Subgraph {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface DiagramLayout {
    direction: Direction;
    nodes: PositionedNode[];
    edges: RoutedEdge[];
    subgraphs: PositionedSubgraph[];
    width: number;
    height: number;
}

const NODE_WIDTH = 140;
const NODE_HEIGHT = 48;
const CIRCLE_DIAMETER = 60;
const DIAMOND_SIZE = 64;
const H_GAP = 60;
const V_GAP = 60;
const SUBGRAPH_PADDING = 24;
const SUBGRAPH_LABEL_HEIGHT = 24;

function getNodeSize(node: GraphNode): { w: number; h: number } {
    switch (node.shape) {
        case 'circle':
            return { w: CIRCLE_DIAMETER, h: CIRCLE_DIAMETER };
        case 'diamond':
            return { w: DIAMOND_SIZE, h: DIAMOND_SIZE };
        default:
            return { w: NODE_WIDTH, h: NODE_HEIGHT };
    }
}

function topologicalLayers(nodes: GraphNode[], edges: GraphEdge[]): string[][] {
    const adj = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    for (const node of nodes) {
        adj.set(node.id, []);
        inDegree.set(node.id, 0);
    }

    for (const edge of edges) {
        adj.get(edge.from)?.push(edge.to);
        inDegree.set(edge.to, (inDegree.get(edge.to) ?? 0) + 1);
    }

    const layers: string[][] = [];
    let current = nodes.filter(n => (inDegree.get(n.id) ?? 0) === 0).map(n => n.id);

    const visited = new Set<string>();

    while (current.length > 0) {
        layers.push(current);
        const next: string[] = [];

        for (const id of current) {
            visited.add(id);

            for (const neighbor of (adj.get(id) ?? [])) {
                inDegree.set(neighbor, (inDegree.get(neighbor) ?? 0) - 1);

                if ((inDegree.get(neighbor) ?? 0) <= 0 && !visited.has(neighbor)) {
                    next.push(neighbor);
                    visited.add(neighbor);
                }
            }
        }

        current = next;
    }

    // Any remaining nodes not reached (cycles) — add as final layer
    const remaining = nodes.filter(n => !visited.has(n.id)).map(n => n.id);
    if (remaining.length > 0) {
        layers.push(remaining);
    }

    return layers;
}

function getNodeCenter(node: PositionedNode): [number, number] {
    if (node.shape === 'circle') {
        return [node.x + node.width / 2, node.y + node.height / 2];
    }

    return [node.x + node.width / 2, node.y + node.height / 2];
}

function getEdgeConnectionPoints(
    from: PositionedNode,
    to: PositionedNode,
    direction: Direction,
): { start: [number, number]; end: [number, number] } {
    const [fromCx, fromCy] = getNodeCenter(from);
    const [toCx, toCy] = getNodeCenter(to);

    if (direction === 'TD') {
        // Connect bottom of source to top of target
        const startX = fromCx;
        const startY = from.y + from.height;
        const endX = toCx;
        const endY = to.y;

        return {
            start: [startX, startY],
            end: [endX, endY],
        };
    } else {
        // LR: connect right of source to left of target
        const startX = from.x + from.width;
        const startY = fromCy;
        const endX = to.x;
        const endY = toCy;

        return {
            start: [startX, startY],
            end: [endX, endY],
        };
    }
}

export function computeLayout(ir: FlowchartIR): DiagramLayout {
    const { direction, nodes, edges, subgraphs } = ir;
    const nodeMap = new Map<string, GraphNode>();

    for (const node of nodes) {
        nodeMap.set(node.id, node);
    }

    // Layer assignment
    const layers = topologicalLayers(nodes, edges);

    // Position assignment
    const positioned = new Map<string, PositionedNode>();

    if (direction === 'TD') {
        let y = SUBGRAPH_PADDING;

        for (const layer of layers) {
            const layerSizes = layer.map(id => getNodeSize(nodeMap.get(id)!));
            const totalWidth = layerSizes.reduce((sum, s) => sum + s.w, 0) + (layer.length - 1) * H_GAP;
            let x = -totalWidth / 2;
            const maxH = Math.max(...layerSizes.map(s => s.h));

            for (let i = 0; i < layer.length; i++) {
                const id = layer[i];
                const node = nodeMap.get(id)!;
                const size = layerSizes[i];

                positioned.set(id, {
                    ...node,
                    x,
                    y: y + (maxH - size.h) / 2,
                    width: size.w,
                    height: size.h,
                });

                x += size.w + H_GAP;
            }

            y += maxH + V_GAP;
        }
    } else {
        // LR
        let x = SUBGRAPH_PADDING;

        for (const layer of layers) {
            const layerSizes = layer.map(id => getNodeSize(nodeMap.get(id)!));
            const totalHeight = layerSizes.reduce((sum, s) => sum + s.h, 0) + (layer.length - 1) * V_GAP;
            let y = -totalHeight / 2;
            const maxW = Math.max(...layerSizes.map(s => s.w));

            for (let i = 0; i < layer.length; i++) {
                const id = layer[i];
                const node = nodeMap.get(id)!;
                const size = layerSizes[i];

                positioned.set(id, {
                    ...node,
                    x: x + (maxW - size.w) / 2,
                    y,
                    width: size.w,
                    height: size.h,
                });

                y += size.h + V_GAP;
            }

            x += maxW + H_GAP;
        }
    }

    // Normalize positions so min x, y = padding
    const allNodes = Array.from(positioned.values());

    if (allNodes.length > 0) {
        const minX = Math.min(...allNodes.map(n => n.x));
        const minY = Math.min(...allNodes.map(n => n.y));
        const offsetX = SUBGRAPH_PADDING - minX;
        const offsetY = SUBGRAPH_PADDING - minY;

        for (const node of allNodes) {
            node.x += offsetX;
            node.y += offsetY;
        }
    }

    // Compute edges
    const routedEdges: RoutedEdge[] = edges.map(edge => {
        const from = positioned.get(edge.from);
        const to = positioned.get(edge.to);

        if (!from || !to) {
            return { ...edge, points: [] as [number, number][] };
        }

        const { start, end } = getEdgeConnectionPoints(from, to, direction);

        // Route with a midpoint for non-straight edges
        const points: [number, number][] = [start];

        if (direction === 'TD') {
            if (Math.abs(start[0] - end[0]) > 1) {
                const midY = (start[1] + end[1]) / 2;
                points.push([start[0], midY]);
                points.push([end[0], midY]);
            }
        } else {
            if (Math.abs(start[1] - end[1]) > 1) {
                const midX = (start[0] + end[0]) / 2;
                points.push([midX, start[1]]);
                points.push([midX, end[1]]);
            }
        }

        points.push(end);

        return { ...edge, points };
    });

    // Compute subgraphs
    const positionedSubgraphs: PositionedSubgraph[] = subgraphs.map(sg => {
        const childNodes = sg.nodeIds
            .map(id => positioned.get(id))
            .filter((n): n is PositionedNode => !!n);

        if (childNodes.length === 0) {
            return { ...sg, x: 0, y: 0, width: 0, height: 0 };
        }

        const minX = Math.min(...childNodes.map(n => n.x));
        const minY = Math.min(...childNodes.map(n => n.y));
        const maxX = Math.max(...childNodes.map(n => n.x + n.width));
        const maxY = Math.max(...childNodes.map(n => n.y + n.height));

        return {
            ...sg,
            x: minX - SUBGRAPH_PADDING,
            y: minY - SUBGRAPH_PADDING - SUBGRAPH_LABEL_HEIGHT,
            width: (maxX - minX) + SUBGRAPH_PADDING * 2,
            height: (maxY - minY) + SUBGRAPH_PADDING * 2 + SUBGRAPH_LABEL_HEIGHT,
        };
    });

    // Compute total bounds
    const finalNodes = Array.from(positioned.values());
    let totalWidth = 0;
    let totalHeight = 0;

    if (finalNodes.length > 0) {
        totalWidth = Math.max(
            ...finalNodes.map(n => n.x + n.width),
            ...positionedSubgraphs.map(s => s.x + s.width),
        ) + SUBGRAPH_PADDING;

        totalHeight = Math.max(
            ...finalNodes.map(n => n.y + n.height),
            ...positionedSubgraphs.map(s => s.y + s.height),
        ) + SUBGRAPH_PADDING;
    }

    return {
        direction,
        nodes: finalNodes,
        edges: routedEdges,
        subgraphs: positionedSubgraphs,
        width: totalWidth,
        height: totalHeight,
    };
}
