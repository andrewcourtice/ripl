/**
 * Circle-packing helpers for the packed-circle chart.
 *
 * `packSiblings` positions a set of circles (each with a fixed radius `r`) so that none overlap,
 * using the front-chain algorithm (Wang et al.) as popularised by D3: circles are placed tangent to
 * their neighbours around a growing chain, producing a tight, roughly circular cluster rather than a
 * loose spiral. `enclosingCircle` returns the *smallest* circle that contains them all (Welzl's
 * algorithm), used to centre and scale the packed layout into the chart area and to draw the visible
 * containing circle.
 *
 * Both are deterministic (no randomisation), so a given dataset always packs identically — important
 * for stable visual snapshots.
 */

/** A circle to be packed; `x`/`y` are assigned by {@link packSiblings}. */
export interface PackCircle {
    /** Centre x, assigned by {@link packSiblings}. */
    x: number;
    /** Centre y, assigned by {@link packSiblings}. */
    y: number;
    /** Fixed radius of the circle (supplied by the caller). */
    r: number;
}

/** A doubly-linked front-chain node wrapping a circle. */
interface ChainNode {
    circle: PackCircle;
    next: ChainNode;
    previous: ChainNode;
}

/** Places circle `c` externally tangent to both `a` and `b`. */
function place(a: PackCircle, b: PackCircle, c: PackCircle): void {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const d2 = dx * dx + dy * dy;

    if (d2) {
        const a2 = (a.r + c.r) * (a.r + c.r);
        const b2 = (b.r + c.r) * (b.r + c.r);

        if (a2 > b2) {
            const x = (d2 + b2 - a2) / (2 * d2);
            const y = Math.sqrt(Math.max(0, b2 / d2 - x * x));
            c.x = b.x - x * dx - y * dy;
            c.y = b.y - x * dy + y * dx;
        } else {
            const x = (d2 + a2 - b2) / (2 * d2);
            const y = Math.sqrt(Math.max(0, a2 / d2 - x * x));
            c.x = a.x + x * dx - y * dy;
            c.y = a.y + x * dy + y * dx;
        }
    } else {
        c.x = a.x + c.r;
        c.y = a.y;
    }
}

/** True when circles `a` and `b` overlap (beyond a small epsilon). */
function intersects(a: PackCircle, b: PackCircle): boolean {
    const dr = a.r + b.r - 1e-6;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return dr > 0 && dr * dr > dx * dx + dy * dy;
}

/** Squared distance from the origin to the weighted midpoint of a chain node and its successor. */
function score(node: ChainNode): number {
    const a = node.circle;
    const b = node.next.circle;
    const ab = a.r + b.r;
    const dx = (a.x * b.r + b.x * a.r) / ab;
    const dy = (a.y * b.r + b.y * a.r) / ab;
    return dx * dx + dy * dy;
}

/**
 * Assigns `x`/`y` to each circle so none overlap, arranged in a tight cluster centred on the origin.
 * Circles are packed largest-first (which yields a rounder, denser result) but the input array's
 * order — and each element's identity — is preserved, so callers can map results back by index.
 * Mutates and returns the input array.
 */
export function packSiblings(circles: PackCircle[]): PackCircle[] {
    const n = circles.length;

    if (!n) {
        return circles;
    }

    // Pack largest-first for a denser layout, without disturbing the caller's array order.
    const order = circles.slice().sort((left, right) => right.r - left.r);

    const a = order[0];
    a.x = 0;
    a.y = 0;

    if (n === 1) {
        return circles;
    }

    const b = order[1];
    a.x = -b.r;
    b.x = a.r;
    b.y = 0;

    if (n === 2) {
        return circles;
    }

    // Place the third circle tangent to the first two. Argument order matters: `place` puts `c` on
    // a specific side of the a→b vector, so this mirrors D3's `place(b, a, c)` seeding to keep the
    // front-chain wound consistently with the `place(a, b, c)` calls in the loop below.
    let c = order[2];
    place(b, a, c);

    // Seed the front-chain with the first three circles.
    let nodeA: ChainNode = {
        circle: a,
        next: null!,
        previous: null!,
    };
    let nodeB: ChainNode = {
        circle: b,
        next: null!,
        previous: null!,
    };
    const nodeC: ChainNode = {
        circle: c,
        next: null!,
        previous: null!,
    };
    nodeA.next = nodeB;
    nodeC.previous = nodeB;
    nodeB.next = nodeC;
    nodeA.previous = nodeC;
    nodeC.next = nodeA;
    nodeB.previous = nodeA;

    // Attempt to place each remaining circle.
    pack:
    for (let i = 3; i < n; i++) {
        c = order[i];
        place(nodeA.circle, nodeB.circle, c);

        // Walk out from the current pair looking for the nearest intersecting chain circle.
        let j = nodeB.next;
        let k = nodeA.previous;
        let sj = nodeB.circle.r;
        let sk = nodeA.circle.r;

        do {
            if (sj <= sk) {
                if (intersects(j.circle, c)) {
                    nodeB = j;
                    nodeA.next = nodeB;
                    nodeB.previous = nodeA;
                    i--;
                    continue pack;
                }
                sj += j.circle.r;
                j = j.next;
            } else {
                if (intersects(k.circle, c)) {
                    nodeA = k;
                    nodeA.next = nodeB;
                    nodeB.previous = nodeA;
                    i--;
                    continue pack;
                }
                sk += k.circle.r;
                k = k.previous;
            }
        } while (j !== k.next);

        // Success — splice the new circle into the chain between a and b.
        const inserted: ChainNode = {
            circle: c,
            next: nodeB,
            previous: nodeA,
        };
        nodeA.next = inserted;
        nodeB.previous = inserted;
        nodeB = inserted;

        // Recompute the pair whose weighted midpoint is closest to the centroid, walking the whole
        // chain from the newly inserted node.
        let best = score(nodeA);
        let walk = inserted;
        while ((walk = walk.next) !== nodeB) {
            const candidate = score(walk);
            if (candidate < best) {
                nodeA = walk;
                best = candidate;
            }
        }
        nodeB = nodeA.next;
    }

    // Recentre so the packed cluster's enclosing circle sits at the origin.
    const enclosing = enclosingCircle(circles);

    for (let i = 0; i < n; i++) {
        circles[i].x -= enclosing.x;
        circles[i].y -= enclosing.y;
    }

    return circles;
}

