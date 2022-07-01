import {
    shape,
} from './base';

import {
    BaseShape,
} from './base/types';

export interface Arc extends BaseShape {
    x: number;
    y: number;
    radius: number;
    startAngle: number;
    endAngle: number;
}

export const arc = shape<Arc>({
    name: 'arc',
    onRender(context, state) {
        const {
            x,
            y,
            radius,
            startAngle,
            endAngle,
        } = state;

        context.beginPath();
        context.arc(x, y, radius, startAngle, endAngle);
    },
});
