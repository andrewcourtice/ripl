import {
    bindScale,
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
    return bindScale({
        domain,
        range,
        convert: getLinearScaleMethod(domain, range, clampOutput),
        invert: getLinearScaleMethod(range, domain, clampOutput),
    });
}