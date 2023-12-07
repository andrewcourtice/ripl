import {
    BaseElementState,
    defineShape,
} from '../core';

import {
    Box,
    getExtent,
    Point,
} from '../math';

import {
    arrayForEach,
} from '@ripl/utilities';

export interface PolyLineState extends BaseElementState {
    points: Point[];
}

export const drawPoints = (points: Point[], path: Path2D) => {
    let moveOnly = true;

    arrayForEach(points, ([x, y]) => {
        if (moveOnly) {
            path.moveTo(x, y);
            moveOnly = false;
        } else {
            path.lineTo(x, y);
        }
    });
};

export const createPolyline = defineShape<PolyLineState>('polyline', ({
    setBoundingBoxHandler,
}) => {
    setBoundingBoxHandler(({ state }) => {
        const [left, right] = getExtent(state.points, point => point[0]);
        const [top, bottom] = getExtent(state.points, point => point[1]);

        return new Box(
            left,
            top,
            bottom,
            right
        );
    });

    return ({ path, state }) => {
        const {
            points,
        } = state;

        drawPoints(points, path);
    };
});
