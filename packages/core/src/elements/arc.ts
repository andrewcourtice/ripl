import {
    BaseElement,
    createShape,
} from '../core';

export interface Arc extends BaseElement {
    x: number;
    y: number;
    radius: number;
    startAngle: number;
    endAngle: number;
}

export const createArc = createShape<Arc>('arc', () => ({ path, state }) => {
    const {
        x,
        y,
        radius,
        startAngle,
        endAngle,
    } = state;

    path.arc(x, y, radius, startAngle, endAngle);
});