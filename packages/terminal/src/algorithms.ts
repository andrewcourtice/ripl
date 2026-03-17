/** Callback invoked for each pixel in a rasterization pass. */
export type PixelCallback = (x: number, y: number) => void;

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

/** Rasterizes an ellipse outline at (cx,cy) with the given radii using the midpoint algorithm. */
export function rasterizeEllipse(cx: number, cy: number, rx: number, ry: number, plot: PixelCallback): void {
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

/** Rasterizes a cubic bezier curve by adaptive subdivision into line segments. */
export function rasterizeCubicBezier(
    x0: number, y0: number,
    cp1x: number, cp1y: number,
    cp2x: number, cp2y: number,
    x1: number, y1: number,
    plot: PixelCallback
): void {
    const steps = estimateBezierSteps(x0, y0, cp1x, cp1y, cp2x, cp2y, x1, y1);

    let prevX = x0;
    let prevY = y0;

    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const nx = cubicBezierAt(t, x0, cp1x, cp2x, x1);
        const ny = cubicBezierAt(t, y0, cp1y, cp2y, y1);

        rasterizeLine(prevX, prevY, nx, ny, plot);

        prevX = nx;
        prevY = ny;
    }
}

/** Rasterizes a quadratic bezier curve by adaptive subdivision into line segments. */
export function rasterizeQuadBezier(
    x0: number, y0: number,
    cpx: number, cpy: number,
    x1: number, y1: number,
    plot: PixelCallback
): void {
    const dx = Math.abs(x1 - x0) + Math.abs(cpx - x0);
    const dy = Math.abs(y1 - y0) + Math.abs(cpy - y0);
    const steps = Math.max(8, Math.ceil(Math.sqrt(dx * dx + dy * dy) / 2));

    let prevX = x0;
    let prevY = y0;

    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const nx = quadBezierAt(t, x0, cpx, x1);
        const ny = quadBezierAt(t, y0, cpy, y1);

        rasterizeLine(prevX, prevY, nx, ny, plot);

        prevX = nx;
        prevY = ny;
    }
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

/** Rasterizes an arc from startAngle to endAngle at (cx,cy) with given radius by subdivision into line segments. */
export function rasterizeArc(
    cx: number, cy: number,
    radius: number,
    startAngle: number, endAngle: number,
    counterclockwise: boolean,
    plot: PixelCallback
): void {
    const start = startAngle;

    let end = endAngle;

    if (counterclockwise && end > start) {
        end -= Math.PI * 2;
    } else if (!counterclockwise && end < start) {
        end += Math.PI * 2;
    }

    const angleDiff = Math.abs(end - start);
    const steps = Math.max(8, Math.ceil(angleDiff * radius / 2));

    let prevX = cx + radius * Math.cos(start);
    let prevY = cy + radius * Math.sin(start);

    for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        const angle = start + (end - start) * t;
        const nx = cx + radius * Math.cos(angle);
        const ny = cy + radius * Math.sin(angle);

        rasterizeLine(prevX, prevY, nx, ny, plot);

        prevX = nx;
        prevY = ny;
    }
}

/** Scanline-fills the interior of a polygon defined by its edge pixels. Expects edges to have been rasterized and collected. */
export function scanlineFill(edges: Map<number, number[]>, plot: PixelCallback): void {
    edges.forEach((xCoords, y) => {
        if (xCoords.length < 2) {
            return;
        }

        xCoords.sort((a, b) => a - b);

        const minX = xCoords[0];
        const maxX = xCoords[xCoords.length - 1];

        for (let x = minX; x <= maxX; x++) {
            plot(x, y);
        }
    });
}
