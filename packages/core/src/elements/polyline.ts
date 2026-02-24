import type {
    Context,
    ContextPath,
} from '../context';

import {
    BaseElementState,
    Shape,
    ShapeOptions,
} from '../core';

import {
    Box,
    getExtent,
    getHypLength,
    Point,
} from '../math';

import {
    typeIsFunction,
} from '@ripl/utilities';

export type PolylineRenderer = 'linear'
| 'spline'
| 'basis'
| 'bumpX'
| 'bumpY'
| 'cardinal'
| 'catmullRom'
| 'monotoneX'
| 'monotoneY'
| 'natural'
| 'step'
| 'stepBefore'
| 'stepAfter';

export type PolylineRenderFunc = (context: Context, path: ContextPath, points: Point[]) => void;
export interface PolylineState extends BaseElementState {
    points: Point[];
    renderer?: PolylineRenderer | PolylineRenderFunc;
}

const RENDERERS = {
    linear: polylineLinearRenderer(),
    spline: polylineSplineRenderer(),
    basis: polylineBasisRenderer(),
    bumpX: polylineBumpXRenderer(),
    bumpY: polylineBumpYRenderer(),
    cardinal: polylineCardinalRenderer(),
    catmullRom: polylineCatmullRomRenderer(),
    monotoneX: polylineMonotoneXRenderer(),
    monotoneY: polylineMonotoneYRenderer(),
    natural: polylineNaturalRenderer(),
    step: polylineStepRenderer(),
    stepBefore: polylineStepBeforeRenderer(),
    stepAfter: polylineStepAfterRenderer(),
} as Record<PolylineRenderer, PolylineRenderFunc>;


function handleSimplePolyline(path: ContextPath, points: Point[], minPoints: number = 2): boolean {
    if (points.length < minPoints) {
        return true;
    }

    path.moveTo(points[0][0], points[0][1]);

    if (points.length === minPoints) {
        path.lineTo(points[1][0], points[1][1]);
        return true;
    }

    return false;
}

function calculateSlopes(points: Point[], isXAxis: boolean): number[] {
    const pointCount = points.length;
    const slopes = new Array(pointCount - 1);

    for (let index = 0; index < pointCount - 1; index++) {
        const currentPoint = points[index];
        const nextPoint = points[index + 1];

        slopes[index] = (nextPoint[+isXAxis] - currentPoint[+isXAxis]) / (nextPoint[+!isXAxis] - currentPoint[+!isXAxis]);
    }

    return slopes;
}

function calculateTangents(slopes: number[], pointCount: number): number[] {
    const tangents = new Array(pointCount);
    tangents[0] = slopes[0];

    for (let index = 1; index < pointCount - 1; index++) {
        tangents[index] = (slopes[index - 1] + slopes[index]) / 2;
    }

    tangents[pointCount - 1] = slopes[pointCount - 2];

    return tangents;
}

function adjustMonotonicTangents(tangents: number[], slopes: number[], pointCount: number): void {
    for (let index = 0; index < pointCount - 1; index++) {
        if (slopes[index] === 0) {
            // eslint-disable-next-line no-multi-assign
            tangents[index] = tangents[index + 1] = 0;
        } else {
            const alpha = tangents[index] / slopes[index];
            const beta = tangents[index + 1] / slopes[index];
            const magnitude = Math.sqrt(alpha * alpha + beta * beta);
            if (magnitude > 3) {
                const scalingFactor = 3 / magnitude;
                tangents[index] = scalingFactor * alpha * slopes[index];
                tangents[index + 1] = scalingFactor * beta * slopes[index];
            }
        }
    }
}

export function polylineLinearRenderer(): PolylineRenderFunc {
    return (context, path, points) => path.polyline(points);
}

