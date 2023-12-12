import {
    BaseElementState,
    defineShape,
    Element,
} from '../core';

import {
    BorderRadius,
    Box,
    normaliseBorderRadius,
} from '../math';

export type Rect = ReturnType<typeof createRect>;
export interface RectState extends BaseElementState {
    x: number;
    y: number;
    width: number;
    height: number;
    borderRadius?: number | BorderRadius;
}

export function elementIsRect(element: Element): element is Rect {
    return element.type === 'rect';
}

export const createRect = defineShape<RectState>('rect', ({
    setBoundingBoxHandler,
}) => {
    setBoundingBoxHandler(({ state }) => new Box(
        state.y,
        state.x,
        state.y + state.height,
        state.x + state.width
    ));

    return ({ path, state }) => {
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

        const borders = normaliseBorderRadius(borderRadius);

        if (path.roundRect) {
            return path.roundRect(x, y, width, height, borders);
        }

        const [
            borderTopLeft,
            borderTopRight,
            borderBottomRight,
            borderBottomLeft,
        ] = borders;

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
    };
});