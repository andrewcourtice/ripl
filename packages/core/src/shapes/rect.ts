import {
    BaseShape,
    shape,
} from './base';

export interface Rect extends BaseShape {
    x: number;
    y: number;
    width: number;
    height: number;
}

export const rect = shape<Rect>({
    name: 'rect',
    onRender(context, state) {
        const {
            x,
            y,
            width,
            height,
        } = state;

        context.beginPath();
        context.rect(x, y, width, height);
    },
});