export function polylineSplineRenderer(tension: number = 0.5): PolylineRenderFunc {
    const getControlPoint = ([x0, y0]: Point, [x1, y1]: Point, [x2, y2]: Point, tension: number = 0.5) => {
        const distance1 = getHypLength(x1 - x0, y1 - y0);
        const distance2 = getHypLength(x2 - x1, y2 - y1);

        const width = Math.abs(x2 - x0);
        const height = Math.abs(y2 - y0);

        const distanceScale1 = distance1 / (distance1 + distance2);
        const distanceScale2 = distance2 / (distance1 + distance2);

        return [
            x1 - (width * distanceScale1 * tension),
            y1 - (height * distanceScale1 * tension),
            x1 + (width * distanceScale2 * tension),
            y1 + (height * distanceScale2 * tension),
        ];
    };

    return (context, path, points) => {
        const firstPaddedPoint = [points[0][0], points[0][1]];
        const lastPaddedPoint = [points[points.length - 1][0], points[points.length - 1][1]];
        const paddedPoints = [firstPaddedPoint].concat(points, [lastPaddedPoint]);

        path.moveTo(paddedPoints[0][0], paddedPoints[0][1]);

        for (let index = 1; index <= points.length - 1; index++) {
            const [x0, y0] = paddedPoints[index - 1];
            const [x1, y1] = paddedPoints[index];
            const [x2, y2] = paddedPoints[index + 1];
            const [x3, y3] = paddedPoints[index + 2];

            const firstCtrlPoints = getControlPoint([x0, y0], [x1, y1], [x2, y2], tension);
            const secondCtrlPoints = getControlPoint([x1, y1], [x2, y2], [x3, y3], tension);

            const cpx1 = index === 1 ? firstCtrlPoints[0] : firstCtrlPoints[2];
            const cpy1 = index === 1 ? firstCtrlPoints[1] : firstCtrlPoints[3];
            const cpx2 = index === points.length - 1 ? secondCtrlPoints[2] : secondCtrlPoints[0];
            const cpy2 = index === points.length - 1 ? secondCtrlPoints[3] : secondCtrlPoints[1];

            path.bezierCurveTo(cpx1, cpy1 ,cpx2, cpy2, x2, y2);
        }
    };
}

export function polylineBasisRenderer(): PolylineRenderFunc {
    return (context, path, points) => {
        if (handleSimplePolyline(path, points)) {
            return;
        }

        // Basis spline uses cubic B-spline interpolation
        const pointCount = points.length;
        for (let index = 0; index < pointCount - 2; index++) {
            const [x0, y0] = points[index];
            const [x1, y1] = points[index + 1];
            const [x2, y2] = points[index + 2];

            const cpx1 = (2 * x0 + x1) / 3;
            const cpy1 = (2 * y0 + y1) / 3;
            const cpx2 = (x0 + 2 * x1) / 3;
            const cpy2 = (y0 + 2 * y1) / 3;
            const endX = (x0 + 4 * x1 + x2) / 6;
            const endY = (y0 + 4 * y1 + y2) / 6;

            path.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, endX, endY);
        }

        // Final segment
        const [xn2, yn2] = points[pointCount - 2];
        const [xn1, yn1] = points[pointCount - 1];
        const cpx1 = (2 * xn2 + xn1) / 3;
        const cpy1 = (2 * yn2 + yn1) / 3;
        const cpx2 = (xn2 + 2 * xn1) / 3;
        const cpy2 = (yn2 + 2 * yn1) / 3;

        path.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, xn1, yn1);
    };
}

export function polylineBumpXRenderer(): PolylineRenderFunc {
    return (context, path, points) => {
        if (points.length < 1) {
            return;
        }

        path.moveTo(points[0][0], points[0][1]);

        for (let index = 1; index < points.length; index++) {
            const [x0, y0] = points[index - 1];
            const [x1, y1] = points[index];
            const midX = (x0 + x1) / 2;

            path.bezierCurveTo(midX, y0, midX, y1, x1, y1);
        }
    };
}

export function polylineBumpYRenderer(): PolylineRenderFunc {
    return (context, path, points) => {
        if (points.length < 1) {
            return;
        }

        path.moveTo(points[0][0], points[0][1]);

        for (let index = 1; index < points.length; index++) {
            const [x0, y0] = points[index - 1];
            const [x1, y1] = points[index];
            const midY = (y0 + y1) / 2;

            path.bezierCurveTo(x0, midY, x1, midY, x1, y1);
        }
    };
}

