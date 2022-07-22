import {
    BaseElement,
    createShape,
} from '../core';

import {
    BorderRadius,
    normaliseBorderRadius,
} from '../math';

import {
    interpolateBorderRadius,
} from '../interpolators';

export interface Rect extends BaseElement {
    x: number;
    y: number;
    width: number;
    height: number;
    borderRadius?: number | BorderRadius;
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
        borderRadius: (bRadiusA, bRadiusB) => {
            if (bRadiusA && bRadiusB) {
                return interpolateBorderRadius(bRadiusA, bRadiusB);
            }

            return () => undefined;
        },
    },
});