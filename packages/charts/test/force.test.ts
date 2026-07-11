import {
    describe,
    expect,
    test,
} from 'vitest';

import type {
    ForceLink,
    ForceNode,
} from '../src/core/force';

import {
    simulateForce,
} from '../src/core/force';

function nodes(ids: string[]): ForceNode[] {
    return ids.map(id => ({
        id,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
    }));
}

describe('simulateForce', () => {

    test('settles to finite, non-NaN positions', () => {
        const n = nodes(['a', 'b', 'c', 'd', 'e']);
        const links: ForceLink[] = [
            {
                source: 'a',
                target: 'b',
            },
            {
                source: 'a',
                target: 'c',
            },
            {
                source: 'b',
                target: 'd',
            },
            {
                source: 'c',
                target: 'e',
            },
        ];

        simulateForce(n, links, { iterations: 200 });

        n.forEach(node => {
            expect(Number.isFinite(node.x)).toBe(true);
            expect(Number.isFinite(node.y)).toBe(true);
        });
    });

    test('is deterministic for the same input', () => {
        const links: ForceLink[] = [
            {
                source: 'a',
                target: 'b',
            },
            {
                source: 'b',
                target: 'c',
            },
        ];

        const first = simulateForce(nodes(['a', 'b', 'c']), links, { iterations: 150 });
        const second = simulateForce(nodes(['a', 'b', 'c']), links, { iterations: 150 });

        first.forEach((node, index) => {
            expect(node.x).toBeCloseTo(second[index].x, 6);
            expect(node.y).toBeCloseTo(second[index].y, 6);
        });
    });

    test('pulls linked nodes toward the link distance', () => {
        const n = nodes(['a', 'b']);
        simulateForce(n, [{
            source: 'a',
            target: 'b',
        }], {
            iterations: 400,
            linkDistance: 80,
            centerStrength: 0.02,
        });

        const distance = Math.hypot(n[0].x - n[1].x, n[0].y - n[1].y);
        // Two linked nodes should relax to roughly the link distance (repulsion vs spring balance).
        expect(distance).toBeGreaterThan(40);
        expect(distance).toBeLessThan(160);
    });

    test('separates unlinked nodes (repulsion)', () => {
        const n = nodes(['a', 'b']);
        simulateForce(n, [], { iterations: 200 });
        const distance = Math.hypot(n[0].x - n[1].x, n[0].y - n[1].y);
        expect(distance).toBeGreaterThan(0);
    });

    test('keeps pre-seeded positions instead of re-seeding them', () => {
        // The chart seeds existing nodes from their last layout so reweights animate from where they
        // were. Only zero positions get the circular seed; non-zero positions are left in place.
        const seeded: ForceNode[] = [
            {
                id: 'a',
                x: 42,
                y: -17,
                vx: 0,
                vy: 0,
            },
            {
                id: 'b',
                x: -8,
                y: 30,
                vx: 0,
                vy: 0,
            },
        ];

        simulateForce(seeded, [], { iterations: 0 });

        expect(seeded[0]).toMatchObject({
            x: 42,
            y: -17,
        });
        expect(seeded[1]).toMatchObject({
            x: -8,
            y: 30,
        });
    });

    test('relaxes only slightly when re-run from a settled layout', () => {
        const ids = ['a', 'b', 'c', 'd', 'e'];
        const links: ForceLink[] = [
            {
                source: 'a',
                target: 'b',
            },
            {
                source: 'a',
                target: 'c',
            },
            {
                source: 'b',
                target: 'd',
            },
            {
                source: 'c',
                target: 'e',
            },
        ];

        // Settle once, then re-run seeded from those positions (as the chart does on a reweight of
        // the same topology). The layout should barely move, not reshuffle.
        const settled = simulateForce(nodes(ids), links, { iterations: 300 });
        const seeded = settled.map(node => ({
            ...node,
            vx: 0,
            vy: 0,
        }));
        const relaxed = simulateForce(seeded, links, { iterations: 300 });

        relaxed.forEach((node, index) => {
            const moved = Math.hypot(node.x - settled[index].x, node.y - settled[index].y);
            expect(moved).toBeLessThan(5);
        });
    });

    test('is a no-op for an empty graph', () => {
        expect(simulateForce([], [])).toEqual([]);
    });

});
