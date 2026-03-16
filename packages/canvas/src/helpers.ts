import {
    ContextText,
    factory,
    getPathLength,
    isGradientString,
    measureText,
    parseColor,
    parseGradient,
    samplePathPoint,
    scaleContinuous,
    serialiseRGBA,
} from '@ripl/core';

import type {
    Box,
    FillRule,
    Gradient,
    Scale,
} from '@ripl/core';

import {
    CanvasPath,
} from './context';

/** Bounding rectangle used to resolve gradient coordinates. */
export type GradientBounds = {
    x: number;
    y: number;
    width: number;
    height: number;
};

type CanvasGradientFactory = (context: CanvasRenderingContext2D, gradient: Gradient, bounds: GradientBounds) => CanvasGradient;

const CANVAS_GRADIENT_FACTORIES: Record<string, CanvasGradientFactory> = {
    linear: (context, gradient, { x, y, width, height }) => {
        const angleRad = ((gradient as { angle: number }).angle - 90) * (Math.PI / 180);
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
        const startAngle = (gradient as { angle: number }).angle * (Math.PI / 180);

        return context.createConicGradient(startAngle, cx, cy);
    },
};

/** Converts a parsed gradient definition into a native `CanvasGradient` within the given bounds. */
export function toCanvasGradient(context: CanvasRenderingContext2D, gradient: Gradient, bounds: GradientBounds): CanvasGradient {
    const factory = CANVAS_GRADIENT_FACTORIES[gradient.type];
    const canvasGradient = factory(context, gradient, bounds);

    gradient.stops.forEach((stop) => {
        const offset = Math.min(Math.max(stop.offset ?? 0, 0), 1);
        const rgba = parseColor(stop.color);
        const color = rgba ? serialiseRGBA(...rgba) : stop.color;

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

/** Sets the fill style on a native canvas context, resolving gradient strings when applicable. */
export function setCanvasFill(ctx: CanvasRenderingContext2D, value: string, bounds: GradientBounds): void {
    if (isGradientString(value)) {
        const gradient = parseGradient(value);

        if (gradient) {
            ctx.fillStyle = toCanvasGradient(ctx, gradient, bounds);
            return;
        }
    }

    ctx.fillStyle = value;
}

/** Sets the stroke style on a native canvas context, resolving gradient strings when applicable. */
export function setCanvasStroke(ctx: CanvasRenderingContext2D, value: string, bounds: GradientBounds): void {
    if (isGradientString(value)) {
        const gradient = parseGradient(value);

        if (gradient) {
            ctx.strokeStyle = toCanvasGradient(ctx, gradient, bounds);
            return;
        }
    }

    ctx.strokeStyle = value;
}

/** Result of a canvas rescale operation containing the updated coordinate scales. */
export interface RescaleResult {
    scaleX: Scale<number, number>;
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
