import {
    shape,
} from './base';

import {
    BaseElement,
} from './base/types';

export interface Arc extends BaseElement {
    x: number;
    y: number;
    radius: number;
    startAngle: number;
    endAngle: number;
}

export const arc = shape<Arc>({
    name: 'arc',
    onRender(context, path, { state }) {
        const {
            x,
            y,
            radius,
            startAngle,
            endAngle,
        } = state;

        path.arc(x, y, radius, startAngle, endAngle);
    },
});
