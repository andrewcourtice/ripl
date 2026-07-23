import {
    HIT_TOLERANCE,
} from './constants';

import {
    getShapeBounds,
} from './model';

import type {
    RiplDocument,
    Shape,
} from './model';

import {
    isPointInBox,
} from '@ripl/web';

import type {
    Box,

    Point,
} from '@ripl/web';

/** Returns the shortest distance from point `p` to the segment `a`–`b`. */
function distanceToSegment(p: Point, a: Point, b: Point): number {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const lengthSquared = dx * dx + dy * dy;

    if (lengthSquared === 0) {
        return Math.hypot(p[0] - a[0], p[1] - a[1]);
    }

    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / lengthSquared));
    const projX = a[0] + t * dx;
    const projY = a[1] + t * dy;

    return Math.hypot(p[0] - projX, p[1] - projY);
}

/** Returns the shortest distance from point `p` to any segment of a polyline. */
function distanceToPolyline(p: Point, points: Point[]): number {
    if (points.length === 0) {
        return Infinity;
    }

    if (points.length === 1) {
        return Math.hypot(p[0] - points[0][0], p[1] - points[0][1]);
    }

    let distance = Infinity;

    for (let index = 0; index < points.length - 1; index++) {
        distance = Math.min(distance, distanceToSegment(p, points[index], points[index + 1]));
    }

    return distance;
}

/** Returns the four corner points of a box in closed-loop order (top-left → … → top-left). */
function boxOutline({ top, left, bottom, right }: Box): Point[] {
    return [
        [left, top],
        [right, top],
        [right, bottom],
        [left, bottom],
        [left, top],
    ];
}

/** Tests whether a world-space point hits a shape, accounting for its stroke width and a hit tolerance. */
export function hitTestShape(shape: Shape, point: Point, tolerance: number = HIT_TOLERANCE): boolean {
    const slack = tolerance + shape.strokeWidth / 2;

    if (shape.type === 'freehand' || shape.type === 'path') {
        return distanceToPolyline(point, shape.points) <= slack;
    }

    if (shape.type === 'line') {
        return distanceToSegment(point, [shape.x1, shape.y1], [shape.x2, shape.y2]) <= slack;
    }

    if (shape.type === 'connector') {
        return distanceToSegment(point, shape.source.point, shape.target.point) <= slack;
    }

    if (shape.type === 'text') {
        return isPointInBox(point, getShapeBounds(shape));
    }

    const bounds = getShapeBounds(shape);

    if (shape.type === 'rect') {
        if (shape.fill && isPointInBox(point, bounds)) {
            return true;
        }

        return distanceToPolyline(point, boxOutline(bounds)) <= slack;
    }

    // Ellipse: normalize the point into unit-circle space around the box center.
    const cx = (bounds.left + bounds.right) / 2;
    const cy = (bounds.top + bounds.bottom) / 2;
    const rx = Math.max(bounds.width / 2, 1e-6);
    const ry = Math.max(bounds.height / 2, 1e-6);
    const normalized = Math.hypot((point[0] - cx) / rx, (point[1] - cy) / ry);

    if (shape.fill && normalized <= 1) {
        return true;
    }

    return Math.abs(normalized - 1) * Math.min(rx, ry) <= slack;
}

/** Finds the topmost shape (highest paint order) hit by a world-space point, or `undefined`. */
export function pickTopShape(document: RiplDocument, point: Point, tolerance?: number): Shape | undefined {
    for (let index = document.length - 1; index >= 0; index--) {
        if (hitTestShape(document[index], point, tolerance)) {
            return document[index];
        }
    }

    return undefined;
}

/** Returns every shape whose bounding box intersects (or is contained by) a marquee selection box. */
export function shapesInMarquee(document: RiplDocument, box: Box, contain: boolean = false): Shape[] {
    return document.filter(shape => {
        const bounds = getShapeBounds(shape);

        if (contain) {
            return bounds.left >= box.left
                && bounds.right <= box.right
                && bounds.top >= box.top
                && bounds.bottom <= box.bottom;
        }

        return bounds.left <= box.right
            && bounds.right >= box.left
            && bounds.top <= box.bottom
            && bounds.bottom >= box.top;
    });
}
