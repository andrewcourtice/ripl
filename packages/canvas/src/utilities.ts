import {
    ContextText,
    factory,
    getPathLength,
    getPatternTileGeometry,
    isGradientString,
    isPatternString,
    measureText,
    parseColor,
    parseGradientCached,
    parsePatternCached,
    samplePathPoint,
    scaleContinuous,
    serializeRGBA,
} from '@ripl/core';

import type {
    FillRule,
    Gradient,
    GradientBounds,
    PathPoint,
    Scale,
} from '@ripl/core';

import {
    numberClamp,
    typeIsNil,
    typeIsNumber,
} from '@ripl/utilities';

import {
    CANVAS_GRADIENT_FACTORIES,
    PAINT_CACHE_LIMIT,
    PATH_CACHE_LIMIT,
    TEXT_PATH_ANCHORS,
} from './constants';

import type {
    CanvasPath,
} from './path';

/** Anything with an intrinsic pixel size `drawImage` can fall back to, across the `CanvasImageSource` union. */
interface IntrinsicallySized {
    naturalWidth?: number;
    naturalHeight?: number;
    videoWidth?: number;
    videoHeight?: number;
    codedWidth?: number;
    codedHeight?: number;
    width?: unknown;
    height?: unknown;
}

/** Converts a parsed gradient definition into a native `CanvasGradient` within the given bounds. */
export function toCanvasGradient(context: CanvasRenderingContext2D, gradient: Gradient, bounds: GradientBounds): CanvasGradient {
    const factory = CANVAS_GRADIENT_FACTORIES[gradient.type];
    const canvasGradient = factory(context, gradient, bounds);

    gradient.stops.forEach((stop) => {
        const offset = numberClamp(stop.offset ?? 0, 0, 1);
        const rgba = parseColor(stop.color);
        const color = rgba ? serializeRGBA(...rgba) : stop.color;

        canvasGradient.addColorStop(offset, color);
    });

    return canvasGradient;
}

// Paint is cached per context: a `CanvasPattern`/`CanvasGradient` outlives the context that built it,
// so a module-global cache handed a destroyed context's objects — and their tiles — to the next one.
const patternCaches = new WeakMap<CanvasRenderingContext2D, Map<string, CanvasPattern | null>>();
const gradientCaches = new WeakMap<CanvasRenderingContext2D, Map<string, CanvasGradient>>();

// Path geometry is a pure function of the `d` string, and text on a path re-samples the same
// distances every frame; without this each glyph re-parses the whole path once per frame.
const pathLengthCache = new Map<string, number>();
const pathPointCache = new Map<string, PathPoint>();

/** Reads through a bounded cache, dropping the whole map on overflow rather than tracking recency. */
function resolveCached<TValue>(cache: Map<string, TValue>, limit: number, key: string, produce: () => TValue): TValue {
    const cached = cache.get(key);

    if (cached !== undefined) {
        return cached;
    }

    if (cache.size >= limit) {
        cache.clear();
    }

    const value = produce();

    cache.set(key, value);

    return value;
}

function getPaintCache<TValue>(caches: WeakMap<CanvasRenderingContext2D, Map<string, TValue>>, ctx: CanvasRenderingContext2D): Map<string, TValue> {
    const cache = caches.get(ctx) || new Map<string, TValue>();

    caches.set(ctx, cache);

    return cache;
}

function createCanvasPattern(ctx: CanvasRenderingContext2D, value: string): CanvasPattern | null {
    const pattern = parsePatternCached(value);

    if (!pattern) {
        return null;
    }

    const geometry = getPatternTileGeometry(pattern);
    const tile = document.createElement('canvas');

    tile.width = geometry.size;
    tile.height = geometry.size;

    const tileContext = tile.getContext('2d');

    if (!tileContext) {
        return null;
    }

    if (pattern.background !== 'transparent') {
        tileContext.fillStyle = pattern.background;
        tileContext.fillRect(0, 0, geometry.size, geometry.size);
    }

    geometry.shapes.forEach(shape => {
        if (shape.kind === 'line') {
            tileContext.strokeStyle = pattern.foreground;
            tileContext.lineWidth = shape.width;
            tileContext.beginPath();
            tileContext.moveTo(shape.x1, shape.y1);
            tileContext.lineTo(shape.x2, shape.y2);
            tileContext.stroke();
            return;
        }

        tileContext.fillStyle = pattern.foreground;
        tileContext.beginPath();
        tileContext.arc(shape.cx, shape.cy, shape.radius, 0, Math.PI * 2);
        tileContext.fill();
    });

    return ctx.createPattern(tile, 'repeat');
}

function toCanvasGradientCached(ctx: CanvasRenderingContext2D, value: string, bounds: GradientBounds): CanvasGradient | null {
    const gradient = parseGradientCached(value);

    if (!gradient) {
        return null;
    }

    const key = `${value}|${bounds.x},${bounds.y},${bounds.width},${bounds.height}`;

    return resolveCached(getPaintCache(gradientCaches, ctx), PAINT_CACHE_LIMIT, key, () => toCanvasGradient(ctx, gradient, bounds));
}