// --- Smallest-enclosing-circle (Welzl) ---

function enclosesWeak(a: PackCircle, b: PackCircle): boolean {
    const dr = a.r - b.r + Math.max(a.r, b.r, 1) * 1e-9;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return dr > 0 && dr * dr > dx * dx + dy * dy;
}

function enclosesWeakAll(a: PackCircle, basis: PackCircle[]): boolean {
    return basis.every(circle => enclosesWeak(a, circle));
}

function enclosesNot(a: PackCircle, b: PackCircle): boolean {
    const dr = a.r - b.r;
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return dr < 0 || dr * dr < dx * dx + dy * dy;
}

function encloseBasis1(a: PackCircle): PackCircle {
    return {
        x: a.x,
        y: a.y,
        r: a.r,
    };
}

function encloseBasis2(a: PackCircle, b: PackCircle): PackCircle {
    const x1 = a.x;
    const y1 = a.y;
    const r1 = a.r;
    const x2 = b.x;
    const y2 = b.y;
    const r2 = b.r;
    const x21 = x2 - x1;
    const y21 = y2 - y1;
    const r21 = r2 - r1;
    const l = Math.sqrt(x21 * x21 + y21 * y21);

    return {
        x: (x1 + x2 + x21 / l * r21) / 2,
        y: (y1 + y2 + y21 / l * r21) / 2,
        r: (l + r1 + r2) / 2,
    };
}

function encloseBasis3(a: PackCircle, b: PackCircle, c: PackCircle): PackCircle {
    const x1 = a.x;
    const y1 = a.y;
    const r1 = a.r;
    const x2 = b.x;
    const y2 = b.y;
    const r2 = b.r;
    const x3 = c.x;
    const y3 = c.y;
    const r3 = c.r;
    const a2 = x1 - x2;
    const a3 = x1 - x3;
    const b2 = y1 - y2;
    const b3 = y1 - y3;
    const c2 = r2 - r1;
    const c3 = r3 - r1;
    const d1 = x1 * x1 + y1 * y1 - r1 * r1;
    const d2 = d1 - x2 * x2 - y2 * y2 + r2 * r2;
    const d3 = d1 - x3 * x3 - y3 * y3 + r3 * r3;
    const ab = a3 * b2 - a2 * b3;
    const xa = (b2 * d3 - b3 * d2) / (ab * 2) - x1;
    const xb = (b3 * c2 - b2 * c3) / ab;
    const ya = (a3 * d2 - a2 * d3) / (ab * 2) - y1;
    const yb = (a2 * c3 - a3 * c2) / ab;
    const coefA = xb * xb + yb * yb - 1;
    const coefB = 2 * (r1 + xa * xb + ya * yb);
    const coefC = xa * xa + ya * ya - r1 * r1;
    const r = -(Math.abs(coefA) > 1e-6 ? (coefB + Math.sqrt(coefB * coefB - 4 * coefA * coefC)) / (2 * coefA) : coefC / coefB);

    return {
        x: x1 + xa + xb * r,
        y: y1 + ya + yb * r,
        r,
    };
}

function encloseBasis(basis: PackCircle[]): PackCircle {
    switch (basis.length) {
        case 1: return encloseBasis1(basis[0]);
        case 2: return encloseBasis2(basis[0], basis[1]);
        default: return encloseBasis3(basis[0], basis[1], basis[2]);
    }
}

function extendBasis(basis: PackCircle[], p: PackCircle): PackCircle[] {
    if (enclosesWeakAll(p, basis)) {
        return [p];
    }

    for (let i = 0; i < basis.length; i++) {
        if (enclosesNot(p, basis[i]) && enclosesWeakAll(encloseBasis2(basis[i], p), basis)) {
            return [basis[i], p];
        }
    }

    for (let i = 0; i < basis.length - 1; i++) {
        for (let j = i + 1; j < basis.length; j++) {
            if (enclosesNot(encloseBasis2(basis[i], basis[j]), p)
                && enclosesNot(encloseBasis2(basis[i], p), basis[j])
                && enclosesNot(encloseBasis2(basis[j], p), basis[i])
                && enclosesWeakAll(encloseBasis3(basis[i], basis[j], p), basis)) {
                return [basis[i], basis[j], p];
            }
        }
    }

    // Numerically unreachable for valid input; fall back to the current basis.
    return basis;
}

/** Returns the smallest circle (centre + radius) enclosing all the given circles. */
export function enclosingCircle(circles: PackCircle[]): { x: number;
    y: number;
    r: number; } {
    if (!circles.length) {
        return {
            x: 0,
            y: 0,
            r: 0,
        };
    }

    let basis: PackCircle[] = [];
    let enclose: PackCircle | undefined;
    let i = 0;

    while (i < circles.length) {
        const p = circles[i];

        if (enclose && enclosesWeak(enclose, p)) {
            i++;
        } else {
            basis = extendBasis(basis, p);
            enclose = encloseBasis(basis);
            i = 0;
        }
    }

    return {
        x: enclose!.x,
        y: enclose!.y,
        r: enclose!.r,
    };
}
