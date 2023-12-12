import {
    BaseElementState,
    defineElement,
    Element,
} from '../core';

import {
    Box,
} from '../math';

export type Text = ReturnType<typeof createText>;
export interface TextState extends BaseElementState {
    x: number;
    y: number;
    content: string | number;
}

export function elementIsText(element: Element): element is Text {
    return element.type === 'text';
}

export const createText = defineElement<TextState>('text', ({
    setBoundingBoxHandler,
}) => {
    setBoundingBoxHandler(({ state, context }) => {
        const {
            actualBoundingBoxAscent,
            actualBoundingBoxLeft,
            actualBoundingBoxDescent,
            actualBoundingBoxRight,
        } = context.measureText(state.content.toString());

        return new Box(
            state.y - actualBoundingBoxAscent,
            state.x - actualBoundingBoxLeft,
            state.y + actualBoundingBoxDescent,
            state.x + actualBoundingBoxRight
        );
    });

    return ({ context, state }) => {
        const {
            x,
            y,
            content,
            fillStyle,
            strokeStyle,
        } = state;

        if (strokeStyle) {
            return context.strokeText(content.toString(), x, y);
        }

        if (fillStyle) {
            return context.fillText(content.toString(), x, y);
        }
    };
});