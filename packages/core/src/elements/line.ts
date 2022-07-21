import {
    BaseElement,
    createShape,
} from '../core';

export interface Line extends BaseElement {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export const createLine = createShape<Line>('line', () => ({ path, state }) => {
    const {
        x1,
        y1,
        x2,
        y2,
    } = state;

    path.moveTo(x1, y1);
    path.lineTo(x2, y2);
});