import {
    BaseElementState,
    defineShape,
    Element,
} from '../core';

import {
    Box,
    TAU,
} from '../math';

export type Circle = ReturnType<typeof createCircle>;
export interface CircleState extends BaseElementState {
    cx: number;
    cy: number;
    radius: number;
}

export function elementIsCircle(element: Element): element is Circle {
    return element.type === 'circle';
}

export const createCircle = defineShape<CircleState>('circle', ({
    setBoundingBoxHandler,
}) => {
    setBoundingBoxHandler(({ state }) => new Box(
        state.cy - state.radius,
        state.cx - state.radius,
        state.cy + state.radius,
        state.cx + state.radius
    ));

    return ({ path, state }) => {
        const {
            cx,
            cy,
            radius,
        } = state;

        path.arc(cx, cy, radius, 0, TAU);
    };
});