import {
    LIGHT_TYPE_CODE,
} from './uniforms';

import {
    resolveColor,
} from './color';

import {
    vec3Dot,
    vec3Normalize,
    vec3TriangleNormal,
} from '../math/vector';

import type {
    ColorUnitRGB,
} from './color';

import type {
    Vector3,
} from '../math/vector';

import {
    parseColor,
    serializeRGBA,
} from '@ripl/core';

import type {
    ColorRGBA,
} from '@ripl/core';

import {
    numberClamp,
    typeIsString,
} from '@ripl/utilities';

/**
 * Computes the surface normal of a face from its first three vertices via the cross product.
 *
 * Delegates to {@link vec3TriangleNormal} so the CPU painter and the GPU mesh path agree on
 * degenerate faces — the two used to disagree, one shading a collapsed face black and the other
 * treating it as facing up.
 *
 * @param vertices - The face's vertices; only the first three are read.
 * @returns The face's unit normal.
 */
export function computeFaceNormal(vertices: Vector3[]): Vector3 {
    return vec3TriangleNormal(vertices[0], vertices[1], vertices[2]);
}

/** Computes a 0–1 brightness value for a face given its normal and a light direction. */
export function computeFaceBrightness(normal: Vector3, lightDirection: Vector3, normalized?: boolean): number {
    const light = normalized ? lightDirection : vec3Normalize(lightDirection);
    const dot = -vec3Dot(normal, light);

    return numberClamp(dot, 0, 1);
}

/** Shades a color by a brightness factor (0–1), darkening or lightening the RGB channels. */
export function shadeFaceColor(baseColor: string, brightness: number): string;
/** Shades a color by a brightness factor (0–1), darkening or lightening the RGB channels. */
export function shadeFaceColor(baseColor: ColorRGBA, brightness: number): string;
export function shadeFaceColor(baseColor: string | ColorRGBA, brightness: number): string {
    const rgba = typeIsString(baseColor) ? parseColor(baseColor) : baseColor;

    if (!rgba) {
        return baseColor as string;
    }

    return serializeRGBA(
        Math.round(rgba[0] * brightness),
        Math.round(rgba[1] * brightness),
        Math.round(rgba[2] * brightness),
        rgba[3]
    );
}

/** A light reduced to the flat numeric form both the CPU painter and the WGSL shader consume. */
export interface ResolvedLight {
    /** The light's numeric type, one of {@link LIGHT_TYPE_CODE}. */
    type: number;
    /** The light's colour premultiplied by its intensity, in unit RGB. */
    color: ColorUnitRGB;
    /** The downward colour of a hemisphere light, premultiplied by intensity. Zero for other types. */
    ground: ColorUnitRGB;
    /** The light's world-space position. Unused by ambient, hemisphere and directional lights. */
    position: Vector3;
    /** The unit-length world-space direction the light travels in. Unused by ambient, hemisphere and point lights. */
    direction: Vector3;
    /** The distance at which the light falls to zero, or `0` when it never does. */
    distance: number;
    /** The exponent of the inverse-distance falloff. */
    decay: number;
    /** Cosine of the spot cone's outer half-angle. */
    cosOuter: number;
    /** Cosine of the spot cone's inner half-angle, where the penumbra begins. */
    cosInner: number;
}

/** A surface reduced to the numeric material terms the shading maths consumes. */
export interface ResolvedSurface {
    /** The specular highlight colour, in unit RGB. */
    specular: ColorUnitRGB;
    /** The Blinn-Phong specular exponent. `0` disables the specular term entirely. */
    shininess: number;
    /** Light the surface emits regardless of illumination, in unit RGB. */
    emissive: ColorUnitRGB;
}

/**
 * The light arriving at a surface, split so the diffuse term stays a plain multiplier.
 *
 * Keeping it a multiplier is what lets {@link composeSurfaceColor} reduce to the original
 * `round(channel * brightness)` expression when nothing adds to it, so a scene using neither
 * specular nor emissive renders byte-identically to the single-light model this replaced.
 */