export function polylineCardinalRenderer(tension: number = 0): PolylineRenderFunc {
    return (context, path, points) => {
        if (handleSimplePolyline(path, points)) {
            return;
        }

        const pointCount = points.length;
        const tensionFactor = (1 - tension) / 2;

        for (let index = 1; index < pointCount - 1; index++) {
            const [x0, y0] = points[index - 1];
            const [x1, y1] = points[index];
            const [x2, y2] = points[index + 1];

            const cpx1 = x1 + (x2 - x0) * tensionFactor;
            const cpy1 = y1 + (y2 - y0) * tensionFactor;

            let cpx2: number;
            let cpy2: number;
            let endX: number;
            let endY: number;

            if (index === pointCount - 2) {
                endX = x2;
                endY = y2;
                cpx2 = x2 - (x2 - x1) * tensionFactor;
                cpy2 = y2 - (y2 - y1) * tensionFactor;
            } else {
                const [x3, y3] = points[index + 2];
                endX = x2;
                endY = y2;
                cpx2 = x2 - (x3 - x1) * tensionFactor;
                cpy2 = y2 - (y3 - y1) * tensionFactor;
            }

            path.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, endX, endY);
        }

        if (pointCount > 2) {
            const [xn1, yn1] = points[pointCount - 1];

            path.lineTo(xn1, yn1);
        }
    };
}

export function polylineCatmullRomRenderer(alpha: number = 0.5): PolylineRenderFunc {
    return (context, path, points) => {
        if (handleSimplePolyline(path, points)) {
            return;
        }

        const pointCount = points.length;

        for (let index = 0; index < pointCount - 1; index++) {
            const point0 = index > 0 ? points[index - 1] : points[index];
            const point1 = points[index];
            const point2 = points[index + 1];
            const point3 = index < pointCount - 2 ? points[index + 2] : points[index + 1];

            const distance1 = getHypLength(point1[0] - point0[0], point1[1] - point0[1]) ** alpha;
            const distance2 = getHypLength(point2[0] - point1[0], point2[1] - point1[1]) ** alpha;
            const distance3 = getHypLength(point3[0] - point2[0], point3[1] - point2[1]) ** alpha;

            const cpx1 = distance2 === 0 ? point1[0] : point1[0] + (point2[0] - point0[0]) / (6 * distance1 + 6 * distance2) * distance2;
            const cpy1 = distance2 === 0 ? point1[1] : point1[1] + (point2[1] - point0[1]) / (6 * distance1 + 6 * distance2) * distance2;
            const cpx2 = distance2 === 0 ? point2[0] : point2[0] - (point3[0] - point1[0]) / (6 * distance2 + 6 * distance3) * distance2;
            const cpy2 = distance2 === 0 ? point2[1] : point2[1] - (point3[1] - point1[1]) / (6 * distance2 + 6 * distance3) * distance2;

            path.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, point2[0], point2[1]);
        }
    };
}

export function polylineMonotoneXRenderer(): PolylineRenderFunc {
    return (context, path, points) => {
        if (handleSimplePolyline(path, points)) {
            return;
        }

        const pointCount = points.length;
        const slopes = calculateSlopes(points, true);
        const tangents = calculateTangents(slopes, pointCount);

        adjustMonotonicTangents(tangents, slopes, pointCount);

        for (let index = 0; index < pointCount - 1; index++) {
            const [x0, y0] = points[index];
            const [x1, y1] = points[index + 1];
            const dx = (x1 - x0) / 3;

            path.bezierCurveTo(
                x0 + dx,
                y0 + dx * tangents[index],
                x1 - dx,
                y1 - dx * tangents[index + 1],
                x1,
                y1
            );
        }
    };
}

export function polylineMonotoneYRenderer(): PolylineRenderFunc {
    return (context, path, points) => {
        if (handleSimplePolyline(path, points)) {
            return;
        }

        const pointCount = points.length;
        const slopes = calculateSlopes(points, false);
        const tangents = calculateTangents(slopes, pointCount);

        adjustMonotonicTangents(tangents, slopes, pointCount);

        for (let index = 0; index < pointCount - 1; index++) {
            const [x0, y0] = points[index];
            const [x1, y1] = points[index + 1];
            const dy = (y1 - y0) / 3;

            path.bezierCurveTo(
                x0 + dy * tangents[index],
                y0 + dy,
                x1 - dy * tangents[index + 1],
                y1 - dy,
                x1,
                y1
            );
        }
    };
}

