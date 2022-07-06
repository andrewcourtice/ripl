import {
    shape,
} from '../core/shape';

import {
    BaseElement,
} from '../core/element';

export interface Ellipse extends BaseElement {
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
    onRender(context, path, { state }) {
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
        path.ellipse(
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
