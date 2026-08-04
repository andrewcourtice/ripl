import {
    TAU,
} from '@ripl/core';

import {
    comparitorNumeric,
} from '@ripl/utilities';

/** Callback invoked for each pixel in a rasterization pass. */
export type PixelCallback = (x: number, y: number) => void;

/** A 2D point in raster (pixel) space. */
export interface Vertex {
    /** X coordinate in raster (pixel) space. */
    x: number;
    /** Y coordinate in raster (pixel) space. */
    y: number;
}

/** Rasterizes a line segment from (x0,y0) to (x1,y1) using Bresenham's algorithm. */
export function rasterizeLine(x0: number, y0: number, x1: number, y1: number, plot: PixelCallback): void {
    let ix0 = Math.round(x0);
    let iy0 = Math.round(y0);

    const ix1 = Math.round(x1);
    const iy1 = Math.round(y1);

    const dx = Math.abs(ix1 - ix0);
    const dy = -Math.abs(iy1 - iy0);
    const sx = ix0 < ix1 ? 1 : -1;
    const sy = iy0 < iy1 ? 1 : -1;

    let error = dx + dy;

    for (;;) {
        plot(ix0, iy0);

        if (ix0 === ix1 && iy0 === iy1) {
            break;
        }

        const e2 = 2 * error;

        if (e2 >= dy) {
            error += dy;
            ix0 += sx;
        }

        if (e2 <= dx) {
            error += dx;
            iy0 += sy;
        }
    }
}

/** Rasterizes a circle outline at (cx,cy) with the given radius using the midpoint algorithm. */
export function rasterizeCircle(cx: number, cy: number, radius: number, plot: PixelCallback): void {
    const icx = Math.round(cx);
    const icy = Math.round(cy);
    const ir = Math.round(radius);

    if (ir <= 0) {
        plot(icx, icy);
        return;
    }

    let x = ir;
    let y = 0;
    let decision = 1 - ir;

    while (x >= y) {
        plot(icx + x, icy + y);
        plot(icx - x, icy + y);
        plot(icx + x, icy - y);
        plot(icx - x, icy - y);
        plot(icx + y, icy + x);
        plot(icx - y, icy + x);
        plot(icx + y, icy - x);
        plot(icx - y, icy - x);

        y++;

        if (decision <= 0) {
            decision += 2 * y + 1;
        } else {
            x--;
            decision += 2 * (y - x) + 1;
        }
    }
}

/** Rasterizes a full, unrotated ellipse outline at (cx,cy) using the midpoint algorithm. */
function rasterizeFullEllipse(cx: number, cy: number, rx: number, ry: number, plot: PixelCallback): void {
    const icx = Math.round(cx);
    const icy = Math.round(cy);
    const irx = Math.round(rx);
    const iry = Math.round(ry);

    if (irx <= 0 && iry <= 0) {
        plot(icx, icy);
        return;
    }

    let x = 0;
    let y = iry;

    const rx2 = irx * irx;
    const ry2 = iry * iry;

    let px = 0;
    let py = 2 * rx2 * y;

    let p1 = ry2 - rx2 * iry + 0.25 * rx2;

    while (px < py) {
        plot(icx + x, icy + y);
        plot(icx - x, icy + y);
        plot(icx + x, icy - y);
        plot(icx - x, icy - y);

        x++;
        px += 2 * ry2;

        if (p1 < 0) {
            p1 += ry2 + px;
        } else {
            y--;
            py -= 2 * rx2;
            p1 += ry2 + px - py;
        }
    }

    let p2 = ry2 * (x + 0.5) * (x + 0.5) + rx2 * (y - 1) * (y - 1) - rx2 * ry2;

    while (y >= 0) {
        plot(icx + x, icy + y);
        plot(icx - x, icy + y);
        plot(icx + x, icy - y);
        plot(icx - x, icy - y);

        y--;
        py -= 2 * rx2;

        if (p2 > 0) {
            p2 += rx2 - py;
        } else {
            x++;
            px += 2 * ry2;
            p2 += rx2 - py + px;
        }
    }
}

/** Rasterizes a rectangle outline. */
export function rasterizeRect(x: number, y: number, width: number, height: number, plot: PixelCallback): void {
    const x0 = Math.round(x);
    const y0 = Math.round(y);
    const x1 = Math.round(x + width);
    const y1 = Math.round(y + height);

    rasterizeLine(x0, y0, x1, y0, plot);
    rasterizeLine(x1, y0, x1, y1, plot);
    rasterizeLine(x1, y1, x0, y1, plot);
    rasterizeLine(x0, y1, x0, y0, plot);
}

