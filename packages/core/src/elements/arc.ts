import {
    BaseElementState,
    defineShape,
} from '../core';

import {
    Box,
    getThetaPoint,
    max,
    min,
    Point,
} from '../math';

import {
    typeIsNil,
} from '@ripl/utilities';

export interface ArcState extends BaseElementState {
    cx: number;
    cy: number;
    startAngle: number;
    endAngle: number;
    radius: number;
    innerRadius?: number;
    padAngle?: number;
    borderRadius?: number;
}

export function getArcCentroid(arc: ArcState): Point {
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

export const createArc = defineShape<ArcState>('arc', ({
    setBoundingBoxHandler,
}) => {
    setBoundingBoxHandler(({ state }) => {
        const {
            cx,
            cy,
            radius,
            innerRadius,
            startAngle,
            endAngle,
        } = state;

        const [outerX1, outerY1] = getThetaPoint(startAngle, radius, cx, cy);
        const [outerX2, outerY2] = getThetaPoint(endAngle, radius, cx, cy);

        if (typeIsNil(innerRadius)) {
            return new Box(
                min(cy, outerY1, outerY2),
                min(cx, outerX1, outerX2),
                max(cy, outerY1, outerY2),
                max(cx, outerX1, outerX2)
            );
        }

        const [innerX1, innerY1] = getThetaPoint(startAngle, innerRadius, cx, cy);
        const [innerX2, innerY2] = getThetaPoint(endAngle, innerRadius, cx, cy);

        return new Box(
            min(innerY1, innerY2, outerY1, outerY2),
            min(innerX1, innerX2, outerX1, outerX2),
            max(innerY1, innerY2, outerY1, outerY2),
            max(innerX1, innerX2, outerX1, outerX2)
        );
    });

    return ({ path, state }) => {
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

        if (typeIsNil(innerRadius)) {
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
    };
});