import type {
    Context,
} from '../context';

import {
    BaseElementState,
    Element,
    ElementOptions,
} from '../core';

import {
    Box,
} from '../math';

import type {
    InterpolatorFactory,
} from '../interpolators';

export interface ImageState extends BaseElementState {
    image: CanvasImageSource;
    x: number;
    y: number;
    width?: number;
    height?: number;
}

let refCanvas: HTMLCanvasElement | undefined;
let refContext: CanvasRenderingContext2D | null;

function getRefCanvas(): {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;
} | undefined {
    if (!refCanvas) {
        refCanvas = document.createElement('canvas');
        refContext = refCanvas.getContext('2d');
    }

    if (!refContext) {
        return undefined;
    }

    return {
        canvas: refCanvas,
        context: refContext,
    };
}

function getSourceSize(image: CanvasImageSource): [number, number] {
    if (image instanceof HTMLImageElement || image instanceof HTMLCanvasElement) {
        return [image.width, image.height];
    }

    if (image instanceof SVGImageElement) {
        return [image.width.baseVal.value, image.height.baseVal.value];
    }

    if (image instanceof HTMLVideoElement) {
        return [image.videoWidth, image.videoHeight];
    }

    if (image instanceof ImageBitmap) {
        return [image.width, image.height];
    }

    if (typeof OffscreenCanvas !== 'undefined' && image instanceof OffscreenCanvas) {
        return [image.width, image.height];
    }

    return [0, 0];
}

export const interpolateImage: InterpolatorFactory<CanvasImageSource> = (valueA, valueB) => {
    const [sourceWidth, sourceHeight] = getSourceSize(valueA);

    return time => {
        const ref = getRefCanvas();

        if (!ref) {
            return time > 0.5 ? valueB : valueA;
        }

        ref.canvas.width = sourceWidth;
        ref.canvas.height = sourceHeight;

        ref.context.clearRect(0, 0, sourceWidth, sourceHeight);
        ref.context.globalAlpha = 1 - time;
        ref.context.drawImage(valueA, 0, 0);
        ref.context.globalAlpha = time;
        ref.context.drawImage(valueB, 0, 0);

        return ref.canvas;
    };
};

export class ImageElement extends Element<ImageState> {

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

    public get width() {
        return this.getStateValue('width');
    }

    public set width(value) {
        this.setStateValue('width', value);
    }

    public get height() {
        return this.getStateValue('height');
    }

    public set height(value) {
        this.setStateValue('height', value);
    }

    constructor(options: ElementOptions<ImageState>) {
        super('image', options);
    }

    public getBoundingBox() {
        const [sourceWidth, sourceHeight] = getSourceSize(this.image);

        return new Box(
            this.y,
            this.x,
            this.y + (this.height ?? sourceHeight),
            this.x + (this.width ?? sourceWidth)
        );
    }

    public render(context: Context) {
        return super.render(context, () => {
            context.drawImage(this.image, this.x, this.y, this.width, this.height);
        });
    }

}

export function createImage(...options: ConstructorParameters<typeof ImageElement>) {
    return new ImageElement(...options);
}

export function elementIsImage(value: unknown): value is ImageElement {
    return value instanceof ImageElement;
}