/** Evaluates a cubic bezier at parameter t. */
function cubicBezierAt(t: number, p0: number, p1: number, p2: number, p3: number): number {
    const mt = 1 - t;

    return mt * mt * mt * p0
        + 3 * mt * mt * t * p1
        + 3 * mt * t * t * p2
        + t * t * t * p3;
}

/** Evaluates a quadratic bezier at parameter t. */
function quadBezierAt(t: number, p0: number, p1: number, p2: number): number {
    const mt = 1 - t;

    return mt * mt * p0 + 2 * mt * t * p1 + t * t * p2;
}

/** Rasterizes a polyline by drawing a line between each consecutive pair of points. */
function rasterizePolyline(points: Vertex[], plot: PixelCallback): void {
    for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const next = points[i];

        rasterizeLine(prev.x, prev.y, next.x, next.y, plot);
    }
}

/** Samples a cubic bezier curve into a polyline of points (inclusive of both endpoints). */
export function flattenCubicBezier(
    x0: number, y0: number,
    cp1x: number, cp1y: number,
    cp2x: number, cp2y: number,
    x1: number, y1: number
): Vertex[] {
    const steps = estimateBezierSteps(x0, y0, cp1x, cp1y, cp2x, cp2y, x1, y1);
    const points: Vertex[] = [{
        x: x0,
        y: y0,
    }];

    for (let i = 1; i <= steps; i++) {
        const t = i / steps;

        points.push({
            x: cubicBezierAt(t, x0, cp1x, cp2x, x1),
            y: cubicBezierAt(t, y0, cp1y, cp2y, y1),
        });
    }

    return points;
}

/** Rasterizes a cubic bezier curve by adaptive subdivision into line segments. */
export function rasterizeCubicBezier(
    x0: number, y0: number,
    cp1x: number, cp1y: number,
    cp2x: number, cp2y: number,
    x1: number, y1: number,
    plot: PixelCallback
): void {
    rasterizePolyline(flattenCubicBezier(x0, y0, cp1x, cp1y, cp2x, cp2y, x1, y1), plot);
}

/** Samples a quadratic bezier curve into a polyline of points (inclusive of both endpoints). */
export function flattenQuadBezier(
    x0: number, y0: number,
    cpx: number, cpy: number,
    x1: number, y1: number
): Vertex[] {
    const dx = Math.abs(x1 - x0) + Math.abs(cpx - x0);
    const dy = Math.abs(y1 - y0) + Math.abs(cpy - y0);
    const steps = Math.max(8, Math.ceil(Math.sqrt(dx * dx + dy * dy) / 2));
    const points: Vertex[] = [{
        x: x0,
        y: y0,
    }];

    for (let i = 1; i <= steps; i++) {
        const t = i / steps;

        points.push({
            x: quadBezierAt(t, x0, cpx, x1),
            y: quadBezierAt(t, y0, cpy, y1),
        });
    }

    return points;
}

/** Rasterizes a quadratic bezier curve by adaptive subdivision into line segments. */
export function rasterizeQuadBezier(
    x0: number, y0: number,
    cpx: number, cpy: number,
    x1: number, y1: number,
    plot: PixelCallback
): void {
    rasterizePolyline(flattenQuadBezier(x0, y0, cpx, cpy, x1, y1), plot);
}

/** Estimates a reasonable number of line segments for a cubic bezier curve. */
function estimateBezierSteps(
    x0: number, y0: number,
    cp1x: number, cp1y: number,
    cp2x: number, cp2y: number,
    x1: number, y1: number
): number {
    const dx = Math.abs(x1 - x0) + Math.abs(cp1x - x0) + Math.abs(cp2x - x1);
    const dy = Math.abs(y1 - y0) + Math.abs(cp1y - y0) + Math.abs(cp2y - y1);

    return Math.max(8, Math.ceil(Math.sqrt(dx * dx + dy * dy) / 2));
}

/** Samples an arc from startAngle to endAngle into a polyline of points (inclusive of both endpoints). */
export function flattenArc(
    cx: number, cy: number,
    radius: number,
    startAngle: number, endAngle: number,
    counterclockwise: boolean
): Vertex[] {
    const start = startAngle;

    let end = endAngle;

    if (counterclockwise && end > start) {
        end -= TAU;
    } else if (!counterclockwise && end < start) {
        end += TAU;
    }

    const angleDiff = Math.abs(end - start);
    const steps = Math.max(8, Math.ceil(angleDiff * radius / 2));
    const points: Vertex[] = [{
        x: cx + radius * Math.cos(start),
        y: cy + radius * Math.sin(start),
    }];

    for (let i = 1; i <= steps; i++) {
        const angle = start + (end - start) * (i / steps);

        points.push({
            x: cx + radius * Math.cos(angle),
            y: cy + radius * Math.sin(angle),
        });
    }

    return points;
}

