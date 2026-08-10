import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    buildSurface,
    createSurface,
    createSurfaceBounds,
    elementIsSurface,
    surfaceColorScale,
    surfaceWorldPoint,
    updateSurface,
} from './surface-3d';

import {
    parseColor,
} from '@ripl/core';

import type {
    Face3D,
} from '@ripl/3d';

import type {
    SurfaceDomain,
    SurfaceField,
} from '../types';

const DOMAIN: SurfaceDomain = {
    xMin: -2,
    xMax: 2,
    yMin: -2,
    yMax: 2,
};

/** Reaches the protected `computeFaces` method the way the 3d element tests do. */
function computeFaces(element: unknown): Face3D[] {
    return (element as { computeFaces(): Face3D[] }).computeFaces();
}

function createField(resolution: number, height: (x: number, y: number) => number, domain: SurfaceDomain = DOMAIN): SurfaceField {
    const values = new Float64Array(resolution * resolution);

    let zMin = Infinity;
    let zMax = -Infinity;

    for (let j = 0; j < resolution; j++) {
        const y = domain.yMin + (domain.yMax - domain.yMin) * (j / (resolution - 1));

        for (let i = 0; i < resolution; i++) {
            const x = domain.xMin + (domain.xMax - domain.xMin) * (i / (resolution - 1));
            const value = height(x, y);

            values[j * resolution + i] = value;

            if (Number.isFinite(value)) {
                zMin = Math.min(zMin, value);
                zMax = Math.max(zMax, value);
            }
        }
    }

    return {
        resolution,
        domain,
        values,
        zMin: Number.isFinite(zMin) ? zMin : 0,
        zMax: Number.isFinite(zMax) ? zMax : 0,
    };
}

function totalFaces(field: SurfaceField): Face3D[] {
    return computeFaces(buildSurface(field));
}

function isFiniteVertex(vertex: number[]): boolean {
    return vertex.every(component => Number.isFinite(component));
}

describe('surfaceColorScale', () => {

    test('Should map the range ends to different colours', () => {
        const scale = surfaceColorScale(-1, 1);

        expect(scale(-1)).not.toBe(scale(1));
    });

    // The colormap used to be quantised into 14 bands, one element each, because a 3D element
    // carried a single fill. Per-vertex colours make it continuous.
    test('Should be continuous rather than banded', () => {
        const scale = surfaceColorScale(-1, 1);
        const seen = new Set<string>();

        for (let i = 0; i <= 200; i++) {
            seen.add(scale(-1 + i / 100));
        }

        expect(seen.size).toBeGreaterThan(100);
    });

    test('Should be deterministic for a given height', () => {
        const scale = surfaceColorScale(-1, 1);

        expect(scale(0.25)).toBe(scale(0.25));
        expect(scale(-0.5)).not.toBe(scale(0.5));
    });

    test('Should return a colour for a flat field', () => {
        expect(parseColor(surfaceColorScale(3, 3)(3))).toBeDefined();
    });

    test('Should return a colour for a non-finite height', () => {
        expect(parseColor(surfaceColorScale(-1, 1)(NaN))).toBeDefined();
    });

    /*
     * 3D-C1: the scale emitted fractional channels the library's own parser rejected, so the
     * shading path resolved every vertex to the material's default grey. `toMatch(/^(#|rgb)/)`
     * passed throughout, because the strings looked like colours — they just could not be read.
     */
    test('Should emit colours the shading path can resolve', () => {
        const scale = surfaceColorScale(-1, 1);

        for (let i = 0; i <= 200; i++) {
            expect(parseColor(scale(-1 + i / 100))).toBeDefined();
        }
    });

});

