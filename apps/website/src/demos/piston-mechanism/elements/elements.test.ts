import {
    describe,
    expect,
    test,
} from 'vitest';

import type {
    Face3D,
} from '@ripl/3d';

import {
    box,
    createConnectingRod,
    createCrankshaft,
    createPistonHead,
    cylinderY,
    cylinderZ,
    elementIsConnectingRod,
    elementIsCrankshaft,
    elementIsPistonHead,
    ringZ,
} from './index';

/** Reaches the protected `computeFaces` method the way the 3d element tests do. */
function computeFaces(element: unknown): Face3D[] {
    return (element as { computeFaces(): Face3D[] }).computeFaces();
}

/** Every vertex component must be a finite number. */
function assertFinite(faces: Face3D[]) {
    expect(faces.length).toBeGreaterThan(0);

    for (const face of faces) {
        expect(face.vertices.length).toBeGreaterThanOrEqual(3);

        for (const vertex of face.vertices) {
            expect(vertex).toHaveLength(3);

            for (const component of vertex) {
                expect(Number.isFinite(component)).toBe(true);
            }
        }
    }
}

describe('piston-mechanism geometry helpers', () => {

    test('cylinderZ builds side quads plus two caps per segment', () => {
        const faces = cylinderZ(0, 0, 0.1, -0.2, 0.2, 8);

        expect(faces).toHaveLength(8 * 3);
        assertFinite(faces);
    });

    test('cylinderY builds side quads plus two caps per segment', () => {
        const faces = cylinderY(0, 0, 0.1, -0.2, 0.2, 8);

        expect(faces).toHaveLength(8 * 3);
        assertFinite(faces);
    });

    test('ringZ builds four faces per segment', () => {
        const faces = ringZ(0, 0, 0.03, 0.05, -0.02, 0.02, 8);

        expect(faces).toHaveLength(8 * 4);
        assertFinite(faces);
    });

    test('box builds six faces regardless of corner order', () => {
        const faces = box(0.1, 0.2, 0.3, -0.1, -0.2, -0.3);

        expect(faces).toHaveLength(6);
        assertFinite(faces);
    });

});

describe('Crankshaft', () => {

    test('creates with default and overridden state', () => {
        const crank = createCrankshaft({
            y: -0.2,
            throw: 0.2,
        });

        expect(crank.type).toBe('crankshaft');
        expect(crank.y).toBe(-0.2);
        expect(crank.throw).toBe(0.2);
        expect(crank.mainRadius).toBeGreaterThan(0);
        expect(elementIsCrankshaft(crank)).toBe(true);
        expect(elementIsCrankshaft({})).toBe(false);
    });

    test('computes a finite, non-empty mesh', () => {
        assertFinite(computeFaces(createCrankshaft()));
    });

});

describe('ConnectingRod', () => {

    test('creates with default and overridden state', () => {
        const rod = createConnectingRod({ length: 0.5 });

        expect(rod.type).toBe('connecting-rod');
        expect(rod.length).toBe(0.5);
        expect(rod.bigEndRadius).toBeGreaterThan(rod.smallEndRadius);
        expect(elementIsConnectingRod(rod)).toBe(true);
        expect(elementIsConnectingRod(null)).toBe(false);
    });

    test('computes a finite, non-empty mesh', () => {
        assertFinite(computeFaces(createConnectingRod()));
    });

});

describe('PistonHead', () => {

    test('creates with default and overridden state', () => {
        const piston = createPistonHead({ radius: 0.1 });

        expect(piston.type).toBe('piston-head');
        expect(piston.radius).toBe(0.1);
        expect(piston.pinLength).toBeGreaterThan(0);
        expect(elementIsPistonHead(piston)).toBe(true);
        expect(elementIsPistonHead(42)).toBe(false);
    });

    test('computes a finite, non-empty mesh', () => {
        assertFinite(computeFaces(createPistonHead()));
    });

});