export function polylineNaturalRenderer(): PolylineRenderFunc {
    return (context, path, points) => {
        if (handleSimplePolyline(path, points)) {
            return;
        }

        const pointCount = points.length;

        const stepSizes = new Array(pointCount - 1);
        const slopeDeltas = new Array(pointCount - 1);
        const rightHandSide = new Array(pointCount);
        const diagonal = new Array(pointCount);

        for (let index = 0; index < pointCount - 1; index++) {
            stepSizes[index] = points[index + 1][0] - points[index][0];
            slopeDeltas[index] = (points[index + 1][1] - points[index][1]) / stepSizes[index];
        }

        diagonal[1] = 2 * (stepSizes[0] + stepSizes[1]);
        rightHandSide[1] = 6 * (slopeDeltas[1] - slopeDeltas[0]);

        for (let index = 2; index < pointCount - 1; index++) {
            diagonal[index] = 2 * (stepSizes[index - 1] + stepSizes[index]) - (stepSizes[index - 1] * stepSizes[index - 1]) / diagonal[index - 1];
            rightHandSide[index] = 6 * (slopeDeltas[index] - slopeDeltas[index - 1]) - (stepSizes[index - 1] * rightHandSide[index - 1]) / diagonal[index - 1];
        }

        const secondDerivatives = new Array(pointCount);
        secondDerivatives[0] = 0;
        secondDerivatives[pointCount - 1] = 0;

        for (let index = pointCount - 2; index > 0; index--) {
            secondDerivatives[index] = (rightHandSide[index] - stepSizes[index] * secondDerivatives[index + 1]) / diagonal[index];
        }

        // Draw cubic spline segments
        for (let index = 0; index < pointCount - 1; index++) {
            const [x0, y0] = points[index];
            const [x1, y1] = points[index + 1];
            const stepSize = stepSizes[index];

            const cpx1 = x0 + stepSize / 3;
            const cpy1 = y0 + stepSize / 3 * ((points[index + 1][1] - points[index][1]) / stepSize - stepSize * (secondDerivatives[index + 1] + 2 * secondDerivatives[index]) / 6);
            const cpx2 = x1 - stepSize / 3;
            const cpy2 = y1 - stepSize / 3 * ((points[index + 1][1] - points[index][1]) / stepSize - stepSize * (2 * secondDerivatives[index + 1] + secondDerivatives[index]) / 6);

            path.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, x1, y1);
        }
    };
}

export function polylineStepRenderer(): PolylineRenderFunc {
    return (context, path, points) => {
        if (points.length < 1) {
            return;
        }

        path.moveTo(points[0][0], points[0][1]);

        for (let index = 1; index < points.length; index++) {
            const [x0, y0] = points[index - 1];
            const [x1, y1] = points[index];
            const midX = (x0 + x1) / 2;

            path.lineTo(midX, y0);
            path.lineTo(midX, y1);
            path.lineTo(x1, y1);
        }
    };
}

export function polylineStepBeforeRenderer(): PolylineRenderFunc {
    return (context, path, points) => {
        if (points.length < 1) {
            return;
        }

        path.moveTo(points[0][0], points[0][1]);

        for (let index = 1; index < points.length; index++) {
            const [x0] = points[index - 1];
            const [x1, y1] = points[index];

            path.lineTo(x0, y1);
            path.lineTo(x1, y1);
        }
    };
}

export function polylineStepAfterRenderer(): PolylineRenderFunc {
    return (context, path, points) => {
        if (points.length < 1) {
            return;
        }

        path.moveTo(points[0][0], points[0][1]);

        for (let index = 1; index < points.length; index++) {
            const [x1, y1] = points[index];

            path.lineTo(x1, points[index - 1][1]);
            path.lineTo(x1, y1);
        }
    };
}

export class Polyline extends Shape<PolylineState> {

    public get points() {
        return this.getStateValue('points');
    }

    public set points(value) {
        this.setStateValue('points', value);
    }

    public get renderer() {
        return this.getStateValue('renderer');
    }

    public set renderer(value) {
        this.setStateValue('renderer', value);
    }

    constructor(options: ShapeOptions<PolylineState>) {
        super('polyline', options);
    }

    public getBoundingBox() {
        const [left, right] = getExtent(this.points, point => point[0]);
        const [top, bottom] = getExtent(this.points, point => point[1]);

        return new Box(
            top,
            left,
            bottom,
            right
        );
    }

    public render(context: Context) {
        const renderer = typeIsFunction(this.renderer)
            ? this.renderer
            : RENDERERS[this.renderer ?? 'linear'];

        return super.render(context, path => renderer(context, path, this.points));
    }

}

export function createPolyline(...options: ConstructorParameters<typeof Polyline>) {
    return new Polyline(...options);
}

export function elementIsPolyline(value: unknown): value is Polyline {
    return value instanceof Polyline;
}