describe('surfaceWorldPoint', () => {

    const bounds = createSurfaceBounds(createField(4, (x, y) => x + y));

    test('Should map the domain minimum to the negative corner', () => {
        expect(surfaceWorldPoint(bounds, DOMAIN.xMin, DOMAIN.yMin, bounds.zMin)).toEqual([-1, -0.55, -1]);
    });

    test('Should map the domain maximum to the positive corner', () => {
        expect(surfaceWorldPoint(bounds, DOMAIN.xMax, DOMAIN.yMax, bounds.zMax)).toEqual([1, 0.55, 1]);
    });

    test('Should map the domain center to the origin', () => {
        expect(surfaceWorldPoint(bounds, 0, 0, (bounds.zMin + bounds.zMax) / 2)).toEqual([0, 0, 0]);
    });

    test('Should honor a custom extent', () => {
        const scaled = createSurfaceBounds(createField(4, (x, y) => x + y), {
            extent: 4,
            heightExtent: 2,
        });

        expect(surfaceWorldPoint(scaled, DOMAIN.xMax, DOMAIN.yMax, scaled.zMax)).toEqual([4, 2, 4]);
    });

    test('Should map a flat field to the middle of the height axis', () => {
        const flat = createSurfaceBounds(createField(4, () => 3));

        expect(surfaceWorldPoint(flat, 0, 0, 3)[1]).toBe(0);
    });

});

describe('Surface geometry', () => {

    test('Should emit one quad per grid cell', () => {
        const field = createField(9, (x, y) => Math.sin(x) * Math.cos(y));

        expect(totalFaces(field)).toHaveLength(8 * 8);
    });

    test('Should preserve the total quad count across the banded split', () => {
        const field = createField(17, (x, y) => Math.sin(x) * Math.cos(y));

        expect(totalFaces(field)).toHaveLength(16 * 16);
    });

    test('Should preserve the total quad count for a monotonic field', () => {
        const field = createField(13, (x, y) => x + y);

        expect(totalFaces(field)).toHaveLength(12 * 12);
    });

    test('Should emit each grid cell exactly once', () => {
        const field = createField(17, (x, y) => x + y);
        const faces = totalFaces(field);
        const corners = new Set(faces.map(face => `${face.vertices[0][0]}:${face.vertices[0][2]}`));

        expect(corners.size).toBe(faces.length);
    });

    test('Should colour every vertex of every quad', () => {
        const field = createField(17, (x, y) => x + y);

        expect(totalFaces(field).every(face => face.colors?.length === face.vertices.length)).toBe(true);
    });

    // One element per band was the workaround for a 3D element carrying a single fill; per-vertex
    // colours are what let the whole surface be one element.
    test('Should resolve many distinct colours across a varying field', () => {
        const field = createField(33, (x, y) => x + y);
        const colors = new Set(totalFaces(field).flatMap(face => face.colors ?? []));

        expect(colors.size).toBeGreaterThan(50);
    });

    test('Should emit four vertices per quad', () => {
        const field = createField(9, (x, y) => x * y);

        expect(totalFaces(field).every(face => face.vertices.length === 4)).toBe(true);
    });

    test('Should emit only finite vertex components', () => {
        const field = createField(21, (x, y) => Math.sin(Math.sqrt(x * x + y * y)));

        expect(totalFaces(field).every(face => face.vertices.every(isFiniteVertex))).toBe(true);
    });

    test('Should emit only finite vertex components for a flat field', () => {
        const field = createField(9, () => 2);

        expect(totalFaces(field).every(face => face.vertices.every(isFiniteVertex))).toBe(true);
    });

    test('Should emit no non-finite vertices for a field with NaN holes', () => {
        const field = createField(21, (x, y) => x * y < 0 ? NaN : Math.sqrt(x * x + y * y));

        expect(totalFaces(field).every(face => face.vertices.every(isFiniteVertex))).toBe(true);
    });

    test('Should drop the cells touching a NaN hole', () => {
        const field = createField(21, (x, y) => x * y < 0 ? NaN : Math.sqrt(x * x + y * y));

        expect(totalFaces(field).length).toBeLessThan(20 * 20);
    });

    test('Should still emit the cells clear of a NaN hole', () => {
        const field = createField(21, (x, y) => x * y < 0 ? NaN : Math.sqrt(x * x + y * y));

        expect(totalFaces(field).length).toBeGreaterThan(0);
    });

    test('Should emit no faces when the whole field is undefined', () => {
        const field = createField(9, () => NaN);

        expect(totalFaces(field)).toHaveLength(0);
    });

    test('Should emit no faces for a grid too small to form a cell', () => {
        const field = createField(1, () => 0);

        expect(totalFaces(field)).toHaveLength(0);
    });

    test('Should wind quads so the surface normal points up', () => {
        const field = createField(5, () => 1);
        const [face] = totalFaces(field);
        const [v0, v1, v2] = face.vertices;
        const edge1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
        const edge2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];

        expect(edge1[2] * edge2[0] - edge1[0] * edge2[2]).toBeGreaterThan(0);
    });

});

