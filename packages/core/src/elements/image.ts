import {
    Element,
} from '../core';

import type {
    BaseElementState,
    ElementOptions,
} from '../core';

import type {
    Context,
} from '../context';

import {
    factory,
} from '../core/factory';

import {
    Box,
} from '../math';

import type {
    InterpolatorFactory,
} from '../interpolators';

import {
    functionCache,
} from '@ripl/utilities';

/** State interface for an image element, defining position, optional size, and image source. */
export interface ImageState extends BaseElementState {
    image: CanvasImageSource;
    x: number;
    y: number;
    width?: number;
    height?: number;
}

const getRefCanvas = functionCache(() => {
    const canvas = factory.createElement('canvas') as HTMLCanvasElement;
    const context = canvas.getContext('2d');

    if (!context) {
        return undefined;
    }

    return {
        canvas,
        context,
    };
});

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

/** Interpolator factory that cross-fades between two image sources using an offscreen canvas. */
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

/** An image element that draws a `CanvasImageSource` at a given position and optional size. */
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

    public getBoundingBox(): Box {
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

/** Factory function that creates a new `ImageElement` instance. */
export function createImage(...options: ConstructorParameters<typeof ImageElement>) {
    return new ImageElement(...options);
}

/** Type guard that checks whether a value is an `ImageElement` instance. */
export function elementIsImage(value: unknown): value is ImageElement {
    return value instanceof ImageElement;
}