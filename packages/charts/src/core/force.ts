/**
 * A tiny deterministic force simulation for the force-directed network chart.
 *
 * Runs a fixed number of iterations of three classic forces — many-body charge (repulsion), link
 * springs, and a centering pull — integrating node velocities with a decay each step so the layout
 * cools to a stable arrangement. Initial positions are seeded deterministically (on a circle by
 * index), so the settled layout is reproducible run-to-run — important for stable visual snapshots.
 */

/** A node in the simulation; `x`/`y`/`vx`/`vy` are managed by {@link simulateForce}. */
export interface ForceNode {
    /** Stable identifier used to resolve links to this node. */
    id: string;
    /** Current x position (seeded and then relaxed by {@link simulateForce}). */
    x: number;
    /** Current y position (seeded and then relaxed by {@link simulateForce}). */
    y: number;
    /** Current x velocity (managed by the simulation). */
    vx: number;
    /** Current y velocity (managed by the simulation). */
    vy: number;
}

/** A link between two node ids. */
export interface ForceLink {
    /** Id of the source node. */
    source: string;
    /** Id of the target node. */
    target: string;
}

/** Tunable strengths and iteration count for {@link simulateForce}. */
export interface ForceOptions {
    /** Many-body charge; negative repels, positive attracts. Defaults to `-240`. */
    charge?: number;
    /** Rest length of the link springs, in pixels. Defaults to `60`. */
    linkDistance?: number;
    /** Stiffness of the link springs (0–1). Defaults to `0.5`. */
    linkStrength?: number;
    /** X coordinate of the centering pull. Defaults to `0`. */
    centerX?: number;
    /** Y coordinate of the centering pull. Defaults to `0`. */
    centerY?: number;
    /** Strength of the pull toward the centre point. Defaults to `0.05`. */
    centerStrength?: number;
    /** Number of cooling iterations to run. Defaults to `300`. */
    iterations?: number;
    /** Fraction of velocity shed each step (0–1). Defaults to `0.6`. */
    velocityDecay?: number;
}

/**
 * Settles `nodes` in place under charge/link/centering forces. Node `x`/`y` are seeded on a circle by
 * index (unless already non-zero) and then relaxed over `iterations` cooling steps. Mutates and
 * returns `nodes`.
 */
export function simulateForce(nodes: ForceNode[], links: ForceLink[], options: ForceOptions = {}): ForceNode[] {
    const {
        charge = -240,
        linkDistance = 60,
        linkStrength = 0.5,
        centerX = 0,
        centerY = 0,
        centerStrength = 0.05,
        iterations = 300,
        velocityDecay = 0.6,
    } = options;

    const count = nodes.length;

    if (count === 0) {
        return nodes;
    }

    // Deterministic seed positions on a circle (skip nodes already placed).
    nodes.forEach((node, index) => {
        if (node.x === 0 && node.y === 0) {
            const angle = (index / count) * Math.PI * 2;
            const radius = linkDistance * Math.sqrt(count);
            node.x = centerX + radius * Math.cos(angle);
            node.y = centerY + radius * Math.sin(angle);
        }

        node.vx = node.vx || 0;
        node.vy = node.vy || 0;
    });

    const byId = new Map(nodes.map(node => [node.id, node]));
    const retain = 1 - velocityDecay;

    for (let iteration = 0; iteration < iterations; iteration++) {
        // Cooling factor from 1 → ~0.
        const alpha = 1 - iteration / iterations;

        // Many-body charge (repulsion) — O(n²), fine for the modest graphs a chart renders.
        for (let i = 0; i < count; i++) {
            const a = nodes[i];

            for (let j = i + 1; j < count; j++) {
                const b = nodes[j];
                let dx = b.x - a.x;
                let dy = b.y - a.y;
                let distanceSq = dx * dx + dy * dy;

                if (distanceSq === 0) {
                    // Nudge coincident nodes apart deterministically.
                    dx = (i - j) * 1e-3 + 1e-3;
                    dy = (j - i) * 1e-3 + 1e-3;
                    distanceSq = dx * dx + dy * dy;
                }

                const strength = (charge * alpha) / distanceSq;
                const fx = dx * strength;
                const fy = dy * strength;

                // charge is negative → this pushes the pair apart.
                a.vx += fx;
                a.vy += fy;
                b.vx -= fx;
                b.vy -= fy;
            }
        }

        // Link springs.
        links.forEach(link => {
            const source = byId.get(link.source);
            const target = byId.get(link.target);

            if (!source || !target) {
                return;
            }

            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const distance = Math.hypot(dx, dy) || 1e-3;
            const displacement = ((distance - linkDistance) / distance) * alpha * linkStrength;
            const fx = dx * displacement;
            const fy = dy * displacement;

            source.vx += fx * 0.5;
            source.vy += fy * 0.5;
            target.vx -= fx * 0.5;
            target.vy -= fy * 0.5;
        });

        // Centering pull + integrate.
        nodes.forEach(node => {
            node.vx += (centerX - node.x) * centerStrength * alpha;
            node.vy += (centerY - node.y) * centerStrength * alpha;

            node.vx *= retain;
            node.vy *= retain;

            node.x += node.vx;
            node.y += node.vy;
        });
    }

    return nodes;
}
