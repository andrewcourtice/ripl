import {
    arc,
    Arc,
} from './arc';

import type {
    ElementProperties,
} from '../core/element';

import {
    TAU,
} from '../math/constants';

export type Circle = Omit<Arc, 'startAngle' | 'endAngle'>;

export function circle(options: ElementProperties<Circle>) {
    return arc({
        ...options,
        startAngle: 0,
        endAngle: TAU,
    });
}