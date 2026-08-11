import type {
    Vertex,
} from './algorithms';

import type {
    FillRule,
} from '@ripl/core';

import {
    numberClamp,
} from '@ripl/utilities';

/** Squared distance from `(x, y)` to the segment `a`–`b`. */
function squaredDistanceToSegment(x: number, y: number, a: Vertex, b: Vertex): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lengthSquared = dx * dx + dy * dy;

    const t = lengthSquared ? numberClamp(((x - a.x) * dx + (y - a.y) * dy) / lengthSquared, 0, 1) : 0;
    const px = x - (a.x + t * dx);
    const py = y - (a.y + t * dy);

    return px * px + py * py;
}

/**
 * Tests whether a point falls inside one or more closed contours.
 *
 * Crossings are counted with a half-open edge test, so a vertex shared by two edges is counted once.
 * `evenodd` alternates inside and outside on every crossing; `nonzero` accumulates the winding
 * direction, so nested contours wound the same way stay filled.
 *
 * @param contours - The contours to test against, implicitly closed.
 * @param x - X coordinate of the point.
 * @param y - Y coordinate of the point.
 * @param fillRule - The fill rule to apply. Defaults to `nonzero`, as canvas does.
 * @returns `true` when the point is inside.
 */
export function isPointInContours(contours: Vertex[][], x: number, y: number, fillRule: FillRule = 'nonzero'): boolean {
    let crossings = 0;
    let winding = 0;

    for (const contour of contours) {
        const count = contour.length;

        if (count < 2) {
            continue;
        }

        for (let i = 0; i < count; i++) {
            const a = contour[i];
            const b = contour[(i + 1) % count];

            if (!((a.y <= y && b.y > y) || (b.y <= y && a.y > y))) {
                continue;
            }

            if (a.x + ((y - a.y) / (b.y - a.y)) * (b.x - a.x) <= x) {
                continue;
            }

            crossings += 1;
            winding += b.y > a.y ? 1 : -1;
        }
    }

    return fillRule === 'evenodd' ? !!(crossings % 2) : winding !== 0;
}

/**
 * Tests whether a point falls within `width` of any edge of the given contours.
 *
 * @param contours - The contours to test against.
 * @param x - X coordinate of the point.
 * @param y - Y coordinate of the point.
 * @param width - The stroke width the contours would be drawn with.
 * @param closed - Whether each contour's last point joins back to its first.
 * @returns `true` when the point is on the stroke.
 */
export function isPointOnContours(contours: Vertex[][], x: number, y: number, width: number, closed: boolean = true): boolean {
    const reach = Math.max(width, 1) / 2;
    const limit = reach * reach;

    for (const contour of contours) {
        const count = contour.length;

        if (count < 2) {
            continue;
        }

        const segments = closed ? count : count - 1;

        for (let i = 0; i < segments; i++) {
            if (squaredDistanceToSegment(x, y, contour[i], contour[(i + 1) % count]) <= limit) {
                return true;
            }
        }
    }

    return false;
}
