/**
 * Circle-packing helpers for the packed-circle chart.
 *
 * `packSiblings` positions a set of circles (each with a fixed radius `r`) around the origin so that
 * none overlap, placing the largest first and spiralling each subsequent circle outward from the
 * current centroid until it finds a free spot. `enclosingCircle` returns a circle that contains them
 * all, used to centre and scale the packed layout into the chart area.
 *
 * This is a pragmatic, dependency-free packer: the result is a roughly circular, gap-free-ish blob —
 * not the mathematically tightest packing, but stable, non-overlapping, and cheap for the dozens of
 * circles a chart renders.
 */

/** A circle to be packed; `x`/`y` are assigned by {@link packSiblings}. */
export interface PackCircle {
    x: number;
    y: number;
    r: number;
}

function centroid(circles: PackCircle[]): { x: number;
    y: number; } {
    if (!circles.length) {
        return { x: 0, y: 0 };
    }

    let x = 0;
    let y = 0;

    circles.forEach(circle => {
        x += circle.x;
        y += circle.y;
    });

    return {
        x: x / circles.length,
        y: y / circles.length,
    };
}

function overlapsAny(placed: PackCircle[], x: number, y: number, r: number): boolean {
    return placed.some(circle => {
        const dx = circle.x - x;
        const dy = circle.y - y;
        const minDistance = circle.r + r;
        return dx * dx + dy * dy < minDistance * minDistance - 1e-6;
    });
}

/**
 * Assigns `x`/`y` to each circle so none overlap. Circles are placed largest-first; the first sits at
 * the origin and each subsequent one spirals out from the current centroid to the nearest free spot.
 * Mutates and returns the input array.
 */
export function packSiblings(circles: PackCircle[]): PackCircle[] {
    const placed: PackCircle[] = [];

    // Largest first (stable) for a tighter, more central result.
    const order = circles
        .map((_, index) => index)
        .sort((a, b) => circles[b].r - circles[a].r);

    order.forEach(index => {
        const circle = circles[index];

        if (!placed.length) {
            circle.x = 0;
            circle.y = 0;
            placed.push(circle);
            return;
        }

        const centre = centroid(placed);
        const step = Math.max(0.5, circle.r * 0.25);
        let positioned = false;

        for (let tick = 0; tick < 20000 && !positioned; tick++) {
            const angle = tick * 0.5;
            const radius = (step * angle) / (2 * Math.PI);
            const x = centre.x + radius * Math.cos(angle);
            const y = centre.y + radius * Math.sin(angle);

            if (!overlapsAny(placed, x, y, circle.r)) {
                circle.x = x;
                circle.y = y;
                placed.push(circle);
                positioned = true;
            }
        }

        if (!positioned) {
            // Extremely unlikely fallback — stack clear of the blob so it still never overlaps.
            circle.x = centre.x;
            circle.y = centre.y + 4 * circle.r * placed.length;
            placed.push(circle);
        }
    });

    return circles;
}

/** Returns a circle that encloses all the given circles (centre + radius), used to fit the layout. */
export function enclosingCircle(circles: PackCircle[]): { x: number;
    y: number;
    r: number; } {
    if (!circles.length) {
        return { x: 0, y: 0, r: 0 };
    }

    const centre = centroid(circles);
    let r = 0;

    circles.forEach(circle => {
        const distance = Math.hypot(circle.x - centre.x, circle.y - centre.y) + circle.r;
        r = Math.max(r, distance);
    });

    return {
        x: centre.x,
        y: centre.y,
        r,
    };
}
