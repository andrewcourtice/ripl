import {
    vec2Multiply,
} from '../math/vector2';

import type {
    Vector2,
} from '../math/vector2';

import type {
    ColorRGBA,
} from '@ripl/core';

import {
    numberClamp,
    stringUniqueId,
} from '@ripl/utilities';

/**
 * An image a {@link Texture} can be built from.
 *
 * Deliberately the set of things a 2D canvas can draw and WebGPU can copy from, so the same texture
 * works on either backend. Nothing here is a WebGPU type — the GPU resources a texture maps to live
 * entirely inside `@ripl/webgpu`.
 */
export type TextureSource =
    | ImageBitmap
    | HTMLImageElement
    | HTMLCanvasElement
    | HTMLVideoElement
    | OffscreenCanvas
    | ImageData;

/** How a texture coordinate outside the `0`–`1` range is resolved. */
export type TextureWrap = 'clamp' | 'repeat' | 'mirror';

/** How a texture is sampled between texels. */
export type TextureFilter = 'nearest' | 'linear';

/** Options for creating a {@link Texture}. */
export interface TextureOptions {
    /** How horizontal coordinates outside the unit range are resolved. Defaults to `'repeat'`. */
    wrapS?: TextureWrap;
    /** How vertical coordinates outside the unit range are resolved. Defaults to `'repeat'`. */
    wrapT?: TextureWrap;
    /** How the texture is sampled when magnified. Defaults to `'linear'`. */
    magFilter?: TextureFilter;
    /** How the texture is sampled when minified. Defaults to `'linear'`. */
    minFilter?: TextureFilter;
    /** Flips the image vertically, matching the convention most image assets are authored in. Defaults to `false`. */
    flipY?: boolean;
    /** How many times the texture repeats across the surface. Defaults to `[1, 1]`. */
    repeat?: Vector2;
    /** How far the texture is shifted across the surface. Defaults to `[0, 0]`. */
    offset?: Vector2;
}

/**
 * An image mapped onto a surface, usable by either backend.
 *
 * Mutating a texture's sampling properties bumps its {@link version}, which is how a backend knows
 * to re-upload or rebuild whatever it derived from it. Replacing the {@link source} does the same.
 */
export class Texture {

    /** Stable identity, used by backends to key whatever they cache against this texture. */
    public readonly id: string;

    private _source: TextureSource;
    private _wrapS: TextureWrap;
    private _wrapT: TextureWrap;
    private _magFilter: TextureFilter;
    private _minFilter: TextureFilter;
    private _flipY: boolean;
    private _repeat: Vector2;
    private _offset: Vector2;
    private _version = 0;

    /** The image this texture samples. */
    public get source() {
        return this._source;
    }

    public set source(value) {
        this._source = value;
        this.invalidate();
    }

    /** How horizontal coordinates outside the unit range are resolved. */
    public get wrapS() {
        return this._wrapS;
    }

    public set wrapS(value) {
        this._wrapS = value;
        this.invalidate();
    }

    /** How vertical coordinates outside the unit range are resolved. */
    public get wrapT() {
        return this._wrapT;
    }

    public set wrapT(value) {
        this._wrapT = value;
        this.invalidate();
    }

    /** How the texture is sampled when magnified. */
    public get magFilter() {
        return this._magFilter;
    }

    public set magFilter(value) {
        this._magFilter = value;
        this.invalidate();
    }

    /** How the texture is sampled when minified. */
    public get minFilter() {
        return this._minFilter;
    }

    public set minFilter(value) {
        this._minFilter = value;
        this.invalidate();
    }

    /** Whether the image is flipped vertically when sampled. */
    public get flipY() {
        return this._flipY;
    }

    public set flipY(value) {
        this._flipY = value;
        this.invalidate();
    }

    /** How many times the texture repeats across the surface. */
    public get repeat() {
        return this._repeat;
    }

    public set repeat(value) {
        this._repeat = value;
        this.invalidate();
    }

    /** How far the texture is shifted across the surface. */
    public get offset() {
        return this._offset;
    }

    public set offset(value) {
        this._offset = value;
        this.invalidate();
    }

