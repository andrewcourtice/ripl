import {
    isGradientString,
    isPatternString,
    parseColor,
} from '@ripl/core';

import type {
    BaseState,
    LineCap,
    LineJoin,
} from '@ripl/core';

import {
    numberClamp,
} from '@ripl/utilities';

import {
    PaintStyle,
    Skia,
    StrokeCap,
    StrokeJoin,
} from '@shopify/react-native-skia';

import type {
    SkPaint,
} from '@shopify/react-native-skia';

import {
    toSkiaColor,
} from './color';

import {
    toSkiaShader,
} from './shader';

import type {
    GradientBounds,
} from './shader';

const STROKE_CAP: Record<LineCap, StrokeCap> = {
    butt: StrokeCap.Butt,
    round: StrokeCap.Round,
    square: StrokeCap.Square,
};

const STROKE_JOIN: Record<LineJoin, StrokeJoin> = {
    bevel: StrokeJoin.Bevel,
    miter: StrokeJoin.Miter,
    round: StrokeJoin.Round,
};

// Skia expresses blur as a Gaussian sigma; a CSS shadow-blur radius maps to roughly half that.
const SHADOW_BLUR_TO_SIGMA = 0.5;

/** Whether the state carries a visible drop shadow (a non-transparent color plus a blur or offset). */
function hasShadow(state: BaseState): boolean {
    if (!state.shadowBlur && !state.shadowOffsetX && !state.shadowOffsetY) {
        return false;
    }

    const rgba = parseColor(state.shadowColor);

    return rgba ? rgba[3] > 0 : state.shadowColor !== 'transparent';
}

/**
 * Builds a Skia {@link SkPaint} from a Ripl drawing state for a single fill or stroke.
 *
 * Skia scopes matrix and clip with `save`/`restore` but not paint (paint is per-draw-call), so the
 * context keeps its drawing state in `currentState` and materializes a paint here on demand. Plain
 * colors, gradients, and `pattern(...)` fills are all resolved (via {@link toSkiaShader}), global
 * `opacity` is combined with the color's own alpha, and stroke geometry (`lineWidth`, cap, join,
 * miter, dash) and drop shadows are applied.
 *
 * @param state - The current drawing state to translate.
 * @param kind - Whether the paint fills or strokes.
 * @param bounds - The rectangle a gradient paint resolves its coordinates against.
 * @returns A configured Skia paint.
 */
export function buildPaint(state: BaseState, kind: 'fill' | 'stroke', bounds: GradientBounds): SkPaint {
    const paint = Skia.Paint();

    paint.setAntiAlias(true);

    const value = kind === 'fill' ? state.fill : state.stroke;
    const shader = isGradientString(value) || isPatternString(value)
        ? toSkiaShader(value, bounds)
        : null;
    const opacity = numberClamp(state.opacity ?? 1, 0, 1);

    if (shader) {
        paint.setShader(shader);

        if (opacity < 1) {
            paint.setAlphaf(opacity);
        }
    } else {
        paint.setColor(toSkiaColor(value));

        if (opacity < 1) {
            paint.setAlphaf(paint.getColor()[3] * opacity);
        }
    }

    if (kind === 'stroke') {
        paint.setStyle(PaintStyle.Stroke);
        paint.setStrokeWidth(state.lineWidth);
        paint.setStrokeCap(STROKE_CAP[state.lineCap]);
        paint.setStrokeJoin(STROKE_JOIN[state.lineJoin]);
        paint.setStrokeMiter(state.miterLimit);

        if (state.lineDash.length) {
            paint.setPathEffect(Skia.PathEffect.MakeDash(state.lineDash, state.lineDashOffset));
        }
    } else {
        paint.setStyle(PaintStyle.Fill);
    }

    if (hasShadow(state)) {
        const sigma = state.shadowBlur * SHADOW_BLUR_TO_SIGMA;

        paint.setImageFilter(Skia.ImageFilter.MakeDropShadow(
            state.shadowOffsetX,
            state.shadowOffsetY,
            sigma,
            sigma,
            toSkiaColor(state.shadowColor),
            null
        ));
    }

    return paint;
}
