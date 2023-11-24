import {
    BaseElement,
    createShape,
} from '../core';

import {
    TAU,
} from '../math';

export interface Circle extends BaseElement {
    cx: number;
    cy: number;
    radius: number;
}

export const createCircle = createShape<Circle>('circle', () => ({ path, state }) => {
    const {
        cx,
        cy,
        radius,
    } = state;

    path.arc(cx, cy, radius, 0, TAU);
});