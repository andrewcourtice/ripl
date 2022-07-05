import {
    TAU,
} from '../math/constants';

import {
    arc,
    Arc,
} from './arc';

import type {
    ElementProperties,
} from './base/types';

export type Circle = Omit<Arc, 'startAngle' | 'endAngle'>;

export function circle(options: ElementProperties<Circle>) {
    return arc({
        ...options,
        startAngle: 0,
        endAngle: TAU,
    });
}