function getPathLengthCached(pathData: string): number {
    return resolveCached(pathLengthCache, PATH_CACHE_LIMIT, pathData, () => getPathLength(pathData));
}

function samplePathPointCached(pathData: string, distance: number): PathPoint {
    return resolveCached(pathPointCache, PATH_CACHE_LIMIT, `${pathData}|${distance}`, () => samplePathPoint(pathData, distance));
}

/**
 * Materializes a `pattern(...)` paint string as a repeating `CanvasPattern`, drawing the shared
 * tile geometry into an offscreen canvas. Results (including parse failures) are cached per
 * context and string, and released by {@link releaseCanvasPaintCache}.
 *
 * @param ctx - The context the pattern will paint into.
 * @param value - The `pattern(...)` paint string.
 * @returns The repeating pattern, or `null` when the string or environment can't produce one.
 */
export function toCanvasPattern(ctx: CanvasRenderingContext2D, value: string): CanvasPattern | null {
    return resolveCached(getPaintCache(patternCaches, ctx), PAINT_CACHE_LIMIT, value, () => createCanvasPattern(ctx, value));
}

/**
 * Drops every `CanvasGradient` and `CanvasPattern` cached against a context, together with the
 * offscreen tile canvases the patterns hold. Call it when the context is torn down.
 *
 * @param ctx - The native context whose cached paint is released.
 */
export function releaseCanvasPaintCache(ctx: CanvasRenderingContext2D): void {
    patternCaches.delete(ctx);
    gradientCaches.delete(ctx);
}

/** Sets the fill style on a native canvas context, resolving gradient and pattern strings when applicable. */
export function setCanvasFill(ctx: CanvasRenderingContext2D, value: string, bounds: GradientBounds): void {
    if (isPatternString(value)) {
        const pattern = toCanvasPattern(ctx, value);

        if (pattern) {
            ctx.fillStyle = pattern;
            return;
        }
    }

    if (isGradientString(value)) {
        const gradient = toCanvasGradientCached(ctx, value, bounds);

        if (gradient) {
            ctx.fillStyle = gradient;
            return;
        }
    }

    ctx.fillStyle = value;
}

/** Sets the stroke style on a native canvas context, resolving gradient and pattern strings when applicable. */
export function setCanvasStroke(ctx: CanvasRenderingContext2D, value: string, bounds: GradientBounds): void {
    if (isPatternString(value)) {
        const pattern = toCanvasPattern(ctx, value);

        if (pattern) {
            ctx.strokeStyle = pattern;
            return;
        }
    }

    if (isGradientString(value)) {
        const gradient = toCanvasGradientCached(ctx, value, bounds);

        if (gradient) {
            ctx.strokeStyle = gradient;
            return;
        }
    }

    ctx.strokeStyle = value;
}

/** Result of a canvas rescale operation containing the updated coordinate scales and backing-store size. */
export interface RescaleResult {
    /** Scale mapping logical x coordinates to device pixels. */
    scaleX: Scale<number, number>;
    /** Scale mapping logical y coordinates to device pixels. */
    scaleY: Scale<number, number>;
    /** Width of the backing store, in device pixels, floored to a whole pixel. */
    scaledWidth: number;
    /** Height of the backing store, in device pixels, floored to a whole pixel. */
    scaledHeight: number;
}

/**
 * Sizes a canvas element's backing store for the device pixel ratio and returns the coordinate
 * scales mapping logical pixels onto it.
 *
 * The scales are returned whether or not the backing store needed resizing: they describe the
 * requested logical size, which can change without the scaled integer dimensions changing.
 *
 * @param canvas - The canvas whose backing store is sized.
 * @param ctx - The canvas's 2D context, whose transform is reset when the backing store changes.
 * @param width - Requested width, in logical pixels.
 * @param height - Requested height, in logical pixels.
 * @returns The updated coordinate scales.
 */
