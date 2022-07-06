import {
    shape,
} from '../core/shape';

import {
    BaseElement,
    ElementCalculator,
    ElementValueFunction,
} from '../core/element';

import {
    fractional,
} from '../math/number';

import {
    Point,
    waypoint,
} from '../math/geometry';

import {
    interpolateNumber,
} from '../math/interpolate';

export type DrawLineFn = (points: Point[]) => ElementValueFunction<Point[]>;

export interface Line extends BaseElement {
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
    ] = sets.slice().sort((sa, sb) => sb.length - sa.length);

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
    ].sort(() => sets.indexOf(dest) - sets.indexOf(src));
};

export const linePointCalculator: ElementCalculator<Point[]> = (setA, setB) => {
    const [
        extSetA,
        extSetB,
    ] = extrapolatePointSet(setA, setB);

    return time => extSetA.map(([x1, y1], index) => {
        const [x2, y2] = extSetB[index];

        return [
            interpolateNumber(x1, x2, time),
            interpolateNumber(y1, y2, time),
        ];
    });
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

export const drawPoints = (points: Point[], context: CanvasRenderingContext2D, path: Path2D) => {
    let moveOnly = true;

    for (const [x, y] of points) {
        if (moveOnly) {
            path.moveTo(x, y);
            moveOnly = false;
        } else {
            path.lineTo(x, y);
        }
    }
};

export const line = shape<Line>({
    name: 'line',
    calculators: {
        points: linePointCalculator,
    },
    onRender(context, path, { state }) {
        const {
            points,
        } = state;

        drawPoints(points, context, path);
    },
});
