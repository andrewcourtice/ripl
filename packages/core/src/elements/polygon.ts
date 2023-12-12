import {
    BaseElementState,
    defineShape,
    Element,
} from '../core';

import {
    Box,
    getPolygonPoints,
} from '../math';

import {
    interpolateNumber,
} from '../interpolators';

import {
    drawPoints,
} from './polyline';

export type Polygon = ReturnType<typeof createPolygon>;
export interface PolygonState extends BaseElementState {
    cx: number;
    cy: number;
    radius: number;
    sides: number;
}

export function elementIsPolygon(element: Element): element is Polygon {
    return element.type === 'polygon';
}

export const createPolygon = defineShape<PolygonState>('polygon', ({
    setBoundingBoxHandler,
}) => {
    setBoundingBoxHandler(({ state }) => new Box(
        state.cy - state.radius,
        state.cx - state.radius,
        state.cy + state.radius,
        state.cx + state.radius
    ));

    return ({ state, path }) => {
        const {
            sides,
            cx,
            cy,
            radius,
        } = state;

        const points = getPolygonPoints(sides, cx, cy, radius);

        drawPoints(points, path);
        path.closePath();
    };
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