import {
    BaseElement,
    shape,
} from '../core';

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
    onRender({ path, state }) {
        const {
            x,
            y,
            radiusX,
            radiusY,
            rotation,
            startAngle,
            endAngle,
        } = state;

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
