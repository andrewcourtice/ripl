import {
    SVG_STYLE_MAP,
} from './constants';

import type {
    Styles,
} from './types';

import {
    parseColor,
    serializeRGBA,
} from '@ripl/core';

import {
    objectMap,
} from '@ripl/utilities';

/** Creates an SVG element of the given tag in the SVG namespace. */
export function createSVGElement<TTag extends keyof SVGElementTagNameMap>(tag: TTag) {
    return document.createElementNS('http://www.w3.org/2000/svg', tag);
}

/** Normalizes a color string to a serialized `rgba()` value, returning the input unchanged when it cannot be parsed. */
export function normalizeGradientColor(color: string): string {
    const rgba = parseColor(color);
    return rgba ? serializeRGBA(...rgba) : color;
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

const IMAGE_DATA_URL_CACHE = new WeakMap<object, Map<string, string>>();

// A canvas or a video repaints between frames, so only a source whose pixels are fixed can be keyed and memoized.
function getImageDataURLKey(image: CanvasImageSource, width: number, height: number): string | undefined {
    if (image instanceof HTMLImageElement) {
        return `${image.src}|${width}|${height}`;
    }

    if (image instanceof SVGImageElement) {
        return `${image.href.baseVal}|${width}|${height}`;
    }

    if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) {
        return `${width}|${height}`;
    }
}

function encodeImageSource(image: CanvasImageSource, width: number, height: number): string {
    const canvas = document.createElement('canvas');

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');

    if (ctx) {
        ctx.drawImage(image, 0, 0, width, height);
    }

    return canvas.toDataURL();
}

/**
 * Draws a `CanvasImageSource` onto an offscreen canvas at the given size and returns its data URL.
 *
 * The encode is a synchronous full PNG + base64 pass, so the result is memoized per source and
 * size — an unchanged image would otherwise be re-encoded on every frame it is drawn. Sources whose
 * pixels change without their identity changing (a canvas, an `OffscreenCanvas`, a video) are never
 * memoized and re-encode each call.
 *
 * @param image - The source to encode.
 * @param width - Width to draw the source at; defaults to its intrinsic width.
 * @param height - Height to draw the source at; defaults to its intrinsic height.
 * @returns The PNG data URL for the source at that size.
 */
export function canvasImageSourceToDataURL(image: CanvasImageSource, width?: number, height?: number): string {
    const [sourceWidth, sourceHeight] = getImageSourceSize(image);
    const imgWidth = width ?? sourceWidth;
    const imgHeight = height ?? sourceHeight;
    const cacheKey = getImageDataURLKey(image, imgWidth, imgHeight);

    if (!cacheKey) {
        return encodeImageSource(image, imgWidth, imgHeight);
    }

    const entries = IMAGE_DATA_URL_CACHE.get(image) ?? new Map<string, string>();
    const cached = entries.get(cacheKey);

    if (cached) {
        return cached;
    }

    const dataURL = encodeImageSource(image, imgWidth, imgHeight);

    entries.set(cacheKey, dataURL);
    IMAGE_DATA_URL_CACHE.set(image, entries);

    return dataURL;
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
