import {
    SVG_STYLE_MAP,
} from './constants';

import type {
    Styles,
} from './types';

import {
    parseColor,
    serialiseRGBA,
} from '@ripl/core';

import {
    objectMap,
} from '@ripl/utilities';

/** Creates an SVG element of the given tag in the SVG namespace. */
export function createSVGElement<TTag extends keyof SVGElementTagNameMap>(tag: TTag) {
    return document.createElementNS('http://www.w3.org/2000/svg', tag);
}

/** Normalises a color string to a serialised `rgba()` value, returning the input unchanged when it cannot be parsed. */
export function normaliseGradientColor(color: string): string {
    const rgba = parseColor(color);
    return rgba ? serialiseRGBA(...rgba) : color;
}

/** Maps unified context style values to their SVG equivalents using the `SVG_STYLE_MAP` lookup. */
export function mapSVGStyles(styles: Partial<Styles>) {
    return objectMap(styles, (key, value) => {
        const mapped = SVG_STYLE_MAP[key];
        return mapped?.[value as string] ?? value;
    });
}

/** Resolves the intrinsic pixel size of a `CanvasImageSource` as a `[width, height]` tuple. */
export function getImageSourceSize(image: CanvasImageSource): [number, number] {
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

/** Draws a `CanvasImageSource` onto an offscreen canvas at the given size and returns its data URL. */
export function canvasImageSourceToDataURL(image: CanvasImageSource, width?: number, height?: number): string {
    const [sourceWidth, sourceHeight] = getImageSourceSize(image);
    const imgWidth = width ?? sourceWidth;
    const imgHeight = height ?? sourceHeight;
    const canvas = document.createElement('canvas');

    canvas.width = imgWidth;
    canvas.height = imgHeight;

    const ctx = canvas.getContext('2d');

    if (ctx) {
        ctx.drawImage(image, 0, 0, imgWidth, imgHeight);
    }

    return canvas.toDataURL();
}

/** Rasterizes serialized SVG markup to `ImageData` by decoding it through an `Image` onto a canvas. */
export function svgMarkupToImageData(markup: string, width: number, height: number): Promise<ImageData> {
    const imgWidth = Math.max(1, Math.round(width));
    const imgHeight = Math.max(1, Math.round(height));
    const url = URL.createObjectURL(new Blob([markup], {
        type: 'image/svg+xml',
    }));

    return new Promise((resolve, reject) => {
        const image = new Image();

        image.onload = () => {
            URL.revokeObjectURL(url);

            const canvas = document.createElement('canvas');

            canvas.width = imgWidth;
            canvas.height = imgHeight;

            const context = canvas.getContext('2d');

            if (!context) {
                reject(new Error('Unable to acquire a 2D context for SVG export'));
                return;
            }

            context.drawImage(image, 0, 0, imgWidth, imgHeight);
            resolve(context.getImageData(0, 0, imgWidth, imgHeight));
        };

        image.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('Failed to rasterize SVG for export'));
        };

        image.src = url;
    });
}
