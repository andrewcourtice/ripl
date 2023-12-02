import {
    BaseElementState,
    defineShape,
} from '../core';

import {
    Box,
    TAU,
} from '../math';

export interface CircleState extends BaseElementState {
    cx: number;
    cy: number;
    radius: number;
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