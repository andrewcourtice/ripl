import type {
    LinearScaleOptions,
} from './_base';

import {
    createNumericIncludesMethod,
    createScale,
    getLinearScaleMethod,
    getLinearTicks,
    niceDomain,
    resolveNiceCount,
} from './_base';

import type {
    Scale,
} from './types';

/** Creates a continuous linear scale that maps a numeric domain to a numeric range. */
export function scaleContinuous(
    domain: number[],
    range: number[],
    options?: LinearScaleOptions
): Scale<number> {
    // `nice` is resolved once here so the domain, mapping, inversion, and ticks are all consistent.
    const niceCount = resolveNiceCount(options?.nice);
    const resolvedDomain = niceCount ? niceDomain(domain, niceCount) : domain;

    const convert = getLinearScaleMethod(resolvedDomain, range, options);
    const invert = getLinearScaleMethod(range, resolvedDomain, options);

    return createScale({
        domain: resolvedDomain,
        range,
        convert,
        invert,
        includes: createNumericIncludesMethod(resolvedDomain),
        ticks: (count: number = 10) => getLinearTicks(resolvedDomain, count),
    });
}