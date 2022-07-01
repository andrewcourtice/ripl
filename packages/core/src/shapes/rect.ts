import {
    BaseShape,
    shape,
} from './_base';

export interface Rect extends BaseShape {
    x: number;
    y: number;
    width: number;
    height: number;
}

export const rect = shape<Rect>((context, state) => {
    const {
        x,
        y,
        width,
        height,
    } = state;

    context.beginPath();
    context.rect(x, y, width, height);
});
