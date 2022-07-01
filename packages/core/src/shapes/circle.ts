import {
    arc,
    Arc,
} from './arc';

import {
    ShapeOptions,
} from './_base';

import {
    TAU,
} from '../math/constants';

export type Circle = Omit<Arc, 'startAngle' | 'endAngle'>;

export function circle(options: ShapeOptions<Circle>) {
    return arc({
        ...options,
        startAngle: 0,
        endAngle: TAU,
    });
}