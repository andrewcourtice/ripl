import {
    BaseElementState,
    defineShape,
} from '../core';

import {
    Box,
    max,
    min,
} from '../math';

export interface LineState extends BaseElementState {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
}

export const createLine = defineShape<LineState>('line', ({
    setBoundingBoxHandler,
}) => {
    setBoundingBoxHandler(({ state }) => new Box(
        min(state.y1, state.y2),
        min(state.x1, state.x2),
        max(state.y1, state.y2),
        max(state.x1, state.x2)
    ));

    return ({ path, state }) => {
        const {
            x1,
            y1,
            x2,
            y2,
        } = state;

        path.moveTo(x1, y1);
        path.lineTo(x2, y2);
    };
});