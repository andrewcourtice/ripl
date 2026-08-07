import {
    resolveColorUnitRGB,
} from './color';

import {
    FOG_MODE_CODE,
} from './uniforms';

import type {
    ResolvedFog,
} from './uniforms';

/** How fog thickens with distance from the camera. */
export type FogMode = 'linear' | 'exponential';

/**
 * Atmospheric haze blending distant geometry towards a colour.
 *
 * Both backends resolve it identically, and it costs one extra term per fragment.
 */
export interface Fog {
    /** The colour distant geometry fades towards. Defaults to white. */
    color?: string;
    /** How the fog thickens with distance. Defaults to `'linear'`. */
    mode?: FogMode;
    /** Distance at which linear fog begins. Defaults to `1`. */
    near?: number;
    /** Distance at which linear fog fully obscures. Defaults to `100`. */
    far?: number;
    /** Density of exponential fog. Defaults to `0.02`. */
    density?: number;
}

/**
 * Resolves fog into the numeric form the scene uniform and the CPU painter consume.
 *
 * @param fog - The fog to resolve, or `undefined`/`null` for none.
 * @returns The resolved fog, or `null` when there is none.
 */
export function resolveFog(fog: Fog | undefined | null): ResolvedFog | null {
    if (!fog) {
        return null;
    }

    return {
        mode: fog.mode === 'exponential' ? FOG_MODE_CODE.exponential : FOG_MODE_CODE.linear,
        color: resolveColorUnitRGB(fog.color ?? '#ffffff'),
        near: fog.near ?? 1,
        far: fog.far ?? 100,
        density: fog.density ?? 0.02,
    };
}

/**
 * Computes how far a surface has faded towards the fog colour.
 *
 * Mirrored term for term by the WGSL `applyFog`, so the two backends agree.
 *
 * @param fog - The resolved fog.
 * @param distance - Distance from the camera to the surface, in world units.
 * @returns The blend factor, from `0` (unfogged) to `1` (fully obscured).
 */
export function computeFogFactor(fog: ResolvedFog, distance: number): number {
    if (fog.mode === FOG_MODE_CODE.exponential) {
        const scaled = distance * fog.density;

        return Math.min(1, Math.max(0, 1 - Math.exp(-scaled * scaled)));
    }

    const span = Math.max(fog.far - fog.near, 1e-4);

    return Math.min(1, Math.max(0, (distance - fog.near) / span));
}
