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
    Scale,
    TextAlignment,
} from '@ripl/core';

import {
    numberClamp,
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

// Pattern tiles are position-independent, so one `CanvasPattern` per string serves every element and frame.
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

    const pattern = parsePatternCached(value);

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
        const gradient = parseGradientCached(value);

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
        const gradient = parseGradientCached(value);

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
        scaleX: scaleContinuous([0, width], [0, width * dpr]),
        scaleY: scaleContinuous([0, height], [0, height * dpr]),
    };
}

// Where a glyph's anchor sits within its own advance, per the alignment `fillText` will draw it with.
const TEXT_PATH_ANCHORS: Record<TextAlignment, (advance: number) => number> = {
    start: () => 0,
    left: () => 0,
    center: advance => advance / 2,
    right: advance => advance,
    end: advance => advance,
};

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
    const totalLength = getPathLength(pathData);
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

        const { x, y, angle } = samplePathPoint(pathData, distance + anchorOffset(advance));

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

/** Draws an image onto a canvas context with optional width and height. */
export function canvasDrawImage(ctx: CanvasRenderingContext2D, image: CanvasImageSource, x: number, y: number, width?: number, height?: number): void {
    if (width && height) {
        return ctx.drawImage(image, x, y, width, height);
    }

    return ctx.drawImage(image, x, y);
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
