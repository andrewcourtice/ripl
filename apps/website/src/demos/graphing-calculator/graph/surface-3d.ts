import {
    Shape3D,
} from '@ripl/3d';

import type {
    Face3D,
    Material,
    Shape3DOptions,
    Shape3DState,
    Vector3,
} from '@ripl/3d';

import {
    COLOR_SCHEME_VIRIDIS,
    scaleSequential,
} from '@ripl/core';

import type {
    SurfaceDomain,
    SurfaceField,
} from '../types';

/** The material every surface is drawn with, colouring each vertex from the height colormap. */
const SURFACE_MATERIAL: Material = {
    vertexColors: true,
};

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

/** Options for building the mesh of a height field. */
export interface SurfaceMeshOptions extends SurfaceBoundsOptions {
    /** The stroke drawn along each quad's edges. Omit for an unstroked surface. */
    stroke?: string;
    /** The width of the quad edge stroke, in pixels. */
    lineWidth?: number;
}

/** State for a surface mesh. */
export interface SurfaceState extends Shape3DState {
    /** The number of vertices along each side of the grid the mesh is built from. */
    segments: number;
    /** A counter bumped whenever the shared height field is replaced, invalidating the cached mesh. */
    revision: number;
}

/** Options for constructing a {@link Surface}. */
export interface SurfaceOptions extends Shape3DOptions<SurfaceState> {
    /** The height field the surface reads its vertices from; held outside the element and never copied. */
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
 * @returns The bounds every mapping helper and the mesh share.
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
 * Builds the viridis colormap for a height range.
 *
 * Returns a function rather than a fixed set of samples because every vertex is coloured
 * individually — the colormap is continuous across the surface rather than quantised into bands.
 *
 * @param zMin - The lowest height in the field.
 * @param zMax - The highest height in the field.
 * @returns A function mapping a height in data units to a CSS colour.
 */
export function surfaceColorScale(zMin: number, zMax: number): (height: number) => string {
    const range = zMax - zMin;
    const usable = Number.isFinite(range) && range > 0;
    const scale = scaleSequential(COLOR_SCHEME_VIRIDIS, usable ? [zMin, zMax] : [0, 1]);
    const midpoint = scale(usable ? (zMin + zMax) / 2 : 0.5);

    return height => Number.isFinite(height) ? scale(usable ? height : 0.5) : midpoint;
}

/**
 * A `z = f(x, y)` surface, drawn as one quad per grid cell with each vertex coloured by its height.
 *
 * The height field lives outside the element and is only read here, because `computeFaces` fires on
 * every cache invalidation: every `setStateValue` and every `interpolate` tick. Evaluating the
 * expression from inside it would put mathjs on that path.
 */
export class Surface extends Shape3D<SurfaceState> {

    private _field: SurfaceField;
    private _bounds: SurfaceBounds;

    /** The number of vertices along each side of the grid the mesh is built from. */
    public get segments() {
        return this.getStateValue('segments');
    }

    /** A counter bumped whenever the shared height field is replaced. */
    public get revision() {
        return this.getStateValue('revision');
    }

    /** The height field this surface reads its vertices from. */
    public get field() {
        return this._field;
    }

    /** The world box the height field is mapped into. */
    public get bounds() {
        return this._bounds;
    }

    constructor(options: SurfaceOptions) {
        const {
            field,
            bounds,
            ...state
        } = options;

        // Built per instance rather than shared: the segment count follows the field's resolution.
        super('surface', state, {
            segments: field.resolution,
            revision: 0,
            material: SURFACE_MATERIAL,
        });

        this._field = field;
        this._bounds = bounds;
    }

    /**
     * Points the surface at a freshly evaluated height field, invalidating the cached mesh.
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

        const axis = new Float64Array(resolution);
        const color = surfaceColorScale(bounds.zMin, bounds.zMax);

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

                // A NaN corner has no height to place or colour, which drops the whole cell rather
                // than emitting a hole edge.
                if (!Number.isFinite(h00 + h10 + h01 + h11)) {
                    continue;
                }

                faces.push({
                    vertices: [
                        [axis[i], surfaceWorldHeight(bounds, h00), axis[j]],
                        [axis[i], surfaceWorldHeight(bounds, h01), axis[j + 1]],
                        [axis[i + 1], surfaceWorldHeight(bounds, h11), axis[j + 1]],
                        [axis[i + 1], surfaceWorldHeight(bounds, h10), axis[j]],
                    ],
                    colors: [
                        color(h00),
                        color(h01),
                        color(h11),
                        color(h10),
                    ],
                });
            }
        }

        return faces;
    }

}

/** Creates a {@link Surface} element. */
export function createSurface(...options: ConstructorParameters<typeof Surface>) {
    return new Surface(...options);
}

/** Type guard for {@link Surface} elements. */
export function elementIsSurface(value: unknown): value is Surface {
    return value instanceof Surface;
}

/**
 * Builds the {@link Surface} element for a height field.
 *
 * @param field - The evaluated height field.
 * @param options - Box extents and edge stroke.
 * @returns The surface element.
 */
export function buildSurface(field: SurfaceField, options?: SurfaceMeshOptions): Surface {
    return createSurface({
        field,
        bounds: createSurfaceBounds(field, options),
        stroke: options?.stroke,
        lineWidth: options?.lineWidth,
    });
}

/**
 * Re-points an existing surface at a freshly evaluated height field, re-fitting the box.
 *
 * Reusing the element keeps the scene graph stable across a resolution swap; replacing it would
 * fire a full instruction rebuild instead.
 *
 * @param surface - The element returned by {@link buildSurface}.
 * @param field - The new height field.
 * @param options - The same options the surface was built with.
 */
export function updateSurface(surface: Surface, field: SurfaceField, options?: SurfaceMeshOptions): void {
    surface.setField(field, createSurfaceBounds(field, options));
}
