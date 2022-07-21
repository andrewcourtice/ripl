import {
    BaseElement,
    createShape,
} from '../core';

import {
    arrayMap,
    isArray,
} from '@ripl/utilities';
import {
    interpolateNumber, Interpolator,
} from '../interpolators';

type BorderRadius = [
    topLeft: number,
    topRight: number,
    bottomRight: number,
    bottomLeft: number,
];

export interface Rect extends BaseElement {
    x: number;
    y: number;
    width: number;
    height: number;
    borderRadius?: number | BorderRadius;
}

function normaliseBorderRadius(borderRadius: number | BorderRadius): BorderRadius {
    return isArray(borderRadius)
        ? borderRadius
        : [
            borderRadius,
            borderRadius,
            borderRadius,
            borderRadius,
        ];
}

function interpolateBorderRadius(radiusA?: number | BorderRadius, radiusB?: number | BorderRadius): Interpolator<BorderRadius> {
    if (!radiusA || !radiusB) {
        return () => [0, 0, 0, 0];
    }

    const nRadiusA = normaliseBorderRadius(radiusA);
    const nRadiusB = normaliseBorderRadius(radiusB);
    const interpolators = arrayMap(nRadiusA, (value, index) => interpolateNumber(value, nRadiusB[index]));

    return position => arrayMap(interpolators, ib => ib(position)) as BorderRadius;
}

export const createRect = createShape<Rect>('rect', () => ({ path, state }) => {
    const {
        x,
        y,
        width,
        height,
        borderRadius,
    } = state;

    if (!borderRadius) {
        return path.rect(x, y, width, height);
    }

    const [
        borderTopLeft,
        borderTopRight,
        borderBottomRight,
        borderBottomLeft,
    ] = normaliseBorderRadius(borderRadius);

    path.moveTo(x + borderTopLeft, y);
    path.lineTo(x + width - borderTopRight, y);
    path.arcTo(x + width, y, x + width, y + borderTopRight, borderTopRight);
    path.lineTo(x + width, y + height - borderBottomRight);
    path.arcTo(x + width, y + height, x + width - borderBottomRight, y + height, borderBottomRight);
    path.lineTo(x + borderBottomLeft, y + height);
    path.arcTo(x, y + height, x, y + height - borderBottomLeft, borderBottomLeft);
    path.lineTo(x, y + borderTopLeft);
    path.arcTo(x, y, x + borderTopLeft, y, borderTopLeft);
    path.closePath();
}, {
    interpolators: {
        borderRadius: interpolateBorderRadius,
    },
});