import {
    BaseShape,
    shape,
} from './base';

export interface Text extends BaseShape {
    x: number;
    y: number;
    content: string | number;
}

export const text = shape<Text>({
    name: 'text',
    autoFill: false,
    autoStroke: false,
    onRender(context, state) {
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
    },
});