export function rescaleCanvas(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
): RescaleResult {
    const dpr = factory.devicePixelRatio;
    const scaledWidth = Math.floor(width * dpr);
    const scaledHeight = Math.floor(height * dpr);

    // Assigning either dimension clears the surface and resets its transform, so only write on a change.
    if (scaledWidth !== canvas.width || scaledHeight !== canvas.height) {
        canvas.width = scaledWidth;
        canvas.height = scaledHeight;

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // The scales describe the transform drawing actually uses (an exact `dpr`), not the floored store.
    return {
        scaledWidth,
        scaledHeight,
        scaleX: scaleContinuous([0, width], [0, width * dpr]),
        scaleY: scaleContinuous([0, height], [0, height * dpr]),
    };
}

/**
 * Renders text character-by-character along a path using fill or stroke.
 *
 * Each glyph is drawn at the origin of a frame translated to the path, so it is placed at the
 * point its own `textAlign` anchors it to — the mid-point only for `center`. Glyphs are laid out
 * from `startOffset` (clamped into the path) up to `maxWidth` of advance, and one whose mid-point
 * falls past the end of the run is dropped, as SVG `<textPath>` does.
 *
 * @param ctx - The native context to draw into.
 * @param element - The text element, whose `pathData` describes the path to lay the text along.
 * @param method - Whether to fill or stroke each glyph.
 */
export function renderTextAlongPath(ctx: CanvasRenderingContext2D, element: ContextText, method: 'fill' | 'stroke'): void {
    const pathData = element.pathData!;
    const totalLength = getPathLengthCached(pathData);
    const anchorOffset = TEXT_PATH_ANCHORS[ctx.textAlign] || TEXT_PATH_ANCHORS.start;
    const startDistance = numberClamp(element.startOffset ?? 0, 0, 1) * totalLength;
    const limit = Math.min(totalLength, startDistance + (element.maxWidth ?? Infinity));

    let distance = startDistance;

    for (const char of element.content) {
        const advance = ctx.measureText(char).width;

        // Advance only grows, so the first glyph past the end of the run is also the last that fits.
        if (distance + advance / 2 > limit) {
            break;
        }

        const { x, y, angle } = samplePathPointCached(pathData, distance + anchorOffset(advance));

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        if (method === 'fill') {
            ctx.fillText(char, 0, 0);
        } else {
            ctx.strokeText(char, 0, 0);
        }

        ctx.restore();
        distance += advance;
    }
}

/** Fills a canvas path or text element, dispatching text-along-path when applicable. */
export function applyCanvasFill(ctx: CanvasRenderingContext2D, element: CanvasPath | ContextText, fillRule?: FillRule): void {
    if (element instanceof ContextText) {
        if (element.pathData) {
            return renderTextAlongPath(ctx, element, 'fill');
        }

        return ctx.fillText(element.content, element.x, element.y, element.maxWidth);
    }

    return ctx.fill(element.ref, fillRule);
}

/** Strokes a canvas path or text element, dispatching text-along-path when applicable. */
export function applyCanvasStroke(ctx: CanvasRenderingContext2D, element: CanvasPath | ContextText): void {
    if (element instanceof ContextText) {
        if (element.pathData) {
            return renderTextAlongPath(ctx, element, 'stroke');
        }

        return ctx.strokeText(element.content, element.x, element.y, element.maxWidth);
    }

    return ctx.stroke(element.ref);
}

function getIntrinsicSize(image: CanvasImageSource): [number, number] {
    const source = image as IntrinsicallySized;
    const width = typeIsNumber(source.width) ? source.width : 0;
    const height = typeIsNumber(source.height) ? source.height : 0;

    return [
        source.naturalWidth ?? source.videoWidth ?? source.codedWidth ?? width,
        source.naturalHeight ?? source.videoHeight ?? source.codedHeight ?? height,
    ];
}

/**
 * Draws an image onto a canvas context, sizing it to the given width and height.
 *
 * A dimension given on its own is honoured and the other taken from the image's intrinsic size —
 * the destination-rectangle form of `drawImage` needs both. Supplying neither draws at intrinsic
 * size; supplying `0` draws nothing, which is what a zero-sized element asks for.
 *
 * @param ctx - The native context to draw into.
 * @param image - The image source to draw.
 * @param x - Destination x coordinate.
 * @param y - Destination y coordinate.
 * @param width - Destination width, defaulting to the image's intrinsic width.
 * @param height - Destination height, defaulting to the image's intrinsic height.
 */
export function canvasDrawImage(ctx: CanvasRenderingContext2D, image: CanvasImageSource, x: number, y: number, width?: number, height?: number): void {
    if (typeIsNil(width) && typeIsNil(height)) {
        return ctx.drawImage(image, x, y);
    }

    const [
        intrinsicWidth,
        intrinsicHeight,
    ] = getIntrinsicSize(image);

    return ctx.drawImage(image, x, y, width ?? intrinsicWidth, height ?? intrinsicHeight);
}

/** Measures text dimensions using the context's alignment and baseline, and an optional font override. */
export function canvasMeasureText(ctx: CanvasRenderingContext2D, text: string, font?: string): TextMetrics {
    return measureText(text, {
        font: font ?? ctx.font,
        textAlign: ctx.textAlign,
        textBaseline: ctx.textBaseline,
    });
}

/** Tests whether a point is inside the filled region of a canvas path. */
export function canvasIsPointInPath(ctx: CanvasRenderingContext2D, path: CanvasPath, x: number, y: number, fillRule?: FillRule): boolean {
    return ctx.isPointInPath(path.ref, x, y, fillRule);
}

/** Tests whether a point is on the stroked outline of a canvas path. */
export function canvasIsPointInStroke(ctx: CanvasRenderingContext2D, path: CanvasPath, x: number, y: number): boolean {
    return ctx.isPointInStroke(path.ref, x, y);
}
