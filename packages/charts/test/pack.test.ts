import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    enclosingCircle,
    packSiblings,
    PackCircle,
} from '../src/core/pack';

function circles(radii: number[]): PackCircle[] {
    return radii.map(r => ({ x: 0, y: 0, r }));
}

function anyOverlap(packed: PackCircle[]): boolean {
    for (let i = 0; i < packed.length; i++) {
        for (let j = i + 1; j < packed.length; j++) {
            const a = packed[i];
            const b = packed[j];
            const distance = Math.hypot(a.x - b.x, a.y - b.y);
            if (distance < a.r + b.r - 1e-3) {
                return true;
            }
        }
    }

    return false;
}

describe('packSiblings', () => {

    test('places a single circle at the origin', () => {
        const [only] = packSiblings(circles([10]));
        expect(only.x).toBe(0);
        expect(only.y).toBe(0);
    });

    test('produces a non-overlapping layout for varied radii', () => {
        const packed = packSiblings(circles([20, 15, 15, 10, 8, 8, 6, 5, 5, 4, 3]));
        expect(anyOverlap(packed)).toBe(false);
    });

    test('handles many equal circles without overlap', () => {
        const packed = packSiblings(circles(Array.from({ length: 25 }, () => 6)));
        expect(anyOverlap(packed)).toBe(false);
        expect(packed).toHaveLength(25);
    });

    test('packs a large varied set without overlap', () => {
        const packed = packSiblings(circles(Array.from({ length: 60 }, (_, i) => 3 + (i % 9))));
        expect(anyOverlap(packed)).toBe(false);
        expect(packed).toHaveLength(60);
    });

    test('preserves input order (results map back by index)', () => {
        const input = circles([5, 20, 8]);
        const packed = packSiblings(input);
        // Same array, same element identities — only x/y were assigned.
        expect(packed).toBe(input);
        expect(packed.map(circle => circle.r)).toEqual([5, 20, 8]);
    });

    test('centres the packed cluster on the origin', () => {
        const packed = packSiblings(circles([20, 15, 15, 10, 8, 8, 6, 5, 5, 4, 3]));
        const bounds = enclosingCircle(packed);
        expect(Math.abs(bounds.x)).toBeLessThan(1e-6);
        expect(Math.abs(bounds.y)).toBeLessThan(1e-6);
    });

    test('produces a tight cluster (front-chain, not a loose spiral)', () => {
        const radii = Array.from({ length: 40 }, (_, i) => 4 + (i % 7));
        const packed = packSiblings(circles(radii));
        const bounds = enclosingCircle(packed);

        const circleArea = radii.reduce((sum, r) => sum + Math.PI * r * r, 0);
        const enclosingArea = Math.PI * bounds.r * bounds.r;

        // A tight pack fills well over half the enclosing disc; the old spiral packer fell short.
        expect(circleArea / enclosingArea).toBeGreaterThan(0.6);
    });

    test('is a no-op for an empty input', () => {
        expect(packSiblings([])).toEqual([]);
    });

});

describe('enclosingCircle', () => {

    test('returns a circle that contains every packed circle', () => {
        const packed = packSiblings(circles([12, 10, 9, 7, 6, 5, 4]));
        const bounds = enclosingCircle(packed);

        packed.forEach(circle => {
            const distance = Math.hypot(circle.x - bounds.x, circle.y - bounds.y) + circle.r;
            expect(distance).toBeLessThanOrEqual(bounds.r + 1e-6);
        });
    });

    test('returns a zero circle for empty input', () => {
        expect(enclosingCircle([])).toEqual({ x: 0, y: 0, r: 0 });
    });

});
