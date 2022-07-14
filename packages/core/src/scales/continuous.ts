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
    const method = getLinearScaleMethod(domain, range, clampOutput);
    const scale = bindScale(domain, range, method);

    scale.inverse = getLinearScaleMethod(range, domain, clampOutput);

    return scale;
}