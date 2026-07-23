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
    parseGradient,
    parsePattern,
    samplePathPoint,
    scaleContinuous,
    serializeRGBA,
} from '@ripl/core';

import type {
    Box,
    FillRule,
    Gradient,
    Scale,
} from '@ripl/core';

import {
    numberClamp,
} from '@ripl/utilities';

import type {
    CanvasPath,
} from './path';

/** Bounding rectangle used to resolve gradient coordinates. */
export type GradientBounds = {
    /** X coordinate of the rectangle's top-left corner. */
    x: number;
    /** Y coordinate of the rectangle's top-left corner. */
    y: number;
    /** Width of the bounding rectangle, in pixels. */
    width: number;
    /** Height of the bounding rectangle, in pixels. */
    height: number;
};

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

/** Resolves gradient bounds from a bounding box or falls back to context dimensions. */
export function getCanvasGradientBounds(box: Box | undefined, width: number, height: number): GradientBounds {
    if (box && box.width > 0 && box.height > 0) {
        return {
            x: box.left,
            y: box.top,
            width: box.width,
            height: box.height,
        };
    }

    return {
        x: 0,
        y: 0,
        width,
        height,
    };
}

// Parsing a CSS gradient string is comparatively expensive and fill/stroke are re-applied for the
// same gradient across frames (and across many elements within a frame), so memoize by string. The
// cache is bounded to avoid unbounded growth when the string varies every frame (animated gradients).
const GRADIENT_CACHE_LIMIT = 256;
const gradientCache = new Map<string, Gradient | undefined>();

/** Parses a CSS gradient string, memoizing the result within a bounded cache. */
function parseGradientMemoized(value: string): Gradient | undefined {
    if (gradientCache.has(value)) {
        return gradientCache.get(value);
    }

    if (gradientCache.size >= GRADIENT_CACHE_LIMIT) {
        gradientCache.clear();
    }

    const gradient = parseGradient(value);
    gradientCache.set(value, gradient);

    return gradient;
}

// Pattern tiles are position-independent, so one materialized CanvasPattern per serialized
// pattern string serves every element and frame (null caches invalid strings). The cache is
// bounded because a transition between two patterns produces a fresh string every frame.
const PATTERN_CACHE_LIMIT = 256;
const patternCache = new Map<string, CanvasPattern | null>();

/**
 * Materializes a `pattern(...)` paint string as a repeating `CanvasPattern`, drawing the shared
 * tile geometry into an offscreen canvas. Results (including parse failures) are cached per
 * string.
 *
 * @param ctx - The context the pattern will paint into.
 * @param value - The `pattern(...)` paint string.
 * @returns The repeating pattern, or `null` when the string or environment can't produce one.
 */
export function toCanvasPattern(ctx: CanvasRenderingContext2D, value: string): CanvasPattern | null {
    const cached = patternCache.get(value);

    if (cached !== undefined) {
        return cached;
    }

    if (patternCache.size >= PATTERN_CACHE_LIMIT) {
        patternCache.clear();
    }

    const pattern = parsePattern(value);

    if (!pattern) {
        patternCache.set(value, null);
        return null;
    }

    const geometry = getPatternTileGeometry(pattern);
    const tile = document.createElement('canvas');

    tile.width = geometry.size;
    tile.height = geometry.size;

    const tileContext = tile.getContext('2d');

    if (!tileContext) {
        patternCache.set(value, null);
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

    const canvasPattern = ctx.createPattern(tile, 'repeat');

    patternCache.set(value, canvasPattern);

    return canvasPattern;
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
        const gradient = parseGradientMemoized(value);

        if (gradient) {
            ctx.fillStyle = toCanvasGradient(ctx, gradient, bounds);
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
        const gradient = parseGradientMemoized(value);

        if (gradient) {
            ctx.strokeStyle = toCanvasGradient(ctx, gradient, bounds);
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