/** Rasterizes an arc from startAngle to endAngle at (cx,cy) with given radius by subdivision into line segments. */
export function rasterizeArc(
    cx: number, cy: number,
    radius: number,
    startAngle: number, endAngle: number,
    counterclockwise: boolean,
    plot: PixelCallback
): void {
    rasterizePolyline(flattenArc(cx, cy, radius, startAngle, endAngle, counterclockwise), plot);
}

/** Whether an ellipse sweep covers the full turn, in which case the closed-curve sampling applies. */
function isFullSweep(startAngle: number, endAngle: number): boolean {
    return Math.abs(endAngle - startAngle) >= TAU - 0.001;
}

/**
 * Samples an ellipse outline into a polyline of points.
 *
 * @param cx - X coordinate of the ellipse center.
 * @param cy - Y coordinate of the ellipse center.
 * @param rx - Radius along the ellipse's own x axis.
 * @param ry - Radius along the ellipse's own y axis.
 * @param rotation - Rotation of the ellipse about its center, in radians.
 * @param startAngle - Angle the sweep starts at, in radians.
 * @param endAngle - Angle the sweep ends at, in radians.
 * @param counterclockwise - Whether the sweep runs counterclockwise.
 * @returns The sampled points. A full sweep omits the duplicate closing point (the curve is closed
 * implicitly); a partial sweep includes both endpoints, so filling it closes the segment with a chord
 * exactly as canvas does.
 */
export function flattenEllipse(
    cx: number, cy: number,
    rx: number, ry: number,
    rotation: number = 0,
    startAngle: number = 0,
    endAngle: number = TAU,
    counterclockwise: boolean = false
): Vertex[] {
    const full = isFullSweep(startAngle, endAngle);
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);

    let end = endAngle;

    if (!full && counterclockwise && end > startAngle) {
        end -= TAU;
    } else if (!full && !counterclockwise && end < startAngle) {
        end += TAU;
    }

    const sweep = full ? TAU : end - startAngle;
    const radius = Math.max(Math.abs(rx), Math.abs(ry));
    const steps = Math.max(16, Math.ceil(Math.abs(sweep) * radius / 2));
    const count = full ? steps : steps + 1;
    const points: Vertex[] = [];

    for (let i = 0; i < count; i++) {
        const angle = startAngle + sweep * (i / steps);
        const ax = rx * Math.cos(angle);
        const ay = ry * Math.sin(angle);

        points.push({
            x: cx + ax * cos - ay * sin,
            y: cy + ax * sin + ay * cos,
        });
    }

    return points;
}

/**
 * Rasterizes an ellipse outline at (cx,cy), honoring rotation and sweep.
 *
 * @param cx - X coordinate of the ellipse center.
 * @param cy - Y coordinate of the ellipse center.
 * @param rx - Radius along the ellipse's own x axis.
 * @param ry - Radius along the ellipse's own y axis.
 * @param rotation - Rotation of the ellipse about its center, in radians.
 * @param startAngle - Angle the sweep starts at, in radians.
 * @param endAngle - Angle the sweep ends at, in radians.
 * @param counterclockwise - Whether the sweep runs counterclockwise.
 * @param plot - Invoked for each rasterized pixel.
 */
export function rasterizeEllipse(
    cx: number, cy: number,
    rx: number, ry: number,
    rotation: number,
    startAngle: number,
    endAngle: number,
    counterclockwise: boolean,
    plot: PixelCallback
): void {
    if (!rotation && isFullSweep(startAngle, endAngle)) {
        rasterizeFullEllipse(cx, cy, rx, ry, plot);
        return;
    }

    rasterizePolyline(flattenEllipse(cx, cy, rx, ry, rotation, startAngle, endAngle, counterclockwise), plot);
}

