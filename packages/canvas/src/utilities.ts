import {
    ContextText,
    degreesToRadians,
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
    Pattern,
    Scale,
} from '@ripl/core';

import {
    createLRUCache,
    numberClamp,
} from '@ripl/utilities';

import type {
    LRUCache,
} from '@ripl/utilities';

import type {
    CanvasPath,
} from './path';

type CanvasGradientFactory = (context: CanvasRenderingContext2D, gradient: Gradient, bounds: GradientBounds) => CanvasGradient;

const CANVAS_GRADIENT_FACTORIES: Record<string, CanvasGradientFactory> = {
    linear: (context, gradient, { x, y, width, height }) => {
        const angleRad = degreesToRadians((gradient as { angle: number }).angle - 90);
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        const halfW = width / 2;
        const halfH = height / 2;
        const length = Math.abs(halfW * cos) + Math.abs(halfH * sin);

        return context.createLinearGradient(
            x + halfW - cos * length,
            y + halfH - sin * length,
            x + halfW + cos * length,
            y + halfH + sin * length
        );
    },
    radial: (context, gradient, { x, y, width, height }) => {
        const cx = x + ((gradient as { position: [number, number] }).position[0] / 100) * width;
        const cy = y + ((gradient as { position: [number, number] }).position[1] / 100) * height;
        const radius = Math.max(width, height) / 2;

        return context.createRadialGradient(cx, cy, 0, cx, cy, radius);
    },
    conic: (context, gradient, { x, y, width, height }) => {
        const cx = x + ((gradient as { position: [number, number] }).position[0] / 100) * width;
        const cy = y + ((gradient as { position: [number, number] }).position[1] / 100) * height;
        const startAngle = degreesToRadians((gradient as { angle: number }).angle);

        return context.createConicGradient(startAngle, cx, cy);
    },
};

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

const PAINT_CACHE_LIMIT = 64;
const TILE_CACHE_LIMIT = 64;

// A tile is plain pixels, independent of position and of the surface it ends up on, so one serves every context.
const patternTileCache = createLRUCache<string, HTMLCanvasElement | null>(TILE_CACHE_LIMIT);

// `CanvasGradient`/`CanvasPattern` belong to the surface that minted them, so each context gets its own cache.
const gradientCaches = new WeakMap<CanvasRenderingContext2D, LRUCache<string, CanvasGradient>>();
const patternCaches = new WeakMap<CanvasRenderingContext2D, LRUCache<string, CanvasPattern | null>>();

function getPaintCache<TValue>(caches: WeakMap<CanvasRenderingContext2D, LRUCache<string, TValue>>, ctx: CanvasRenderingContext2D): LRUCache<string, TValue> {
    const existing = caches.get(ctx);

    if (existing) {
        return existing;
    }

    const cache = createLRUCache<string, TValue>(PAINT_CACHE_LIMIT);

    caches.set(ctx, cache);

    return cache;
}

// Rounded, so sub-pixel drift on an animating element doesn't miss the cache on every frame.
function getGradientCacheKey(value: string, { x, y, width, height }: GradientBounds): string {
    return `${value}|${x.toFixed(2)}|${y.toFixed(2)}|${width.toFixed(2)}|${height.toFixed(2)}`;
}

function renderPatternTile(pattern: Pattern): HTMLCanvasElement | null {
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

    return tile;
}

function getPatternTile(value: string): HTMLCanvasElement | null {
    if (patternTileCache.has(value)) {
        return patternTileCache.get(value)!;
    }

    const pattern = parsePatternCached(value);
    const tile = pattern && renderPatternTile(pattern);

    patternTileCache.set(value, tile);

    return tile;
}

/**
 * Materializes a `pattern(...)` paint string as a repeating `CanvasPattern`, drawing the shared
 * tile geometry into an offscreen canvas. The tile is cached across every context; the resulting
 * pattern (including parse failures) is cached per context, since a `CanvasPattern` belongs to the
 * surface that created it.
 *
 * @param ctx - The context the pattern will paint into.
 * @param value - The `pattern(...)` paint string.
 * @returns The repeating pattern, or `null` when the string or environment can't produce one.
 */
