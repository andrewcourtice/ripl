import {
    Shape3D,
} from '@ripl/3d';

import type {
    Face3D,
    Shape3DOptions,
    Shape3DState,
    Vector3,
} from '@ripl/3d';

import {
    COLOR_SCHEME_VIRIDIS,
    scaleSequential,
} from '@ripl/core';

import {
    numberClamp,
} from '@ripl/utilities';

import type {
    SurfaceDomain,
    SurfaceField,
} from '../types';

/**
 * The number of height bands a surface colormap is split across.
 *
 * The base class carries a single fill per element, so a colormap has to come from several
 * elements. Within one band only lambert shading varies, and a quad straddling a boundary belongs
 * wholly to one band, so the transition is a staircase along quad edges: at this count that reads
 * as a contour map rather than as an artifact.
 */
export const SURFACE_BAND_COUNT = 14;

/** The default half-extent of the surface's world box along the X and Z axes, in world units. */
export const SURFACE_EXTENT = 1;

/** The default half-extent of the surface's world box along the Y (height) axis, in world units. */
export const SURFACE_HEIGHT_EXTENT = 0.55;

/** Options for fitting a height field into its world box. */
export interface SurfaceBoundsOptions {
    /** The half-extent of the world box along the X and Z axes. Defaults to {@link SURFACE_EXTENT}. */
    extent?: number;
    /** The half-extent of the world box along the Y (height) axis. Defaults to {@link SURFACE_HEIGHT_EXTENT}. */
    heightExtent?: number;
}

/**
 * The world-space box a height field is drawn inside, together with the data ranges it maps from.
 *
 * Each axis is fitted independently, so a shallow surface still fills the box vertically. That
 * matches how surface plots are conventionally framed and keeps every preset legible without a
 * per-expression height scale.
 */
export interface SurfaceBounds {
    /** The region of the xy plane the field was evaluated over, in data units. */
    domain: SurfaceDomain;
    /** The height mapped to the bottom of the world box, in data units. */
    zMin: number;
    /** The height mapped to the top of the world box, in data units. */
    zMax: number;
    /** The half-extent of the world box along the X and Z axes, in world units. */
    extent: number;
    /** The half-extent of the world box along the Y (height) axis, in world units. */
    heightExtent: number;
}

/** Options for building the banded mesh of a height field. */
export interface SurfaceMeshOptions extends SurfaceBoundsOptions {
    /** The number of height bands to split the surface across. Defaults to {@link SURFACE_BAND_COUNT}. */
    bandCount?: number;
    /** The stroke drawn along each quad's edges. Omit for an unstroked surface. */
    stroke?: string;
    /** The width of the quad edge stroke, in pixels. */
    lineWidth?: number;
}

/** State for a single height band of a surface mesh. */
export interface SurfaceBandState extends Shape3DState {
    /** The index of the band this element draws, from `0` to `bandCount - 1`. */
    band: number;
    /** The number of bands the surface is split across. */
    bandCount: number;
    /** The number of vertices along each side of the grid the mesh is built from. */
    segments: number;
    /** A counter bumped whenever the shared height field is replaced, invalidating the cached mesh. */
    revision: number;
}

/** Options for constructing a {@link SurfaceBand}. */
export interface SurfaceBandOptions extends Shape3DOptions<SurfaceBandState> {
    /** The height field the band reads its vertices from; held outside the element and never copied. */
    field: SurfaceField;
    /** The world box the height field is mapped into. */
    bounds: SurfaceBounds;
}

function normalizeRange(value: number, min: number, max: number): number {
    const range = max - min;

    return range === 0 ? 0.5 : (value - min) / range;
}

function finiteOr(value: number, fallback: number): number {
    return Number.isFinite(value) ? value : fallback;
}

/**
 * Fits a height field into a world box.
 *
 * @param field - The evaluated height field.
 * @param options - Overrides for the box's extents.
 * @returns The bounds every mapping helper and mesh band shares.
 */
export function createSurfaceBounds(field: SurfaceField, options?: SurfaceBoundsOptions): SurfaceBounds {
    const zMin = finiteOr(field.zMin, 0);
    const zMax = finiteOr(field.zMax, 0);

    return {
        domain: field.domain,
        zMin: Math.min(zMin, zMax),
        zMax: Math.max(zMin, zMax),
        extent: options?.extent ?? SURFACE_EXTENT,
        heightExtent: options?.heightExtent ?? SURFACE_HEIGHT_EXTENT,
    };
}