export interface SurfaceIllumination {
    /** Per-channel multiplier applied to the surface's own colour. */
    diffuse: ColorUnitRGB;
    /** Per-channel light added on top, carrying the specular and emissive terms. */
    additive: ColorUnitRGB;
}

/** A surface with no specular response and no emission — the default for an element with only a `fill`. */
export const PLAIN_SURFACE: ResolvedSurface = {
    specular: [0, 0, 0],
    shininess: 0,
    emissive: [0, 0, 0],
};

/** Creates a zeroed {@link SurfaceIllumination} for {@link shadeSurface} to write into. */
export function createSurfaceIllumination(): SurfaceIllumination {
    return {
        diffuse: [0, 0, 0],
        additive: [0, 0, 0],
    };
}

/**
 * Resolves the light arriving at a surface point, writing into `out` rather than allocating.
 *
 * This is the single source of truth for the lighting model: the CPU painter calls it per face and
 * the WGSL fragment shader mirrors it term for term, so the two backends agree by construction
 * rather than by review. Falloff and cone attenuation match three.js's conventions so a rig tuned
 * against those conventions reads the same here.
 *
 * @param normal - The unit-length world-space surface normal.
 * @param position - The world-space point being shaded.
 * @param viewDirection - The unit-length direction from the surface towards the camera.
 * @param surface - The surface's specular and emissive terms.
 * @param lights - The lights illuminating the scene.
 * @param out - The illumination to write into, reused across calls.
 * @returns `out`, for convenience.
 */
export function shadeSurface(
    normal: Vector3,
    position: Vector3,
    viewDirection: Vector3,
    surface: ResolvedSurface,
    lights: ResolvedLight[],
    out: SurfaceIllumination
): SurfaceIllumination {
    let diffuseR = 0;
    let diffuseG = 0;
    let diffuseB = 0;
    let addR = surface.emissive[0];
    let addG = surface.emissive[1];
    let addB = surface.emissive[2];

    for (const light of lights) {
        const color = light.color;

        if (light.type === LIGHT_TYPE_CODE.ambient) {
            diffuseR += color[0];
            diffuseG += color[1];
            diffuseB += color[2];

            continue;
        }

        if (light.type === LIGHT_TYPE_CODE.hemisphere) {
            const weight = normal[1] * 0.5 + 0.5;
            const ground = light.ground;

            diffuseR += ground[0] + (color[0] - ground[0]) * weight;
            diffuseG += ground[1] + (color[1] - ground[1]) * weight;
            diffuseB += ground[2] + (color[2] - ground[2]) * weight;

            continue;
        }

        let toLightX: number;
        let toLightY: number;
        let toLightZ: number;
        let attenuation = 1;

        if (light.type === LIGHT_TYPE_CODE.directional) {
            toLightX = -light.direction[0];
            toLightY = -light.direction[1];
            toLightZ = -light.direction[2];
        } else {
            toLightX = light.position[0] - position[0];
            toLightY = light.position[1] - position[1];
            toLightZ = light.position[2] - position[2];

            const distance = Math.sqrt(toLightX * toLightX + toLightY * toLightY + toLightZ * toLightZ);

            if (distance === 0) {
                continue;
            }

            toLightX /= distance;
            toLightY /= distance;
            toLightZ /= distance;

            attenuation = computeDistanceAttenuation(distance, light.distance, light.decay);

            if (light.type === LIGHT_TYPE_CODE.spot) {
                attenuation *= computeSpotAttenuation(
                    -(light.direction[0] * toLightX + light.direction[1] * toLightY + light.direction[2] * toLightZ),
                    light.cosOuter,
                    light.cosInner
                );
            }

            if (attenuation === 0) {
                continue;
            }
        }

        const incidence = normal[0] * toLightX + normal[1] * toLightY + normal[2] * toLightZ;

        if (incidence <= 0) {
            continue;
        }

        const scale = incidence * attenuation;

        diffuseR += color[0] * scale;
        diffuseG += color[1] * scale;
        diffuseB += color[2] * scale;

        if (surface.shininess <= 0) {
            continue;
        }

        const halfX = toLightX + viewDirection[0];
        const halfY = toLightY + viewDirection[1];
        const halfZ = toLightZ + viewDirection[2];
        const halfLength = Math.sqrt(halfX * halfX + halfY * halfY + halfZ * halfZ);

        if (halfLength === 0) {
            continue;
        }

        const specularAngle = (normal[0] * halfX + normal[1] * halfY + normal[2] * halfZ) / halfLength;

        if (specularAngle <= 0) {
            continue;
        }

        const specular = specularAngle ** surface.shininess * attenuation;

        addR += surface.specular[0] * color[0] * specular;
        addG += surface.specular[1] * color[1] * specular;
        addB += surface.specular[2] * color[2] * specular;
    }

    out.diffuse[0] = diffuseR;
    out.diffuse[1] = diffuseG;
    out.diffuse[2] = diffuseB;
    out.additive[0] = addR;
    out.additive[1] = addG;
    out.additive[2] = addB;

    return out;
}

