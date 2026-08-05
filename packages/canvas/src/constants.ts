import {
    degreesToRadians,
} from '@ripl/core';

import type {
    Gradient,
    GradientBounds,
    TextAlignment,
} from '@ripl/core';

type CanvasGradientFactory = (context: CanvasRenderingContext2D, gradient: Gradient, bounds: GradientBounds) => CanvasGradient;

/** Native `CanvasGradient` construction keyed by parsed gradient type. */
export const CANVAS_GRADIENT_FACTORIES: Record<string, CanvasGradientFactory> = {
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

/** Maximum number of gradients or patterns cached against a single context before the cache is dropped. */
export const PAINT_CACHE_LIMIT = 256;

/** Maximum number of path length and sample results cached before the cache is dropped. */
export const PATH_CACHE_LIMIT = 1024;

/** Where a glyph's anchor sits within its own advance, per the alignment `fillText` will draw it with. */
export const TEXT_PATH_ANCHORS: Record<TextAlignment, (advance: number) => number> = {
    start: () => 0,
    left: () => 0,
    center: advance => advance / 2,
    right: advance => advance,
    end: advance => advance,
};
