import {
    DEFAULT_SURFACE_COLOR,
    resolveColor,
    resolveColorUnitRGB,
} from './color';

import {
    MATERIAL_SIDE_CODE,
} from './uniforms';

import type {
    ResolvedSurface,
} from './shading';

import type {
    ColorRGBA,
} from '@ripl/core';

/** Which faces of a surface are drawn, relative to their counter-clockwise winding. */
export type MaterialSide = 'front' | 'back' | 'double';

/**
 * How a surface responds to light.
 *
 * Every property is optional and falls back to the behaviour an element with only a `fill` has, so
 * attaching an empty material changes nothing.
 *
 * A material is read as a plain value, not observed: mutating one in place will not repaint. Assign
 * a new object to {@link Shape3D.material} instead.
 */
export interface Material {
    /** The surface's own colour. Falls back to the element's `fill`, then to a neutral grey. */
    color?: string;
    /** The surface's opacity, from `0` to `1`. Multiplies the colour's own alpha. */
    opacity?: number;
    /** Light the surface emits regardless of illumination. Defaults to black, emitting nothing. */
    emissive?: string;
    /** Multiplier on {@link emissive}. Defaults to `1`. */
    emissiveIntensity?: number;
    /** The colour of specular highlights. Defaults to black, disabling them. */
    specular?: string;
    /** The Blinn-Phong specular exponent; higher is tighter. `0` disables highlights. Defaults to `0`. */
    shininess?: number;
    /** Which faces are drawn. Defaults to `'double'`, matching the unculled default. */
    side?: MaterialSide;
    /** Draws the surface as edges only, with no fill. Defaults to `false`. */
    wireframe?: boolean;
    /** Shades each face by its own normal rather than its per-vertex normals. Defaults to `false`. */
    flatShading?: boolean;
    /** Uses each face's `colors` in place of the surface colour. Defaults to `false`. */
    vertexColors?: boolean;
}

/** A material with every property resolved, as the render path consumes it. */
export interface ResolvedMaterial {
    /**
     * The surface's own colour in `0`–`255` channels, with opacity applied to the alpha, or
     * `undefined` when {@link colorStyle} is not a colour this library can parse.
     */
    color: ColorRGBA | undefined;
    /** The colour string the surface's own colour was resolved from. */
    colorStyle: string;
    /** The specular and emissive terms the shading maths consumes. */
    surface: ResolvedSurface;
    /** Which faces are drawn. */
    side: MaterialSide;
    /** Whether the surface is drawn as edges only. */
    wireframe: boolean;
    /** Whether faces are shaded by their own normal rather than their per-vertex normals. */
    flatShading: boolean;
    /** Whether per-face vertex colours replace the surface colour. */
    vertexColors: boolean;
}

const BLACK = '#000000';

/**
 * Creates a {@link Material}, filling in the defaults.
 *
 * @param options - The material properties to set.
 * @returns The material.
 * @example
 * const material = createMaterial({
 *     color: '#c0c0c0',
 *     specular: '#ffffff',
 *     shininess: 48,
 * });
 */
export function createMaterial(options?: Material): Material {
    return {
        ...options,
    };
}

/**
 * Resolves a material and an element's `fill` into the numeric form the render path consumes.
 *
 * The colour falls back through `material.color`, then `fill`, then a neutral grey, so an element
 * that only ever set `fill` keeps working unchanged. A colour string this library cannot parse is
 * left for the backend to interpret rather than replaced, which is how an unparseable `fill` has
 * always behaved.
 *
 * @param material - The material, or `undefined` for an unmaterialed element.
 * @param fill - The element's `fill`.
 * @returns The resolved material.
 */
export function resolveMaterial(material: Material | undefined, fill: string | undefined): ResolvedMaterial {
    const colorStyle = material?.color ?? fill ?? DEFAULT_SURFACE_COLOR;
    const parsed = resolveColor(colorStyle);
    const opacity = material?.opacity ?? 1;
    const emissiveIntensity = material?.emissiveIntensity ?? 1;
    const emissive = resolveColorUnitRGB(material?.emissive ?? BLACK, [0, 0, 0]);

    return {
        color: parsed && [parsed[0], parsed[1], parsed[2], parsed[3] * opacity],
        colorStyle,
        surface: {
            specular: resolveColorUnitRGB(material?.specular ?? BLACK, [0, 0, 0]),
            shininess: material?.shininess ?? 0,
            emissive: [
                emissive[0] * emissiveIntensity,
                emissive[1] * emissiveIntensity,
                emissive[2] * emissiveIntensity,
            ],
        },
        side: material?.side ?? 'double',
        wireframe: material?.wireframe ?? false,
        flatShading: material?.flatShading ?? false,
        vertexColors: material?.vertexColors ?? false,
    };
}

/** The numeric discriminator for a material side, as the model uniform carries it. */
export function materialSideCode(side: MaterialSide): number {
    return MATERIAL_SIDE_CODE[side];
}

/**
 * Whether a face wound counter-clockwise should be drawn, given its signed screen area.
 *
 * Culling is decided from the projected area rather than from the normal, because that is correct
 * under both perspective and orthographic projection and needs no view vector.
 *
 * @param side - Which faces the material draws.
 * @param signedArea - Twice the signed area of the projected polygon.
 * @returns Whether to draw the face.
 */
export function materialDrawsFace(side: MaterialSide, signedArea: number): boolean {
    if (side === 'double' || signedArea === 0) {
        return true;
    }

    return side === 'front' ? signedArea < 0 : signedArea > 0;
}
