import {
    shape,
} from '../core/shape';

import {
    Line,
    linePointCalculator,
} from './line';

import {
    midpoint,
    Point,
} from '../math/geometry';

import {
    getHypLength,
} from '../math/trigonometry';

export type Spline = Line;

function getControlPoint([x0, y0]: Point, [x1, y1]: Point, [x2, y2]: Point, tension: number = 0.5) {
    const d1 = getHypLength(x1 - x0, y1 - y0);
    const d2 = getHypLength(x2 - x1, y2 - y1);

    const width = Math.abs(x2 - x0);
    const height = Math.abs(y2 - y0);

    const dScale1 = d1 / (d1 + d2);
    const dScale2 = d2 / (d1 + d2);

    return [
        x1 - (width * dScale1 * tension),
        y1 - (height * dScale1 * tension),
        x1 + (width * dScale2 * tension),
        y1 + (height * dScale2 * tension),
    ];
}

export const spline = shape<Spline>({
    name: 'spline',
    calculators: {
        points: linePointCalculator,
    },
    onRender({ path, context, state }) {
        const {
            points,
        } = state;

        // const pnts = [points[0]].concat(points, [points[points.length - 1]]);

        // console.log(pnts);

        // const controlPoints = Array.from({ length: pnts.length - 2 }, (_, index) => {
        //     const [x0, y0] = pnts[index];
        //     const [x1, y1] = pnts[index + 1];
        //     const [x2, y2] = pnts[index + 2];

        //     return getControlPoint([x0, y0], [x1, y1], [x2, y2]);
        // });

        // console.log(controlPoints);

        // path.moveTo(pnts[0][0], pnts[0][1]);

        // for (let index = 1; index <= points.length - 1; index++) {
        //     const [x0, y0] = pnts[index - 1];
        //     const [x1, y1] = pnts[index];
        //     const [x2, y2] = pnts[index + 1];

        //     const [cpx1, cpy1, cpx2, cpy2] = getControlPoint([x0, y0], [x1, y1], [x2, y2]);

        //     // path.moveTo(x1, y1);
        //     path.bezierCurveTo(cpx1, cpy1 ,cpx2, cpy2, x1, y1);
        //     context.stroke(path);
        // }

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
