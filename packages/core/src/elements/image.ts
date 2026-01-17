import type {
    Context,
} from '../context';

import {
    BaseElementState,
    Element,
    ElementInterpolators,
    ElementOptions,
} from '../core';

import {
    InterpolatorFactory,
} from '../interpolators';

export interface ImageState extends BaseElementState {
    image: CanvasImageSource;
    x: number;
    y: number;
}

const refCanvas = document.createElement('canvas');
const refContext = refCanvas.getContext('2d');

const imageInterpolator: InterpolatorFactory<ImageState['image']> = (valueA, valueB) => {
    const imgA = valueA as HTMLImageElement | HTMLCanvasElement;
    const imgB = valueB as HTMLImageElement | HTMLCanvasElement;
    refCanvas.width = +(imgA.width || 0);
    refCanvas.height = +(imgA.height || 0);

    return time => {
        if (!refContext) {
            return valueA;
        }

        refContext.clearRect(0, 0, refCanvas.width, refCanvas.height);
        refContext.globalAlpha = 1 - time;
        refContext.drawImage(imgA, 0, 0);
        refContext.clearRect(0, 0, refCanvas.width, refCanvas.height);
        refContext.globalAlpha = time;
        refContext.drawImage(imgB, 0, 0);

        return refContext.getImageData(0, 0, refCanvas.width, refCanvas.height) as unknown as CanvasImageSource;
    };
};

export class Image extends Element<ImageState> {

    public static interpolators: Partial<ElementInterpolators<ImageState>> = {
        image: imageInterpolator,
    };

    public get image() {
        return this.getStateValue('image');
    }

    public set image(value) {
        this.setStateValue('image', value);
    }

    public get x() {
        return this.getStateValue('x');
    }

    public set x(value) {
        this.setStateValue('x', value);
    }

    public get y() {
        return this.getStateValue('y');
    }

    public set y(value) {
        this.setStateValue('y', value);
    }

    constructor(options: ElementOptions<ImageState>) {
        super('image', options);
    }

    public render(context: Context) {
        return super.render(context, () => {
            const {
                image,
                x,
                y,
            } = this.state;

            if (image instanceof ImageData) {
                return (context as unknown as CanvasRenderingContext2D).putImageData(image, x, y);
            }

            (context as unknown as CanvasRenderingContext2D).drawImage(image, x, y);
        });
    }

}

export function createImage(...options: ConstructorParameters<typeof Image>) {
    return new Image(...options);
}

export function elementIsImage(element: Element): element is Image {
    return element.type === 'image';
}
