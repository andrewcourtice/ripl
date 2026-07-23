import type {
    LinearScaleOptions,
} from './_base';

import {
    createNumericIncludesMethod,
    createScale,
    getLinearTicks,
    niceDomain,
} from './_base';

import {
    numberClamp,
} from '@ripl/utilities';

import {
    interpolateNumber,
} from '../interpolators';

import type {
    Scale,
    ScaleMethod,
} from './types';

/** Options for a symmetric-log scale, adding a configurable linear threshold to the base linear scale options. */
export interface SymlogScaleOptions extends LinearScaleOptions {
    /**
     * The linear threshold `C`; the region `|x| < C` around zero is treated approximately linearly,
     * with logarithmic compression taking over beyond it. A larger constant widens the near-zero
     * linear region. Defaults to 1.
     */
    constant?: number;
}

/** Applies the symlog transform `sign(x) * log1p(|x| / C)`, keeping the sign and handling zero. */
function symlogTransform(value: number, constant: number): number {
    return Math.sign(value) * Math.log1p(Math.abs(value) / constant);
}

/** Applies the inverse symlog transform `sign(y) * C * expm1(|y|)`. */
function symlogTransformInverse(value: number, constant: number): number {
    return Math.sign(value) * constant * Math.expm1(Math.abs(value));
}

function getSymlogScaleMethod(domain: number[], range: number[], constant: number, options?: LinearScaleOptions): ScaleMethod {
    const {
        clamp,
    } = options || {};

    const [
        domainMin,
        domainMax,
    ] = domain;

    const [
        rangeMin,
        rangeMax,
    ] = range;

    const transformedMin = symlogTransform(domainMin, constant);
    const transformedMax = symlogTransform(domainMax, constant);
    const transformedDelta = transformedMax - transformedMin;
    const interpolator = interpolateNumber(rangeMin, rangeMax);

    return (value: number) => {
        const position = (symlogTransform(value, constant) - transformedMin) / transformedDelta;
        const result = interpolator(position);

        return clamp
            ? numberClamp(result, rangeMin, rangeMax)
            : result;
    };
}

function getSymlogInverseMethod(domain: number[], range: number[], constant: number, options?: LinearScaleOptions): ScaleMethod {
    const {
        clamp,
    } = options || {};

    const [
        domainMin,
        domainMax,
    ] = domain;

    const [
        rangeMin,
        rangeMax,
    ] = range;

    const transformedMin = symlogTransform(domainMin, constant);
    const transformedMax = symlogTransform(domainMax, constant);
    const rangeDelta = rangeMax - rangeMin;
    const interpolator = interpolateNumber(transformedMin, transformedMax);

    return (value: number) => {
        const position = (value - rangeMin) / rangeDelta;
        const transformed = interpolator(position);
        const result = symlogTransformInverse(transformed, constant);

        return clamp
            ? numberClamp(result, domainMin, domainMax)
            : result;
    };
}

/**
 * Creates a symmetric-log (symlog) scale that maps a numeric domain to a range through a
 * sign-preserving logarithmic transform.
 *
 * Unlike a plain logarithmic scale, symlog handles negative values and zero: values within the
 * linear threshold `constant` of zero map approximately linearly, while larger magnitudes compress
 * logarithmically. The transformed domain `[t(min), t(max)]` is mapped linearly onto `range`, so a
 * domain symmetric about zero places zero at the range midpoint.
 *
 * @param domain - The value domain `[min, max]` (may span negative through positive values).
 * @param range - The output range `[start, end]`.
 * @param options - Optional linear threshold, clamping, and tick-padding configuration.
 * @returns A scale mapping domain values to the range, with `inverse` recovering the domain value.
 *
 * @example
 * ```typescript
 * const scale = scaleSymlog([-100, 100], [0, 200]);
 * scale(0); // 100 (zero sits at the range midpoint)
 * scale.inverse(100); // 0
 * ```
 */
export function scaleSymlog(
    domain: number[],
    range: number[],
    options?: SymlogScaleOptions
): Scale<number> {
    const {
        constant = 1,
        clamp,
        padToTicks,
    } = options || {};

    // Resolve tick-padding to a concrete domain once so `convert` and `invert` share the same
    // `[min, max]` before the symlog transform is applied.
    const mappingDomain = padToTicks ? niceDomain(domain, +padToTicks) : domain;
    const mappingOptions = { clamp };

    const convert = getSymlogScaleMethod(mappingDomain, range, constant, mappingOptions);
    const invert = getSymlogInverseMethod(mappingDomain, range, constant, mappingOptions);

    return createScale({
        domain,
        range,
        convert,
        invert,
        includes: createNumericIncludesMethod(domain),
        ticks: (count: number = 10) => getLinearTicks(domain, count),
    });
}
