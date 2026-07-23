import {
    createNumericIncludesMethod,
    createScale,
    getLinearScaleMethod,
    getLinearTicks,
    niceDomain,
} from './_base';

import type {
    Scale,
} from './types';

/** Options for a radial scale that maps a numeric magnitude onto a ring radius. */
export interface RadialScaleOptions {
    /**
     * Constrains mapped radii to the range bounds so out-of-domain magnitudes never overshoot the
     * ring (or fall inside its inner radius). Defaults to `true` — radial magnitude must not exceed
     * the ring.
     */
    clamp?: boolean;
    /** Expands the mapping domain to tick-aligned boundaries. `true` uses ~10 ticks; a number sets the target tick count. */
    padToTicks?: boolean | number;
}

/**
 * Creates a radial scale that maps a numeric magnitude to a ring radius.
 *
 * The scale is a linear mapping from `domain` to `range` (typically `[innerRadius, outerRadius]` in
 * pixels), sharing the same convert/invert symmetry as {@link scaleContinuous}. Unlike a plain
 * continuous scale it **clamps by default**, so a value beyond the domain lands exactly on the outer
 * ring rather than overshooting it, and a value below the domain lands on the inner radius.
 *
 * A single-element `domain` of `[max]` is treated as `[0, max]`, mapping magnitudes outward from the
 * center.
 *
 * @param domain - The value domain `[min, max]` (or `[max]`, treated as `[0, max]`).
 * @param range - The radius range `[innerRadius, outerRadius]` in pixels.
 * @param options - Optional clamping and tick-padding configuration.
 * @returns A scale mapping magnitudes to radii, with `inverse` reading a radius back to a magnitude.
 *
 * @example
 * ```typescript
 * const radius = scaleRadial([0, 100], [0, 240]);
 * radius(50); // 120
 * radius.inverse(120); // 50
 * radius(200); // 240 (clamped to the outer ring)
 * ```
 */
export function scaleRadial(
    domain: number[],
    range: [number, number],
    options?: RadialScaleOptions
): Scale<number, number> {
    // A single-value domain `[max]` is treated as `[0, max]` so magnitudes map from the center outward.
    const resolvedDomain = domain.length === 1 ? [0, domain[0]] : domain;

    // Radial magnitude must never exceed the ring, so clamping is enabled unless explicitly disabled.
    const clamp = options?.clamp ?? true;

    // Resolve tick-padding to a concrete domain once so `convert` and `invert` share the exact same
    // `[min, max]` — see `continuous.ts` for why the invert must not re-pad the range.
    const padCount = options?.padToTicks;
    const mappingDomain = padCount ? niceDomain(resolvedDomain, +padCount) : resolvedDomain;
    const mappingOptions = { clamp };

    const convert = getLinearScaleMethod(mappingDomain, range, mappingOptions);
    const invert = getLinearScaleMethod(range, mappingDomain, mappingOptions);

    return createScale({
        domain: resolvedDomain,
        range,
        convert,
        invert,
        includes: createNumericIncludesMethod(resolvedDomain),
        ticks: (count: number = 10) => getLinearTicks(resolvedDomain, count),
    });
}