export function toCanvasPattern(ctx: CanvasRenderingContext2D, value: string): CanvasPattern | null {
    const cache = getPaintCache(patternCaches, ctx);

    if (cache.has(value)) {
        return cache.get(value)!;
    }

    const tile = getPatternTile(value);
    const canvasPattern = tile && ctx.createPattern(tile, 'repeat');

    cache.set(value, canvasPattern);

    return canvasPattern;
}

/**
 * Resolves a CSS gradient string to a `CanvasGradient` for the given bounds, caching the result per
 * context.
 *
 * The fill and stroke setters run per element per frame, so a completely static gradient would
 * otherwise be rebuilt (and every stop color re-parsed) on every one of them. Bounds are part of the
 * key because, unlike a pattern tile, a gradient's coordinates are resolved against the element it
 * paints.
 *
 * @param ctx - The context the gradient will paint into.
 * @param value - The CSS gradient string.
 * @param bounds - The rectangle the gradient's coordinates resolve against.
 * @returns The gradient, or `undefined` when the string is not a recognized gradient.
 */
export function resolveCanvasGradient(ctx: CanvasRenderingContext2D, value: string, bounds: GradientBounds): CanvasGradient | undefined {
    const cache = getPaintCache(gradientCaches, ctx);
    const key = getGradientCacheKey(value, bounds);
    const cached = cache.get(key);

    if (cached) {
        return cached;
    }

    const gradient = parseGradientCached(value);

    if (!gradient) {
        return undefined;
    }

    const canvasGradient = toCanvasGradient(ctx, gradient, bounds);

    cache.set(key, canvasGradient);

    return canvasGradient;
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
        const gradient = resolveCanvasGradient(ctx, value, bounds);

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
        const gradient = resolveCanvasGradient(ctx, value, bounds);

        if (gradient) {
            ctx.strokeStyle = gradient;
            return;
        }
    }

    ctx.strokeStyle = value;
}

/** Result of a canvas rescale operation containing the updated coordinate scales. */
export interface RescaleResult {
    /** Scale mapping logical x coordinates to device pixels. */
    scaleX: Scale<number, number>;
    /** Scale mapping logical y coordinates to device pixels. */
    scaleY: Scale<number, number>;
}

/** Rescales a canvas element for the device pixel ratio and returns updated coordinate scales. Returns `undefined` if no rescale was needed. */
export function rescaleCanvas(
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number
): RescaleResult | undefined {
    const dpr = factory.devicePixelRatio;
    const scaledWidth = Math.floor(width * dpr);
    const scaledHeight = Math.floor(height * dpr);

    if (scaledWidth === canvas.width && scaledHeight === canvas.height) {
        return undefined;
    }

    canvas.width = scaledWidth;
    canvas.height = scaledHeight;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    return {
        scaleX: scaleContinuous([0, width], [0, scaledWidth]),
        scaleY: scaleContinuous([0, height], [0, scaledHeight]),
    };
}

/** Renders text character-by-character along a path using fill or stroke. */
export function renderTextAlongPath(ctx: CanvasRenderingContext2D, element: ContextText, method: 'fill' | 'stroke'): void {
    const pathData = element.pathData!;
    const totalLength = getPathLength(pathData);
    let distance = (element.startOffset ?? 0) * totalLength;

    for (const char of element.content) {
        const charWidth = ctx.measureText(char).width;
        const midDistance = distance + charWidth / 2;

        if (midDistance > totalLength) {
            break;
        }

        const { x, y, angle } = samplePathPoint(pathData, midDistance);

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);

        if (method === 'fill') {
            ctx.fillText(char, 0, 0);
        } else {
            ctx.strokeText(char, 0, 0);
        }

        ctx.restore();
        distance += charWidth;
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

/** Draws an image onto a canvas context with optional width and height. */
export function canvasDrawImage(ctx: CanvasRenderingContext2D, image: CanvasImageSource, x: number, y: number, width?: number, height?: number): void {
    if (width && height) {
        return ctx.drawImage(image, x, y, width, height);
    }

    return ctx.drawImage(image, x, y);
}

/** Measures text dimensions using an optional font override. */
export function canvasMeasureText(ctx: CanvasRenderingContext2D, text: string, font?: string): TextMetrics {
    return measureText(text, {
        context: ctx,
        font: font ?? ctx.font,
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