/**
 * Maps a height reading into the world box's Y axis.
 *
 * @param bounds - The box the field is fitted into.
 * @param height - The height in data units.
 * @returns The world-space Y coordinate.
 */
export function surfaceWorldHeight(bounds: SurfaceBounds, height: number): number {
    return (normalizeRange(height, bounds.zMin, bounds.zMax) * 2 - 1) * bounds.heightExtent;
}

/**
 * Maps a point of the height field into the world box.
 *
 * Also serves the axis frame: an x tick at the near edge is the point `(tick, domain.yMax, zMin)`.
 *
 * @param bounds - The box the field is fitted into.
 * @param x - The x coordinate in data units.
 * @param y - The y coordinate in data units.
 * @param height - The height in data units, which becomes the world Y axis.
 * @returns The world-space position.
 */
export function surfaceWorldPoint(bounds: SurfaceBounds, x: number, y: number, height: number): Vector3 {
    const domain = bounds.domain;

    return [
        (normalizeRange(x, domain.xMin, domain.xMax) * 2 - 1) * bounds.extent,
        surfaceWorldHeight(bounds, height),
        (normalizeRange(y, domain.yMin, domain.yMax) * 2 - 1) * bounds.extent,
    ];
}

/**
 * Resolves which band a height belongs to. Deterministic, so every quad lands in exactly one band
 * and the bands together cover `[zMin, zMax]`.
 *
 * @param height - The height in data units.
 * @param zMin - The lowest height in the field.
 * @param zMax - The highest height in the field.
 * @param bandCount - The number of bands the range is split across.
 * @returns The band index, from `0` to `bandCount - 1`.
 */
export function surfaceBandIndex(height: number, zMin: number, zMax: number, bandCount: number = SURFACE_BAND_COUNT): number {
    const bands = Math.max(1, Math.trunc(bandCount));
    const range = zMax - zMin;

    if (range <= 0 || !Number.isFinite(range) || !Number.isFinite(height)) {
        return 0;
    }

    return numberClamp(Math.floor((height - zMin) / range * bands), 0, bands - 1);
}

/**
 * Samples the viridis scheme at the center of each height band.
 *
 * @param zMin - The lowest height in the field.
 * @param zMax - The highest height in the field.
 * @param bandCount - The number of bands the range is split across.
 * @returns One CSS color per band, ordered from the lowest band upwards.
 */
export function surfaceBandColors(zMin: number, zMax: number, bandCount: number = SURFACE_BAND_COUNT): string[] {
    const bands = Math.max(1, Math.trunc(bandCount));
    const range = zMax - zMin;
    const usable = Number.isFinite(range) && range > 0;
    const scale = scaleSequential(COLOR_SCHEME_VIRIDIS, usable ? [zMin, zMax] : [0, 1]);
    const colors: string[] = [];

    for (let i = 0; i < bands; i++) {
        const position = (i + 0.5) / bands;

        colors.push(scale(usable ? zMin + position * range : position));
    }

    return colors;
}

/**
 * One height band of a `z = f(x, y)` surface, drawn as the quads of the grid whose mean corner
 * height falls in this band.
 *
 * The height field lives outside the element and is only read here, because `computeFaces` fires on
 * every cache invalidation: every `setStateValue` and every `interpolate` tick. Evaluating the
 * expression from inside it would put mathjs on that path.
 */
export class SurfaceBand extends Shape3D<SurfaceBandState> {

    private _field: SurfaceField;
    private _bounds: SurfaceBounds;

    /** The index of the band this element draws, from `0` to `bandCount - 1`. */
    public get band() {
        return this.getStateValue('band');
    }

    public set band(value) {
        this.setStateValue('band', value);
    }

    /** The number of bands the surface is split across. */
    public get bandCount() {
        return this.getStateValue('bandCount');
    }

    public set bandCount(value) {
        this.setStateValue('bandCount', value);
    }

    /** The number of vertices along each side of the grid the mesh is built from. */
    public get segments() {
        return this.getStateValue('segments');
    }

    /** A counter bumped whenever the shared height field is replaced. */
    public get revision() {
        return this.getStateValue('revision');
    }

    /** The height field this band reads its vertices from. */
    public get field() {
        return this._field;
    }

    /** The world box the height field is mapped into. */
    public get bounds() {
        return this._bounds;
    }

