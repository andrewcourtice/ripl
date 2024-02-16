import {
    createScale,
    getLinearScaleMethod,
    LinearScaleOptions,
    padDomain,
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
        includes(value) {
            return value >= domain[0] && value <= domain[1];
        },
        ticks(count: number = 10) {
            const [
                min,
                max,
                step,
            ] = padDomain(domain, count);

            const ticks = [];

            for (let value = min; value <= max; value += step) {
                ticks.push(value);
            }

            return ticks;
        },
    });
}