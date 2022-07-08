import {
    BaseElement,
    element,
} from '../core/element';

export interface Text extends BaseElement {
    x: number;
    y: number;
    content: string | number;
}

export const text = element<Text>({
    name: 'text',
    onRender({ context, state }) {
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