/**
 * Wraps a plot callback so pixels landing in a dash gap are dropped.
 *
 * Arc length is approximated by counting plotted pixels, which is exact for axis-aligned runs and
 * up to √2 short on a diagonal — indistinguishable at braille resolution, and far cheaper than
 * re-parameterizing every command by true arc length. A pattern with an odd number of entries is
 * repeated to an even length, as canvas specifies.
 *
 * @param pattern - The dash pattern, alternating dash and gap lengths in pixels.
 * @param offset - Distance into the pattern at which the first dash starts.
 * @param plot - The callback to gate.
 * @returns A callback that forwards only the pixels falling within a dash, or `plot` itself when
 * the pattern describes a solid line.
 */
export function dashPixels(pattern: number[], offset: number, plot: PixelCallback): PixelCallback {
    const segments = pattern.length % 2 ? pattern.concat(pattern) : pattern;
    const cycle = segments.reduce((total, length) => total + length, 0);

    if (!cycle || segments.some(length => !(length >= 0))) {
        return plot;
    }

    let distance = offset;

    return (x, y) => {
        const position = ((distance % cycle) + cycle) % cycle;

        distance += 1;

        let travelled = 0;

        for (let i = 0; i < segments.length; i++) {
            travelled += segments[i];

            if (position < travelled) {
                if (i % 2 === 0) {
                    plot(x, y);
                }

                return;
            }
        }
    };
}

/**
 * Widens a rasterization pass by stamping a round brush at every pixel it plots, so a stroke can be
 * more than one dot thick. Thickness is geometry, not color depth: a braille cell is 2×4 dots, so a
 * width is perfectly expressible even though each dot is only lit or unlit.
 *
 * The brush centres on a dot, so thickness quantises to an **odd** number of dots — widths of 1, 2,
 * 3, 4 and 5 produce strokes 1, 3, 3, 5 and 5 dots across. Because the brush is round, caps and
 * joins are always round; `lineCap`, `lineJoin` and `miterLimit` have no effect.
 *
 * Compose this *inside* {@link dashPixels}, never outside it: dash measures arc length by counting
 * the pixels it receives, so thickening first would advance the pattern once per stamped dot rather
 * than once per centreline dot.
 *
 * @param width - Stroke width in raster pixels.
 * @param plot - The callback to widen.
 * @returns A callback that stamps a brush per pixel, or `plot` itself for a hairline stroke.
 */
export function thickenPixels(width: number, plot: PixelCallback): PixelCallback {
    if (!(width > 1)) {
        return plot;
    }

    const radius = width / 2;
    const extent = Math.floor(radius);
    const offsets: number[] = [];

    for (let dy = -extent; dy <= extent; dy++) {
        for (let dx = -extent; dx <= extent; dx++) {
            if (dx * dx + dy * dy <= radius * radius) {
                offsets.push(dx, dy);
            }
        }
    }

    return (x, y) => {
        for (let i = 0; i < offsets.length; i += 2) {
            plot(x + offsets[i], y + offsets[i + 1]);
        }
    };
}

/** Computes the x-coordinates where a horizontal scanline crosses the edges of the given contours. */
function scanlineCrossings(contours: Vertex[][], scanY: number): number[] {
    const crossings: number[] = [];

    for (const contour of contours) {
        const count = contour.length;

        if (count < 2) {
            continue;
        }

        for (let i = 0; i < count; i++) {
            const a = contour[i];
            const b = contour[(i + 1) % count];

            // Half-open test avoids double-counting shared vertices.
            if ((a.y <= scanY && b.y > scanY) || (b.y <= scanY && a.y > scanY)) {
                crossings.push(a.x + ((scanY - a.y) / (b.y - a.y)) * (b.x - a.x));
            }
        }
    }

    return crossings;
}

/**
 * Fills the interior of one or more closed contours using the even-odd rule. Each contour is a
 * polyline (implicitly closed); interiors are determined per scanline from edge crossings, so
 * concave shapes, circular segments, and annular sectors (holes) fill correctly.
 */
export function fillPolygon(contours: Vertex[][], plot: PixelCallback): void {
    let minY = Infinity;
    let maxY = -Infinity;

    for (const contour of contours) {
        for (const point of contour) {
            minY = Math.min(minY, point.y);
            maxY = Math.max(maxY, point.y);
        }
    }

    if (minY > maxY) {
        return;
    }

    for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
        const crossings = scanlineCrossings(contours, y + 0.5);

        if (crossings.length < 2) {
            continue;
        }

        crossings.sort(comparitorNumeric);

        for (let i = 0; i + 1 < crossings.length; i += 2) {
            const xStart = Math.round(crossings[i]);
            const xEnd = Math.round(crossings[i + 1]);

            for (let x = xStart; x <= xEnd; x++) {
                plot(x, y);
            }
        }
    }
}
