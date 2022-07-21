import {
    Arc,
    createArc,
} from './arc';

import type {
    ElementOptions,
    ElementProperties,
} from '../core';

import {
    TAU,
} from '../math';

export type Circle = Omit<Arc, 'startAngle' | 'endAngle'>;

export function createCircle(properties: ElementProperties<Circle>, options?: ElementOptions<Circle>) {
    return createArc({
        ...properties,
        startAngle: 0,
        endAngle: TAU,
    }, options);
}