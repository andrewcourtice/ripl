import {
    shape,
} from '../core/shape';

import {
    Line,
    linePointCalculator,
} from './line';

import {
    midpoint,
} from '../math/geometry';

export type Spline = Line

export const spline = shape<Spline>({
    name: 'spline',
    calculators: {
        points: linePointCalculator,
    },
    onRender({ path, state }) {
        const {
            points,
        } = state;

        path.moveTo(points[0][0], points[0][1]);

        points.forEach(([x1, y1], index) => {
            const [x2, y2] = points[index + 1] || [x1, y1];
            const [xMid, yMid] = midpoint([x1, y1], [x2, y2]);
            const cpx1 = (x1 + xMid) / 2;
            const cpx2 = (x2 + xMid) / 2;

            path.quadraticCurveTo(cpx1, y1, xMid, yMid);
            path.quadraticCurveTo(cpx2, y2, x2, y2);
        });
    },
});
