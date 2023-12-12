import {
    BaseElementState,
    defineShape,
    Element,
} from '../core';

import {
    Box,
} from '../math';

export type Ellipse = ReturnType<typeof createEllipse>;
export interface EllipseState extends BaseElementState {
    x: number;
    y: number;
    radiusX: number;
    radiusY: number;
    rotation: number;
    startAngle: number;
    endAngle: number;
}

export function elementIsEllipse(element: Element): element is Ellipse {
    return element.type === 'ellipse';
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