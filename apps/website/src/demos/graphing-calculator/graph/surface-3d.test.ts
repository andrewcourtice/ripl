import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    buildSurfaceBands,
    createSurfaceBand,
    createSurfaceBounds,
    elementIsSurfaceBand,
    SURFACE_BAND_COUNT,
    surfaceBandColors,
    surfaceBandIndex,
    surfaceWorldPoint,
    updateSurfaceBands,
} from './surface-3d';

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

function totalFaces(field: SurfaceField, bandCount: number = SURFACE_BAND_COUNT): Face3D[] {
    return buildSurfaceBands(field, {
        bandCount,
    }).flatMap(band => computeFaces(band));
}

function isFiniteVertex(vertex: number[]): boolean {
    return vertex.every(component => Number.isFinite(component));
}

describe('surfaceBandIndex', () => {

    test('Should place the lowest height in the first band', () => {
        expect(surfaceBandIndex(-1, -1, 1, 8)).toBe(0);
    });

    test('Should place the highest height in the last band', () => {
        expect(surfaceBandIndex(1, -1, 1, 8)).toBe(7);
    });

    test('Should cover every band across the height range', () => {
        const seen = new Set<number>();

        for (let i = 0; i <= 1000; i++) {
            seen.add(surfaceBandIndex(-1 + i / 500, -1, 1, 8));
        }

        expect(Array.from(seen).sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
    });

    test('Should return the same band for the same height', () => {
        expect(surfaceBandIndex(0.37, -1, 1, 12)).toBe(surfaceBandIndex(0.37, -1, 1, 12));
    });

    test('Should increase monotonically with height', () => {
        expect(surfaceBandIndex(-0.5, -1, 1, 12)).toBeLessThan(surfaceBandIndex(0.5, -1, 1, 12));
    });

    test('Should collapse a flat field onto the first band', () => {
        expect(surfaceBandIndex(3, 3, 3, 12)).toBe(0);
    });

    test('Should collapse a non-finite height onto the first band', () => {
        expect(surfaceBandIndex(NaN, -1, 1, 12)).toBe(0);
    });

});

describe('surfaceBandColors', () => {

    test('Should return one color per band', () => {
        expect(surfaceBandColors(-1, 1, 12)).toHaveLength(12);
    });

    test('Should return a distinct color per band', () => {
        expect(new Set(surfaceBandColors(-1, 1, 12)).size).toBe(12);
    });

    test('Should return colors for a flat field', () => {
        expect(surfaceBandColors(0, 0, 4)).toHaveLength(4);
    });

    test('Should default to the shared band count', () => {
        expect(surfaceBandColors(-1, 1)).toHaveLength(SURFACE_BAND_COUNT);
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

describe('SurfaceBand geometry', () => {

    test('Should emit one quad per grid cell when the surface is a single band', () => {
        const field = createField(9, (x, y) => Math.sin(x) * Math.cos(y));
        const [band] = buildSurfaceBands(field, {
            bandCount: 1,
        });

        expect(computeFaces(band)).toHaveLength(8 * 8);
    });

    test('Should preserve the total quad count across the banded split', () => {
        const field = createField(17, (x, y) => Math.sin(x) * Math.cos(y));

        expect(totalFaces(field)).toHaveLength(16 * 16);
    });

    test('Should preserve the total quad count for a monotonic field', () => {
        const field = createField(13, (x, y) => x + y);

        expect(totalFaces(field)).toHaveLength(12 * 12);
    });

    test('Should populate more than one band for a varying field', () => {
        const field = createField(17, (x, y) => x + y);
        const populated = buildSurfaceBands(field).filter(band => computeFaces(band).length > 0);

        expect(populated.length).toBeGreaterThan(5);
    });

    test('Should place each quad in exactly one band', () => {
        const field = createField(17, (x, y) => x + y);
        const faces = totalFaces(field);
        const corners = new Set(faces.map(face => `${face.vertices[0][0]}:${face.vertices[0][2]}`));

        expect(corners.size).toBe(faces.length);
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

describe('SurfaceBand element', () => {

    test('Should default to the shared band count', () => {
        const field = createField(5, (x, y) => x + y);
        const band = createSurfaceBand({
            field,
            bounds: createSurfaceBounds(field),
        });

        expect(band.bandCount).toBe(SURFACE_BAND_COUNT);
    });

    test('Should report the grid resolution as its segment count', () => {
        const field = createField(7, (x, y) => x + y);
        const band = createSurfaceBand({
            field,
            bounds: createSurfaceBounds(field),
        });

        expect(band.segments).toBe(7);
    });

    test('Should carry the surface-band element type', () => {
        const field = createField(5, (x, y) => x + y);
        const band = createSurfaceBand({
            field,
            bounds: createSurfaceBounds(field),
        });

        expect(band.type).toBe('surface-band');
    });

    test('Should rebuild its mesh at the new resolution after setField', () => {
        const field = createField(5, (x, y) => x + y);
        const band = createSurfaceBand({
            field,
            bounds: createSurfaceBounds(field),
            bandCount: 1,
        });

        expect(computeFaces(band)).toHaveLength(4 * 4);

        const refined = createField(9, (x, y) => x + y);

        band.setField(refined, createSurfaceBounds(refined));

        expect(computeFaces(band)).toHaveLength(8 * 8);
    });

    test('Should bump its revision on every field swap', () => {
        const field = createField(5, (x, y) => x + y);
        const band = createSurfaceBand({
            field,
            bounds: createSurfaceBounds(field),
        });

        band.setField(field, createSurfaceBounds(field));

        expect(band.revision).toBe(1);
    });

    test('Should identify surface bands', () => {
        const field = createField(5, (x, y) => x + y);
        const band = createSurfaceBand({
            field,
            bounds: createSurfaceBounds(field),
        });

        expect(elementIsSurfaceBand(band)).toBe(true);
    });

    test('Should reject a non-band value', () => {
        expect(elementIsSurfaceBand({})).toBe(false);
    });

});

describe('buildSurfaceBands', () => {

    test('Should create one element per band', () => {
        const field = createField(9, (x, y) => x + y);

        expect(buildSurfaceBands(field)).toHaveLength(SURFACE_BAND_COUNT);
    });

    test('Should give each band its own fill', () => {
        const field = createField(9, (x, y) => x + y);
        const fills = buildSurfaceBands(field).map(band => band.fill);

        expect(new Set(fills).size).toBe(SURFACE_BAND_COUNT);
    });

    test('Should apply the requested edge stroke to every band', () => {
        const field = createField(9, (x, y) => x + y);
        const bands = buildSurfaceBands(field, {
            stroke: '#123456',
            lineWidth: 0.25,
        });

        expect(bands.every(band => band.stroke === '#123456')).toBe(true);
    });

    test('Should share one bounds object across every band', () => {
        const field = createField(9, (x, y) => x + y);
        const bands = buildSurfaceBands(field);

        expect(bands.every(band => band.bounds === bands[0].bounds)).toBe(true);
    });

});

describe('updateSurfaceBands', () => {

    test('Should re-point every band at the new field', () => {
        const field = createField(9, (x, y) => x + y);
        const bands = buildSurfaceBands(field);
        const refined = createField(13, (x, y) => x + y);

        updateSurfaceBands(bands, refined);

        expect(bands.every(band => band.field === refined)).toBe(true);
    });

    test('Should preserve the total quad count after a resolution swap', () => {
        const field = createField(9, (x, y) => x + y);
        const bands = buildSurfaceBands(field);
        const refined = createField(13, (x, y) => x + y);

        updateSurfaceBands(bands, refined);

        expect(bands.flatMap(band => computeFaces(band))).toHaveLength(12 * 12);
    });

    test('Should refit the world box to the new height range', () => {
        const field = createField(9, (x, y) => x + y);
        const bands = buildSurfaceBands(field);

        updateSurfaceBands(bands, createField(9, (x, y) => (x + y) * 10));

        expect(bands[0].bounds.zMax).toBe(40);
    });

    test('Should keep every band filled after a swap', () => {
        const field = createField(9, (x, y) => x + y);
        const bands = buildSurfaceBands(field);

        updateSurfaceBands(bands, createField(9, (x, y) => (x + y) * 10));

        expect(bands.every(band => !!band.fill)).toBe(true);
    });

    test('Should keep the element count constant across a swap', () => {
        const field = createField(9, (x, y) => x + y);
        const bands = buildSurfaceBands(field);

        updateSurfaceBands(bands, createField(13, (x, y) => x + y));

        expect(bands).toHaveLength(SURFACE_BAND_COUNT);
    });

});
