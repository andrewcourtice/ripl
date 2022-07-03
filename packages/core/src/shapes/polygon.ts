import {
    TAU,
} from '../math/constants';

import {
    arePointsEqual,
    Point,
} from '../math/geometry';

import {
    shape,
} from './base';

import {
    drawPoints,
    Line,
    linePointCalculator,
} from './line';

export type Polygon = Line;

export const getPolygonPoints = (sides: number, cx: number, cy: number, radius: number) => {
    const angle = TAU / sides;
    const offset = angle / 2;

    const points = Array.from({ length: sides }, (_, i) => {
        const x = radius * Math.cos(i * angle - offset);
        const y = radius * Math.sin(i * angle - offset);

        return [
            cx + x,
            cy + y,
        ] as Point;
    });

    return [points[points.length - 1]].concat(points);
};

export const polygon = shape<Polygon>({
    name: 'polygon',
    calculators: {
        points: linePointCalculator,
    },
    //validate: options => options.points.length >= 3,
    onRender(context, state) {
        const {
            points,
        } = state;

        drawPoints(points, context);

        if (arePointsEqual(points[0], points[points.length - 1])) {
            context.closePath();
        }
    },
});
