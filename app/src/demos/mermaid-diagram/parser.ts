export type NodeShape = 'rect' | 'rounded' | 'circle' | 'diamond';

export type EdgeStyle = 'arrow' | 'plain' | 'dotted' | 'thick';

export interface GraphNode {
    id: string;
    label: string;
    shape: NodeShape;
}

export interface GraphEdge {
    from: string;
    to: string;
    label?: string;
    style: EdgeStyle;
}

export interface Subgraph {
    id: string;
    label: string;
    nodeIds: string[];
}

export type Direction = 'TD' | 'LR';

export interface FlowchartIR {
    direction: Direction;
    nodes: GraphNode[];
    edges: GraphEdge[];
    subgraphs: Subgraph[];
}

// Edge patterns ordered from most specific to least specific
const EDGE_PATTERNS: { pattern: RegExp; style: EdgeStyle }[] = [
    { pattern: /==>\|([^|]*)\|/, style: 'thick' },
    { pattern: /==>\s*/, style: 'thick' },
    { pattern: /-\.->\|([^|]*)\|/, style: 'dotted' },
    { pattern: /-\.->/, style: 'dotted' },
    { pattern: /-->\|([^|]*)\|/, style: 'arrow' },
    { pattern: /--\s+([^-|][^|]*?)\s*-->/, style: 'arrow' },
    { pattern: /-->/, style: 'arrow' },
    { pattern: /---\|([^|]*)\|/, style: 'plain' },
    { pattern: /---/, style: 'plain' },
];

function parseNodeDef(raw: string): { id: string; label: string; shape: NodeShape } {
    let id = raw;
    let label = raw;
    let shape: NodeShape = 'rect';

    // ((circle))
    let match = raw.match(/^(\w+)\(\((.+?)\)\)$/);
    if (match) {
        return { id: match[1], label: match[2], shape: 'circle' };
    }

    // {diamond}
    match = raw.match(/^(\w+)\{(.+?)\}$/);
    if (match) {
        return { id: match[1], label: match[2], shape: 'diamond' };
    }

    // (rounded)
    match = raw.match(/^(\w+)\((.+?)\)$/);
    if (match) {
        return { id: match[1], label: match[2], shape: 'rounded' };
    }

    // [rect]
    match = raw.match(/^(\w+)\[(.+?)\]$/);
    if (match) {
        return { id: match[1], label: match[2], shape: 'rect' };
    }

    // bare id
    match = raw.match(/^(\w+)$/);
    if (match) {
        id = match[1];
        label = match[1];
    }

    return { id, label, shape };
}

function splitEdgeLine(line: string): { leftRaw: string; rightRaw: string; edgeLabel?: string; style: EdgeStyle } | null {
    for (const { pattern, style } of EDGE_PATTERNS) {
        const idx = line.search(pattern);
        if (idx === -1) continue;

        const match = line.match(pattern)!;
        const edgeStr = match[0];
        const edgeLabel = match[1]?.trim() || undefined;

        const leftRaw = line.substring(0, idx).trim();
        const rightRaw = line.substring(idx + edgeStr.length).trim();

        if (leftRaw && rightRaw) {
            return { leftRaw, rightRaw, edgeLabel, style };
        }
    }

    return null;
}

export function parseMermaid(source: string): FlowchartIR {
    const lines = source.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('%%'));

    let direction: Direction = 'TD';
    const nodeMap = new Map<string, GraphNode>();
    const edges: GraphEdge[] = [];
    const subgraphs: Subgraph[] = [];

    let currentSubgraph: Subgraph | null = null;

    function ensureNode(raw: string): string {
        const { id, label, shape } = parseNodeDef(raw);

        if (!nodeMap.has(id)) {
            nodeMap.set(id, { id, label, shape });
        } else {
            // Update label/shape if this definition has more info than a bare id
            const existing = nodeMap.get(id)!;
            if (label !== id) {
                existing.label = label;
                existing.shape = shape;
            }
        }

        if (currentSubgraph && !currentSubgraph.nodeIds.includes(id)) {
            currentSubgraph.nodeIds.push(id);
        }

        return id;
    }

    for (const line of lines) {
        // Direction declaration
        const dirMatch = line.match(/^(?:graph|flowchart)\s+(TD|TB|LR|RL|BT)\s*$/i);
        if (dirMatch) {
            const dir = dirMatch[1].toUpperCase();
            direction = (dir === 'TB' || dir === 'TD') ? 'TD' : 'LR';
            continue;
        }

        // Subgraph start
        const subMatch = line.match(/^subgraph\s+(\w+)(?:\s*\[(.+?)\])?\s*$/i);
        if (subMatch) {
            currentSubgraph = {
                id: subMatch[1],
                label: subMatch[2] || subMatch[1],
                nodeIds: [],
            };
            continue;
        }

        // Subgraph end
        if (/^end$/i.test(line)) {
            if (currentSubgraph) {
                subgraphs.push(currentSubgraph);
                currentSubgraph = null;
            }
            continue;
        }

        // Try to parse as edge line (may be chained: A --> B --> C)
        let remaining = line;
        let parsed = false;

        while (remaining) {
            const result = splitEdgeLine(remaining);
            if (!result) break;

            parsed = true;

            const fromId = ensureNode(result.leftRaw);
            const toId = ensureNode(result.rightRaw);

            edges.push({
                from: fromId,
                to: toId,
                label: result.edgeLabel,
                style: result.style,
            });

            // Check if rightRaw continues into another edge
            // For chaining like A --> B --> C, after splitting A --> B --> C
            // we get left=A, right="B --> C", so we continue with rightRaw
            const nextResult = splitEdgeLine(result.rightRaw);
            if (nextResult) {
                remaining = result.rightRaw;
            } else {
                remaining = '';
            }
        }

        if (parsed) continue;

        // Standalone node definition
        const standaloneMatch = line.match(/^(\w+(?:\(.+?\)|\[.+?\]|\{.+?\}|\(\(.+?\)\))?)$/);
        if (standaloneMatch) {
            ensureNode(standaloneMatch[1]);
        }
    }

    return {
        direction,
        nodes: Array.from(nodeMap.values()),
        edges,
        subgraphs,
    };
}
