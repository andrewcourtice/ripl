import {
    arc,
    Arc,
} from './arc';

import type {
    ElementOptions,
    ElementProperties,
} from '../core/element';

import {
    TAU,
} from '../math/constants';

export type Circle = Omit<Arc, 'startAngle' | 'endAngle'>;

export function circle(properties: ElementProperties<Circle>, options?: ElementOptions<Circle>) {
    return arc({
        ...properties,
        startAngle: 0,
        endAngle: TAU,
    }, options);
}