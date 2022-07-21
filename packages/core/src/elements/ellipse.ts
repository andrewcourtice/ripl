import {
    BaseElement,
    createShape,
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

export const createEllipse = createShape<Ellipse>('ellipse', () => ({ path, state }) => {
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
});
