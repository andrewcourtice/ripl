import {
    fractional,
} from '../math/number';

import {
    continuous,
} from '../math/scale';

import {
    getHypLength,
} from '../math/trigonometry';

import {
    BaseShape,
    Calculator,
    shape,
    ShapeValueFunction,
} from './_base';

export type LinePoint = [x: number, y: number];
export type DrawLineFn = (points: LinePoint[]) => ShapeValueFunction<LinePoint[]>;

export interface Line extends BaseShape {
    points: LinePoint[];
}

export const linePointCalculator: Calculator<LinePoint[]> = (setA, setB) => {
    const scales = setA.map(([x1, y1], index) => {
        const [x2, y2] = setB[index];
        const xScale = continuous([0, 1], [x1, x2]);
        const yScale = continuous([0, 1], [y1, y2]);

        return [xScale, yScale];
    });

    return time => scales.map(([xScale, yScale]) => [
        xScale(time, true),
        yScale(time, true),
    ]);
};

export const drawLinePoints: DrawLineFn = points => {
    const lastIndex = points.length - 1;

    return time => {
        if (time === 1) {
            return points;
        }

        const position = lastIndex * time;
        const lowerBound = Math.floor(position);
        const upperBound = Math.ceil(position);

        const [x1, y1] = points[lowerBound];
        const [x2, y2] = points[upperBound];

        const adj = x2 - x1;
        const opp = y2 - y1;
        const hyp = getHypLength(adj, opp);
        const angle = Math.atan(opp / adj);
        const offset = fractional(position);
        const distance = hyp * offset;

        return points.slice(0, upperBound).concat([
            [
                x1 + distance * Math.cos(angle),
                y1 + distance * Math.sin(angle),
            ],
        ]);
    };
};

export const drawPoints = (points: LinePoint[], context: CanvasRenderingContext2D) => {
    let moveOnly = true;

    context.beginPath();

    for (const [x, y] of points) {
        if (moveOnly) {
            context.moveTo(x, y);
            moveOnly = false;
        } else {
            context.lineTo(x, y);
        }
    }
};

export const line = shape<Line>((context, state) => {
    const {
        points,
    } = state;

    drawPoints(points, context);
}, {
    points: linePointCalculator,
});
