import {
    BaseElementState,
    Context,
    ContextPath,
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

export type PolylineRenderer = 'linear' | 'spline';
export type PolylineRenderFunc = (context: Context, path: ContextPath, points: Point[]) => void;
export interface PolylineState extends BaseElementState {
    points: Point[];
    renderer?: PolylineRenderer | PolylineRenderFunc;
}

const RENDERERS = {
    linear: polylineLinearRenderer(),
} as Record<PolylineRenderer, PolylineRenderFunc>;

export function polylineLinearRenderer(): PolylineRenderFunc {
    return (context, path, points) => path.polyline(points);
}

export function polylineSplineRenderer(tension: number = 0.5): PolylineRenderFunc {
    const getControlPoint = ([x0, y0]: Point, [x1, y1]: Point, [x2, y2]: Point, tension: number = 0.5) => {
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
    };

    return (context, path, points) => {
        const firstPaddedPoint = [points[0][0], points[0][1]];
        const lastPaddedPoint = [points[points.length - 1][0], points[points.length - 1][1]];
        const pnts = [firstPaddedPoint].concat(points, [lastPaddedPoint]);

        path.moveTo(pnts[0][0], pnts[0][1]);

        for (let index = 1; index <= points.length - 1; index++) {
            const [x0, y0] = pnts[index - 1];
            const [x1, y1] = pnts[index];
            const [x2, y2] = pnts[index + 1];
            const [x3, y3] = pnts[index + 2];

            const firstCtrlPoints = getControlPoint([x0, y0], [x1, y1], [x2, y2], tension);
            const secondCtrlPoints = getControlPoint([x1, y1], [x2, y2], [x3, y3], tension);

            const cpx1 = index === 1 ? firstCtrlPoints[0] : firstCtrlPoints[2];
            const cpy1 = index === 1 ? firstCtrlPoints[1] : firstCtrlPoints[3];
            const cpx2 = index === points.length - 1 ? secondCtrlPoints[2] : secondCtrlPoints[0];
            const cpy2 = index === points.length - 1 ? secondCtrlPoints[3] : secondCtrlPoints[1];

            // path.moveTo(x1, y1);
            path.bezierCurveTo(cpx1, cpy1 ,cpx2, cpy2, x2, y2);
            context.stroke(path);
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
            left,
            top,
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