    /** Increments on every change, so a backend can tell whether its cached upload is stale. */
    public get version() {
        return this._version;
    }

    /** The image's width in pixels, or `0` when it has not loaded. */
    public get width(): number {
        return textureSourceWidth(this._source);
    }

    /** The image's height in pixels, or `0` when it has not loaded. */
    public get height(): number {
        return textureSourceHeight(this._source);
    }

    constructor(source: TextureSource, options?: TextureOptions) {
        this.id = stringUniqueId();
        this._source = source;
        this._wrapS = options?.wrapS ?? 'repeat';
        this._wrapT = options?.wrapT ?? 'repeat';
        this._magFilter = options?.magFilter ?? 'linear';
        this._minFilter = options?.minFilter ?? 'linear';
        this._flipY = options?.flipY ?? false;
        this._repeat = options?.repeat ?? [1, 1];
        this._offset = options?.offset ?? [0, 0];
    }

    /** Marks the texture as changed, so backends re-upload it. Call after mutating the source in place. */
    public invalidate(): void {
        this._version++;
    }

}

/**
 * Creates a {@link Texture} from an image source.
 *
 * @param source - The image to sample.
 * @param options - Sampling and transform options.
 * @returns The texture.
 * @example
 * const canvas = new OffscreenCanvas(64, 64);
 * // …draw into canvas…
 * const texture = createTexture(canvas, { repeat: [4, 4] });
 */
export function createTexture(source: TextureSource, options?: TextureOptions): Texture {
    return new Texture(source, options);
}

/**
 * Loads an image from a URL and wraps it in a {@link Texture}.
 *
 * @param url - The image URL.
 * @param options - Sampling and transform options.
 * @returns A promise resolving once the image has decoded.
 */
export function loadTexture(url: string, options?: TextureOptions): Promise<Texture> {
    return new Promise((resolve, reject) => {
        const image = new Image();

        image.crossOrigin = 'anonymous';
        image.onload = () => resolve(new Texture(image, options));
        image.onerror = () => reject(new Error(`Failed to load texture from "${url}".`));
        image.src = url;
    });
}

/** Type guard that checks whether a value is a {@link Texture}. */
export function typeIsTexture(value: unknown): value is Texture {
    return value instanceof Texture;
}

/** Returns an image source's width in pixels, or `0` when it has no intrinsic size yet. */
export function textureSourceWidth(source: TextureSource): number {
    if ('videoWidth' in source) {
        return source.videoWidth;
    }

    if ('naturalWidth' in source) {
        return source.naturalWidth || source.width;
    }

    return source.width;
}

/** Returns an image source's height in pixels, or `0` when it has no intrinsic size yet. */
export function textureSourceHeight(source: TextureSource): number {
    if ('videoHeight' in source) {
        return source.videoHeight;
    }

    if ('naturalHeight' in source) {
        return source.naturalHeight || source.height;
    }

    return source.height;
}

/**
 * Applies a texture's repeat and offset to a raw surface coordinate.
 *
 * @param texture - The texture whose transform to apply.
 * @param uv - The surface coordinate.
 * @returns The transformed coordinate, before wrapping.
 */
export function textureTransformUV(texture: Texture, uv: Vector2): Vector2 {
    const scaled = vec2Multiply(uv, texture.repeat);

    return [scaled[0] + texture.offset[0], scaled[1] + texture.offset[1]];
}

/**
 * Resolves a coordinate outside the unit range according to a wrap mode.
 *
 * @param value - The coordinate.
 * @param wrap - The wrap mode.
 * @returns The coordinate within `0`–`1`.
 */
export function textureWrapCoordinate(value: number, wrap: TextureWrap): number {
    if (wrap === 'clamp') {
        return numberClamp(value, 0, 1);
    }

    const wrapped = value - Math.floor(value);

    if (wrap === 'repeat') {
        return wrapped;
    }

    // Mirrored repeat flips every other tile, so the seam between tiles matches rather than jumps.
    return Math.floor(value) % 2 === 0 ? wrapped : 1 - wrapped;
}

