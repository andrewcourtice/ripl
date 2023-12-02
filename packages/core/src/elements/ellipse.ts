import {
    BaseElementState,
    defineShape,
} from '../core';

import {
    Box,
} from '../math';

export interface EllipseState extends BaseElementState {
    x: number;
    y: number;
    radiusX: number;
    radiusY: number;
    rotation: number;
    startAngle: number;
    endAngle: number;
}

export const createEllipse = defineShape<EllipseState>('ellipse', ({
    setBoundingBoxHandler,
}) => {
    setBoundingBoxHandler(({ state }) => new Box(
        state.y - state.radiusY,
        state.x - state.radiusX,
        state.y + state.radiusY,
        state.x + state.radiusX
    ));

    return ({ path, state }) => {
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
    };
});