/**
 * Composes a shaded CSS colour from a surface's base colour and the light reaching it.
 *
 * With no additive term this is exactly `round(channel * brightness)` — the expression the
 * single-light model used — so an unlit-by-anything-new scene keeps its original pixels.
 *
 * @param baseColor - The surface's own colour, in `0`–`255` channels.
 * @param illumination - The light arriving at the surface.
 * @returns The shaded colour as a CSS `rgba()` string.
 */
export function composeSurfaceColor(baseColor: ColorRGBA, illumination: SurfaceIllumination): string {
    const {
        diffuse,
        additive,
    } = illumination;

    return serializeRGBA(
        clampChannel(baseColor[0] * diffuse[0] + additive[0] * 255),
        clampChannel(baseColor[1] * diffuse[1] + additive[1] * 255),
        clampChannel(baseColor[2] * diffuse[2] + additive[2] * 255),
        baseColor[3]
    );
}

/**
 * Resolves a light's colour and intensity into the premultiplied unit RGB the shading maths uses.
 *
 * @param color - Any colour string `@ripl/core` can parse.
 * @param intensity - The multiplier to premultiply the colour by.
 * @returns The premultiplied colour.
 */
export function resolveLightColor(color: string, intensity: number): ColorUnitRGB {
    const parsed = resolveColor(color);

    if (!parsed) {
        return [intensity, intensity, intensity];
    }

    return [
        (parsed[0] / 255) * intensity,
        (parsed[1] / 255) * intensity,
        (parsed[2] / 255) * intensity,
    ];
}

/**
 * Computes distance falloff for a positional light.
 *
 * Matches three.js: a `distance` of `0` means the light never falls to zero and only the decay
 * applies, otherwise the inverse-power falloff is windowed so it reaches exactly zero at the range.
 *
 * @param distance - Distance from the light to the surface.
 * @param range - The distance at which the light falls to zero, or `0` for unbounded.
 * @param decay - The exponent of the inverse-distance falloff.
 * @returns The attenuation factor.
 */
export function computeDistanceAttenuation(distance: number, range: number, decay: number): number {
    const falloff = 1 / Math.max(distance ** decay, 1e-4);

    if (range <= 0) {
        return falloff;
    }

    const ratio = numberClamp(1 - (distance / range) ** 4, 0, 1);

    return falloff * ratio * ratio;
}

/**
 * Computes the cone falloff for a spot light.
 *
 * @param cosAngle - Cosine of the angle between the cone axis and the surface.
 * @param cosOuter - Cosine of the cone's outer half-angle.
 * @param cosInner - Cosine of the cone's inner half-angle.
 * @returns `0` outside the cone, `1` inside the inner cone, smoothly interpolated between.
 */
export function computeSpotAttenuation(cosAngle: number, cosOuter: number, cosInner: number): number {
    if (cosAngle <= cosOuter) {
        return 0;
    }

    if (cosAngle >= cosInner) {
        return 1;
    }

    const ratio = (cosAngle - cosOuter) / (cosInner - cosOuter);

    return ratio * ratio * (3 - 2 * ratio);
}

function clampChannel(value: number): number {
    return Math.round(numberClamp(value, 0, 255));
}