// A CPU sample needs pixel access, which only a 2D canvas gives; the result is cached per texture
// version because reading it back per face would be ruinous.
const pixelCache = new WeakMap<Texture, {
    version: number;
    width: number;
    height: number;
    data: Uint8ClampedArray;
}>();

function getPixels(texture: Texture) {
    const cached = pixelCache.get(texture);

    if (cached && cached.version === texture.version) {
        return cached;
    }

    const width = texture.width;
    const height = texture.height;

    if (width <= 0 || height <= 0) {
        return undefined;
    }

    const source = texture.source;
    let data: Uint8ClampedArray;

    if (source instanceof ImageData) {
        data = source.data;
    } else {
        const canvas = typeof OffscreenCanvas === 'function'
            ? new OffscreenCanvas(width, height)
            : Object.assign(document.createElement('canvas'), {
                width,
                height,
            });
        const context = canvas.getContext('2d') as CanvasRenderingContext2D | null;

        if (!context) {
            return undefined;
        }

        context.drawImage(source as CanvasImageSource, 0, 0, width, height);
        data = context.getImageData(0, 0, width, height).data;
    }

    const entry = {
        version: texture.version,
        width,
        height,
        data,
    };

    pixelCache.set(texture, entry);

    return entry;
}

/**
 * Samples a texture on the CPU, honouring its wrap modes, filter, flip and transform.
 *
 * Used by the Canvas painter's texture mapping and by raycast queries. The pixel data is read back
 * once per texture version and cached, because reading it per sample would be ruinous.
 *
 * @param texture - The texture to sample.
 * @param coordU - The horizontal surface coordinate.
 * @param coordV - The vertical surface coordinate.
 * @returns The sampled colour in `0`–`255` channels, or `undefined` when the image has no pixels.
 */
export function sampleTexture(texture: Texture, coordU: number, coordV: number): ColorRGBA | undefined {
    const pixels = getPixels(texture);

    if (!pixels) {
        return undefined;
    }

    const [tu, tv] = textureTransformUV(texture, [coordU, coordV]);
    const wrappedU = textureWrapCoordinate(tu, texture.wrapS);
    const wrappedV = textureWrapCoordinate(texture.flipY ? 1 - tv : tv, texture.wrapT);

    const {
        width,
        height,
        data,
    } = pixels;

    if (texture.magFilter === 'nearest') {
        return readTexel(
            data,
            width,
            height,
            Math.min(Math.floor(wrappedU * width), width - 1),
            Math.min(Math.floor(wrappedV * height), height - 1)
        );
    }

    const px = wrappedU * width - 0.5;
    const py = wrappedV * height - 0.5;
    const x0 = Math.floor(px);
    const y0 = Math.floor(py);
    const fx = px - x0;
    const fy = py - y0;

    const c00 = readTexel(data, width, height, clampIndex(x0, width), clampIndex(y0, height));
    const c10 = readTexel(data, width, height, clampIndex(x0 + 1, width), clampIndex(y0, height));
    const c01 = readTexel(data, width, height, clampIndex(x0, width), clampIndex(y0 + 1, height));
    const c11 = readTexel(data, width, height, clampIndex(x0 + 1, width), clampIndex(y0 + 1, height));

    return [
        bilinear(c00[0], c10[0], c01[0], c11[0], fx, fy),
        bilinear(c00[1], c10[1], c01[1], c11[1], fx, fy),
        bilinear(c00[2], c10[2], c01[2], c11[2], fx, fy),
        bilinear(c00[3], c10[3], c01[3], c11[3], fx, fy),
    ];
}

function clampIndex(value: number, extent: number): number {
    return numberClamp(value, 0, extent - 1);
}

function readTexel(data: Uint8ClampedArray, width: number, height: number, x: number, y: number): ColorRGBA {
    const offset = (clampIndex(y, height) * width + clampIndex(x, width)) * 4;

    return [data[offset], data[offset + 1], data[offset + 2], data[offset + 3] / 255];
}

function bilinear(c00: number, c10: number, c01: number, c11: number, fx: number, fy: number): number {
    return (c00 * (1 - fx) + c10 * fx) * (1 - fy) + (c01 * (1 - fx) + c11 * fx) * fy;
}
