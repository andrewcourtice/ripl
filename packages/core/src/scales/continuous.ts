import {
    createScale,
    getLinearScaleMethod,
} from './_base';

import type {
    Scale,
} from './types';

export function scaleContinuous(
    domain: number[],
    range: number[],
    clampOutput?: boolean
): Scale<number> {
    return createScale({
        domain,
        range,
        convert: getLinearScaleMethod(domain, range, clampOutput),
        invert: getLinearScaleMethod(range, domain, clampOutput),
    });
}