    constructor(options: SurfaceBandOptions) {
        const {
            field,
            bounds,
            ...state
        } = options;

        super('surface-band', {
            band: 0,
            bandCount: SURFACE_BAND_COUNT,
            segments: field.resolution,
            revision: 0,
            ...state,
        });

        this._field = field;
        this._bounds = bounds;
    }

    /**
     * Points the band at a freshly evaluated height field, invalidating the cached mesh.
     *
     * @param field - The new height field, typically at a different grid resolution.
     * @param bounds - The world box the new field is fitted into.
     */
    public setField(field: SurfaceField, bounds: SurfaceBounds): void {
        this._field = field;
        this._bounds = bounds;

        this.setStateValue('segments', field.resolution);
        this.setStateValue('revision', this.revision + 1);
    }

    protected computeFaces(): Face3D[] {
        const faces: Face3D[] = [];
        const field = this._field;
        const bounds = this._bounds;
        const values = field.values;
        const resolution = field.resolution;

        if (resolution < 2 || values.length < resolution * resolution) {
            return faces;
        }

        const band = this.band;
        const bandCount = this.bandCount;
        const axis = new Float64Array(resolution);

        for (let i = 0; i < resolution; i++) {
            axis[i] = (i / (resolution - 1) * 2 - 1) * bounds.extent;
        }

        for (let j = 0; j < resolution - 1; j++) {
            const rowBase = j * resolution;

            for (let i = 0; i < resolution - 1; i++) {
                const index = rowBase + i;
                const h00 = values[index];
                const h10 = values[index + 1];
                const h01 = values[index + resolution];
                const h11 = values[index + resolution + 1];
                const mean = (h00 + h10 + h01 + h11) / 4;

                // A NaN corner poisons the mean, which drops the whole cell rather than emitting a hole edge.
                if (!Number.isFinite(mean) || surfaceBandIndex(mean, bounds.zMin, bounds.zMax, bandCount) !== band) {
                    continue;
                }

                faces.push({
                    vertices: [
                        [axis[i], surfaceWorldHeight(bounds, h00), axis[j]],
                        [axis[i], surfaceWorldHeight(bounds, h01), axis[j + 1]],
                        [axis[i + 1], surfaceWorldHeight(bounds, h11), axis[j + 1]],
                        [axis[i + 1], surfaceWorldHeight(bounds, h10), axis[j]],
                    ],
                });
            }
        }

        return faces;
    }

}

/** Creates a {@link SurfaceBand} element. */
export function createSurfaceBand(...options: ConstructorParameters<typeof SurfaceBand>) {
    return new SurfaceBand(...options);
}

/** Type guard for {@link SurfaceBand} elements. */
export function elementIsSurfaceBand(value: unknown): value is SurfaceBand {
    return value instanceof SurfaceBand;
}

/**
 * Splits a height field into one {@link SurfaceBand} element per color band.
 *
 * Every band shares the one field and the one set of bounds, so a rebuild is a single evaluation
 * pass no matter how many bands there are.
 *
 * @param field - The evaluated height field.
 * @param options - Band count, box extents and edge stroke.
 * @returns One element per band, ordered from the lowest band upwards.
 */
export function buildSurfaceBands(field: SurfaceField, options?: SurfaceMeshOptions): SurfaceBand[] {
    const bandCount = Math.max(1, Math.trunc(options?.bandCount ?? SURFACE_BAND_COUNT));
    const bounds = createSurfaceBounds(field, options);

    return surfaceBandColors(bounds.zMin, bounds.zMax, bandCount).map((fill, band) => createSurfaceBand({
        field,
        bounds,
        band,
        bandCount,
        fill,
        stroke: options?.stroke,
        lineWidth: options?.lineWidth,
    }));
}

/**
 * Re-points existing bands at a freshly evaluated height field, re-fitting the box and the colormap.
 *
 * Reusing the elements keeps the scene graph stable across a resolution swap; adding and removing
 * them would fire a full instruction rebuild instead.
 *
 * @param bands - The elements returned by {@link buildSurfaceBands}.
 * @param field - The new height field.
 * @param options - The same options the bands were built with.
 */
export function updateSurfaceBands(bands: SurfaceBand[], field: SurfaceField, options?: SurfaceMeshOptions): void {
    const bounds = createSurfaceBounds(field, options);
    const colors = surfaceBandColors(bounds.zMin, bounds.zMax, bands.length);

    bands.forEach((element, band) => {
        element.fill = colors[band];
        element.setField(field, bounds);
    });
}