describe('Surface element', () => {

    test('Should report the grid resolution as its segment count', () => {
        const field = createField(7, (x, y) => x + y);
        const surface = createSurface({
            field,
            bounds: createSurfaceBounds(field),
        });

        expect(surface.segments).toBe(7);
    });

    test('Should carry the surface element type', () => {
        const field = createField(5, (x, y) => x + y);
        const surface = createSurface({
            field,
            bounds: createSurfaceBounds(field),
        });

        expect(surface.type).toBe('surface');
    });

    test('Should rebuild its mesh at the new resolution after setField', () => {
        const field = createField(5, (x, y) => x + y);
        const surface = createSurface({
            field,
            bounds: createSurfaceBounds(field),
        });

        expect(computeFaces(surface)).toHaveLength(4 * 4);

        const refined = createField(9, (x, y) => x + y);

        surface.setField(refined, createSurfaceBounds(refined));

        expect(computeFaces(surface)).toHaveLength(8 * 8);
    });

    test('Should bump its revision on every field swap', () => {
        const field = createField(5, (x, y) => x + y);
        const surface = createSurface({
            field,
            bounds: createSurfaceBounds(field),
        });

        surface.setField(field, createSurfaceBounds(field));

        expect(surface.revision).toBe(1);
    });

    test('Should identify surfaces', () => {
        const field = createField(5, (x, y) => x + y);
        const surface = createSurface({
            field,
            bounds: createSurfaceBounds(field),
        });

        expect(elementIsSurface(surface)).toBe(true);
    });

    test('Should reject a non-surface value', () => {
        expect(elementIsSurface({})).toBe(false);
    });

    test('Should enable vertex colours by default', () => {
        const field = createField(5, (x, y) => x + y);
        const surface = createSurface({
            field,
            bounds: createSurfaceBounds(field),
        });

        expect(surface.material?.vertexColors).toBe(true);
    });

});

describe('buildSurface', () => {

    test('Should create a single element', () => {
        const field = createField(9, (x, y) => x + y);

        expect(elementIsSurface(buildSurface(field))).toBe(true);
    });

    test('Should apply the requested edge stroke', () => {
        const field = createField(9, (x, y) => x + y);
        const surface = buildSurface(field, {
            stroke: '#123456',
            lineWidth: 0.25,
        });

        expect(surface.stroke).toBe('#123456');
        expect(surface.lineWidth).toBe(0.25);
    });

    test('Should fit the world box to the field', () => {
        const field = createField(9, (x, y) => x + y);

        expect(buildSurface(field).bounds.zMax).toBe(4);
    });

});

describe('updateSurface', () => {

    test('Should re-point the surface at the new field', () => {
        const surface = buildSurface(createField(9, (x, y) => x + y));
        const refined = createField(13, (x, y) => x + y);

        updateSurface(surface, refined);

        expect(surface.field).toBe(refined);
    });

    test('Should preserve the quad count after a resolution swap', () => {
        const surface = buildSurface(createField(9, (x, y) => x + y));

        updateSurface(surface, createField(13, (x, y) => x + y));

        expect(computeFaces(surface)).toHaveLength(12 * 12);
    });

    test('Should refit the world box to the new height range', () => {
        const surface = buildSurface(createField(9, (x, y) => x + y));

        updateSurface(surface, createField(9, (x, y) => (x + y) * 10));

        expect(surface.bounds.zMax).toBe(40);
    });

    test('Should recolour to the new height range', () => {
        const surface = buildSurface(createField(9, (x, y) => x + y));
        const before = computeFaces(surface).flatMap(face => face.colors ?? []);

        updateSurface(surface, createField(9, (x, y) => (x + y) * 10));

        const after = computeFaces(surface).flatMap(face => face.colors ?? []);

        expect(after).toEqual(before);
    });

});
