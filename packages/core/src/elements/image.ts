import {
    BaseElement,
    createElement,
    ElementInterpolator,
} from '../core';

export interface Image extends BaseElement {
    image: CanvasImageSource;
    x: number;
    y: number;
}

const refCanvas = document.createElement('canvas');
const refContext = refCanvas.getContext('2d');

const imageInterpolator: ElementInterpolator<Image['image']> = (valueA, valueB) => {
    refCanvas.width = +valueA.width;
    refCanvas.height = +valueA.height;

    return time => {
        if (!refContext) {
            return valueA;
        }

        refContext.clearRect(0, 0, refCanvas.width, refCanvas.height);
        refContext.globalAlpha = 1 - time;
        refContext.drawImage(valueA, 0, 0);
        refContext.clearRect(0, 0, refCanvas.width, refCanvas.height);
        refContext.globalAlpha = time;
        refContext.drawImage(valueB, 0, 0);

        return refContext.getImageData(0, 0, refCanvas.width, refCanvas.height) as unknown as CanvasImageSource;
    };
};

export const createImage = createElement<Image>('image', () => ({ context, state }) => {
    const {
        image,
        x,
        y,
    } = state;

    if (image instanceof ImageData) {
        return context.putImageData(image, x, y);
    }

    context.drawImage(image, x, y);
}, {
    interpolators: {
        image: imageInterpolator,
    },
});