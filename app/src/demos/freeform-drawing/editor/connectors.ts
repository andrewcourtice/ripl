import {
    getShapeBounds,
} from './model';

import type {
    ConnectorShape,
    ConnectorSide,
    RiplDocument,
    Shape,
} from './model';

import type {
    Box,
    ContextPath,
    Point,
} from '@ripl/web';

/** Looks up the current world-space bounding box of a shape by id, or `undefined` when it is gone. */
export type BoundsLookup = (shapeId: string) => Box | undefined;

const ARROW_SIZE = 14;
const ELBOW_OFFSET = 24;

/** Returns the midpoint of a bounding box's named side. */
function sideMidpoint(bounds: Box, side: ConnectorSide): Point {
    const midX = (bounds.left + bounds.right) / 2;
    const midY = (bounds.top + bounds.bottom) / 2;

    if (side === 'top') {
        return [midX, bounds.top];
    }

    if (side === 'bottom') {
        return [midX, bounds.bottom];
    }

    if (side === 'left') {
        return [bounds.left, midY];
    }

    return [bounds.right, midY];
}

/** Returns the box centre point. */
function boundsCenter(bounds: Box): Point {
    return [(bounds.left + bounds.right) / 2, (bounds.top + bounds.bottom) / 2];
}

/** Picks the side of `bounds` whose midpoint sits closest to a target point. */
function nearestSide(bounds: Box, toward: Point): ConnectorSide {
    const sides: ConnectorSide[] = ['top', 'right', 'bottom', 'left'];

    let best: ConnectorSide = 'top';
    let bestDistance = Infinity;

    sides.forEach(side => {
        const [x, y] = sideMidpoint(bounds, side);
        const distance = Math.hypot(toward[0] - x, toward[1] - y);

        if (distance < bestDistance) {
            bestDistance = distance;
            best = side;
        }
    });

    return best;
}

/**
 * Recomputes a connector's endpoint anchors from its bound shapes. Bound ends snap to the side of
 * their shape facing the opposite end; free ends keep their pinned world point. Mutates the record
 * in place so routing and hit testing read fresh geometry.
 */
export function updateConnectorGeometry(connector: ConnectorShape, boundsLookup: BoundsLookup): void {
    const sourceBounds = connector.source.shapeId ? boundsLookup(connector.source.shapeId) : undefined;
    const targetBounds = connector.target.shapeId ? boundsLookup(connector.target.shapeId) : undefined;

    const sourceRef = sourceBounds ? boundsCenter(sourceBounds) : connector.source.point;
    const targetRef = targetBounds ? boundsCenter(targetBounds) : connector.target.point;

    if (sourceBounds) {
        connector.source.side = nearestSide(sourceBounds, targetRef);
        connector.source.point = sideMidpoint(sourceBounds, connector.source.side);
    }

    if (targetBounds) {
        connector.target.side = nearestSide(targetBounds, sourceRef);
        connector.target.point = sideMidpoint(targetBounds, connector.target.side);
    }
}

/** Resolves a side into its outward unit normal. */
function sideNormal(side: ConnectorSide): Point {
    if (side === 'top') {
        return [0, -1];
    }

    if (side === 'bottom') {
        return [0, 1];
    }

    if (side === 'left') {
        return [-1, 0];
    }

    return [1, 0];
}

/** Removes consecutive duplicate points from a route. */
function dedupe(points: Point[]): Point[] {
    return points.filter((point, index) => {
        const previous = points[index - 1];
        return !previous || previous[0] !== point[0] || previous[1] !== point[1];
    });
}

/**
 * Builds the waypoint list for a connector. Two bound ends produce an orthogonal elbow that exits
 * along each side's normal; any free end yields a straight segment.
 */
export function routeConnector(connector: ConnectorShape): Point[] {
    const sp = connector.source.point;
    const tp = connector.target.point;

    if (!connector.source.side || !connector.target.side) {
        return [sp, tp];
    }

    const [snx, sny] = sideNormal(connector.source.side);
    const [tnx, tny] = sideNormal(connector.target.side);

    const sExit: Point = [sp[0] + snx * ELBOW_OFFSET, sp[1] + sny * ELBOW_OFFSET];
    const tExit: Point = [tp[0] + tnx * ELBOW_OFFSET, tp[1] + tny * ELBOW_OFFSET];

    const horizontalFirst = connector.source.side === 'left' || connector.source.side === 'right';
    const corner: Point = horizontalFirst
        ? [tExit[0], sExit[1]]
        : [sExit[0], tExit[1]];

    return dedupe([sp, sExit, corner, tExit, tp]);
}

/** Draws a filled triangular arrowhead at the end of a route onto the given path. */
export function drawArrowhead(path: ContextPath, route: Point[]): void {
    if (route.length < 2) {
        return;
    }

    const tip = route[route.length - 1];
    const from = route[route.length - 2];

    const dx = tip[0] - from[0];
    const dy = tip[1] - from[1];
    const length = Math.hypot(dx, dy) || 1;
    const ux = dx / length;
    const uy = dy / length;

    const baseX = tip[0] - ux * ARROW_SIZE;
    const baseY = tip[1] - uy * ARROW_SIZE;
    const wingX = uy * ARROW_SIZE * 0.5;
    const wingY = -ux * ARROW_SIZE * 0.5;

    path.moveTo(tip[0], tip[1]);
    path.lineTo(baseX + wingX, baseY + wingY);
    path.lineTo(baseX - wingX, baseY - wingY);
    path.closePath();
}

/** Builds a bounds lookup backed by the current document, used when rerouting connectors. */
export function createBoundsLookup(document: RiplDocument): BoundsLookup {
    const index = new Map<string, Shape>(document.map(shape => [shape.id, shape]));

    return shapeId => {
        const shape = index.get(shapeId);
        return shape ? getShapeBounds(shape) : undefined;
    };
}
