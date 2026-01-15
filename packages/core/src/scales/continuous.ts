import {
    getLinearTicks,
    createNumericIncludesMethod,
    createScale,
    getLinearScaleMethod,
    LinearScaleOptions,
} from './_base';

import type {
    Scale,
} from './types';

export function scaleContinuous(
    domain: number[],
    range: number[],
    options?: LinearScaleOptions
): Scale<number> {
    const convert = getLinearScaleMethod(domain, range, options);
    const invert = getLinearScaleMethod(range, domain, options);

    return createScale({
        domain,
        range,
        convert,
        invert,
        includes: createNumericIncludesMethod(domain),
        ticks: (count: number = 10) => getLinearTicks(domain, count),
    });
}