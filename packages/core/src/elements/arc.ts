import {
    isNil,
} from '@ripl/utilities';
import {
    BaseElement,
    createShape,
} from '../core';

import {
    getThetaPoint, Point,
} from '../math';

export interface Arc extends BaseElement {
    cx: number;
    cy: number;
    startAngle: number;
    endAngle: number;
    radius: number;
    innerRadius?: number;
    padAngle?: number;
    borderRadius?: number;
}

export function getArcCentroid(arc: Arc): Point {
    const {
        cx,
        cy,
        radius,
        startAngle,
        endAngle,
        innerRadius = 0,
    } = arc;

    const angle = (startAngle + endAngle) / 2;
    const distance = innerRadius + (radius - innerRadius) / 2;

    return getThetaPoint(angle, distance, cx, cy);
}

export const createArc = createShape<Arc>('arc', () => ({ path, state }) => {
    let {
        cx,
        cy,
        radius,
        innerRadius,
        startAngle,
        endAngle,
        padAngle,
        borderRadius,
    } = state;

    if (padAngle) {
        const offset = padAngle / 2;

        startAngle = Math.min(startAngle + offset, endAngle);
        endAngle = Math.max(endAngle - offset, startAngle);
    }

    if (isNil(innerRadius)) {
        return path.arc(cx, cy, radius, startAngle, endAngle);
    }

    const [x1, y1] = getThetaPoint(startAngle, radius, cx, cy);
    const [x2, y2] = getThetaPoint(endAngle, innerRadius, cx, cy);

    path.moveTo(x1, y1);
    path.arc(cx, cy, radius, startAngle, endAngle);
    path.lineTo(x2, y2);
    path.arc(cx, cy, innerRadius, endAngle, startAngle, true);
    path.lineTo(x1, y1);
    path.closePath();
});