import {
    BaseElement,
    createShape,
} from '../core';

import {
    Point,
} from '../math';

import {
    interpolatePoints,
} from '../interpolators';

import {
    arrayForEach,
} from '@ripl/utilities';

export interface PolyLine extends BaseElement {
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

export const createPolyline = createShape<PolyLine>('polyline', () => ({ path, state }) => {
    const {
        points,
    } = state;

    drawPoints(points, path);
}, {
    interpolators: {
        points: interpolatePoints,
    },
});
