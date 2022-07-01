import {
    TAU,
} from '../math/constants';

import {
    arePointsEqual,
} from '../math/trigonometry';

import {
    shape,
} from './base';

import {
    drawPoints,
    Line,
    LinePoint,
    linePointCalculator,
} from './line';

export type Polygon = Line;

export const getPolygonPoints = (sides: number, cx: number, cy: number, radius: number) => {
    const angle = TAU / sides;

    const points = Array.from({ length: sides }, (_, i) => {
        const x = radius * Math.cos(i * angle);
        const y = radius * Math.sin(i * angle);

        return [
            cx + x,
            cy + y,
        ] as LinePoint;
    });

    return [points[points.length - 1]].concat(points);
};

export const polygon = shape<Polygon>({
    name: 'polygon',
    calculators: {
        points: linePointCalculator,
    },
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
