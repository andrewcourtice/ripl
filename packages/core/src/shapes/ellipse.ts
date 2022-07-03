import {
    shape,
} from './base';

import {
    BaseShape,
} from './base/types';

export interface Ellipse extends BaseShape {
    x: number;
    y: number;
    radiusX: number;
    radiusY: number;
    rotation: number;
    startAngle: number;
    endAngle: number;
}

export const ellipse = shape<Ellipse>({
    name: 'ellipse',
    onRender(context, state) {
        const {
            x,
            y,
            radiusX,
            radiusY,
            rotation,
            startAngle,
            endAngle,
        } = state;

        context.beginPath();
        context.ellipse(
            x,
            y,
            radiusX,
            radiusY,
            rotation,
            startAngle,
            endAngle
        );
    },
});
