import {
    BaseElement,
    createShape,
} from '../core';

import {
    getPolygonPoints,
} from '../math';

import {
    interpolateNumber,
} from '../interpolators';

import {
    drawPoints,
} from './polyline';

export interface Polygon extends BaseElement {
    cx: number;
    cy: number;
    radius: number;
    sides: number;
}

export const createPolygon = createShape<Polygon>('polygon', () => ({ state, path }) => {
    const {
        sides,
        cx,
        cy,
        radius,
    } = state;

    const points = getPolygonPoints(sides, cx, cy, radius);

    drawPoints(points, path);
    path.closePath();
}, {
    interpolators: {
        sides: (sidesA, sidesB) => {
            const interpolator = interpolateNumber(
                Math.max(sidesA, 3),
                Math.max(sidesB, 3)
            );

            return position => Math.floor(interpolator(position));
        },
    },
});