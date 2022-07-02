import {
    fractional,
} from '../math/number';

import {
    continuous,
} from '../math/scale';

import {
    Point,
    waypoint,
} from '../math/trigonometry';

import {
    BaseShape,
    shape,
    ShapeCalculator,
    ShapeValueFunction,
} from './base';

export type DrawLineFn = (points: Point[]) => ShapeValueFunction<Point[]>;

export interface Line extends BaseShape {
    points: Point[];
}

export const extrapolatePointSet = (setA: Point[], setB: Point[]): Point[][] => {
    const sets = [setA, setB];

    if (setA.length === setB.length) {
        return sets;
    }

    // Determine the greater set
    const [
        src,
        dest,
    ] = sets.sort((sa, sb) => sb.length - sa.length);

    const destLength = dest.length;
    const srcLength = src.length;
    const pointCount = srcLength - destLength;
    const partitionCount = destLength - 1;
    const pointsPerPartition = Math.floor(pointCount / partitionCount);

    const extrapolated = dest.slice();

    Array.from({ length: partitionCount }, (_, pcIndex) => {
        const insertionIndex = pcIndex * (pointsPerPartition + 1);
        const points = Array.from({ length: pointsPerPartition }, (_, pppIndex) => {
            return waypoint(dest[pcIndex], dest[pcIndex + 1], (1 / pointsPerPartition) * pppIndex);
        });

        extrapolated.splice(insertionIndex, 0, ...points);
    });

    const remainder = srcLength - extrapolated.length;

    if (remainder) {
        const points = Array.from({ length: remainder }, () => extrapolated[0]);
        extrapolated.splice(0, 0, ...points);
    }

    return [
        src,
        extrapolated,
    ].sort(set => sets.indexOf(set));
};

export const linePointCalculator: ShapeCalculator<Point[]> = (setA, setB) => {
    const [
        eSetA,
        eSetB,
    ] = extrapolatePointSet(setA, setB);

    const scales = eSetA.map(([x1, y1], index) => {
        const [x2, y2] = eSetB[index];
        const xScale = continuous([0, 1], [x1, x2]);
        const yScale = continuous([0, 1], [y1, y2]);

        return [xScale, yScale];
    });

    return time => scales.map(([xScale, yScale]) => [
        xScale(time),
        yScale(time),
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

        return points.slice(0, upperBound).concat([
            waypoint(points[lowerBound], points[upperBound], fractional(position)),
        ]);
    };
};

export const drawPoints = (points: Point[], context: CanvasRenderingContext2D) => {
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

export const line = shape<Line>({
    name: 'line',
    calculators: {
        points: linePointCalculator,
    },
    onRender(context, state) {
        const {
            points,
        } = state;

        drawPoints(points, context);
    },
});
