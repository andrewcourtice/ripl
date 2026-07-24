import {
    degreesToRadians,
    getPatternTileGeometry,
    isGradientString,
    isPatternString,
    parseGradient,
    parsePattern,
} from '@ripl/core';

import type {
    Box,
    ConicGradient,
    Gradient,
    GradientColorStop,
    GradientType,
    LinearGradient,
    Pattern,
    RadialGradient,
} from '@ripl/core';

import {
    numberClamp,
} from '@ripl/utilities';

import {
    FilterMode,
    MipmapMode,
    PaintStyle,
    Skia,
    TileMode,
} from '@shopify/react-native-skia';

import type {
    SkColor,
    SkShader,
} from '@shopify/react-native-skia';

import {
    toSkiaColor,
} from './color';

/** A rectangle, in surface pixels, that a gradient's coordinates are resolved against. */
export interface GradientBounds {
    /** X coordinate of the rectangle's top-left corner. */
    x: number;
    /** Y coordinate of the rectangle's top-left corner. */
    y: number;
    /** Width of the bounding rectangle. */
    width: number;
    /** Height of the bounding rectangle. */
    height: number;
}

/**
 * Resolves the {@link GradientBounds} a gradient paints within: the element's local bounding box when
 * it has a positive area, otherwise the whole surface.
 *
 * @param box - The current element's local bounding box, if any.
 * @param width - The surface width, used as the fallback bound.
 * @param height - The surface height, used as the fallback bound.
 * @returns The rectangle to resolve gradient coordinates against.
 */
export function resolveGradientBounds(box: Box | undefined, width: number, height: number): GradientBounds {
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

function gradientColors(stops: GradientColorStop[]): SkColor[] {
    return stops.map(stop => toSkiaColor(stop.color));
}

function gradientPositions(stops: GradientColorStop[]): number[] {
    return stops.map(stop => numberClamp(stop.offset ?? 0, 0, 1));
}

type SkiaGradientFactory = (gradient: Gradient, bounds: GradientBounds) => SkShader;

const GRADIENT_FACTORIES: Record<GradientType, SkiaGradientFactory> = {
    linear: (gradient, { x, y, width, height }) => {
        const { angle, stops } = gradient as LinearGradient;
        const angleRad = degreesToRadians(angle - 90);
        const cos = Math.cos(angleRad);
        const sin = Math.sin(angleRad);
        const halfW = width / 2;
        const halfH = height / 2;
        const length = Math.abs(halfW * cos) + Math.abs(halfH * sin);

        return Skia.Shader.MakeLinearGradient(
            Skia.Point(x + halfW - cos * length, y + halfH - sin * length),
            Skia.Point(x + halfW + cos * length, y + halfH + sin * length),
            gradientColors(stops),
            gradientPositions(stops),
            TileMode.Clamp
        );
    },
    radial: (gradient, { x, y, width, height }) => {
        const { position, stops } = gradient as RadialGradient;
        const cx = x + (position[0] / 100) * width;
        const cy = y + (position[1] / 100) * height;
        const radius = Math.max(width, height) / 2;

        return Skia.Shader.MakeRadialGradient(
            Skia.Point(cx, cy),
            radius,
            gradientColors(stops),
            gradientPositions(stops),
            TileMode.Clamp
        );
    },
    conic: (gradient, { x, y, width, height }) => {
        const { angle, position, stops } = gradient as ConicGradient;
        const cx = x + (position[0] / 100) * width;
        const cy = y + (position[1] / 100) * height;

        return Skia.Shader.MakeSweepGradient(
            cx,
            cy,
            gradientColors(stops),
            gradientPositions(stops),
            TileMode.Clamp,
            null,
            0,
            angle,
            angle + 360
        );
    },
};

// Parsing a CSS gradient string is comparatively expensive and fill/stroke are re-applied for the
// same gradient across frames and elements, so memoize by string within a bounded cache.
const GRADIENT_CACHE_LIMIT = 256;
const gradientCache = new Map<string, Gradient | undefined>();

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

// A pattern tile is position-independent, so one materialized image shader per serialized pattern
// string serves every element and frame (null caches invalid strings or a missing GPU surface).
const PATTERN_CACHE_LIMIT = 256;
const patternCache = new Map<string, SkShader | null>();

function buildPatternShader(pattern: Pattern): SkShader | null {
    const geometry = getPatternTileGeometry(pattern);
    const surface = Skia.Surface.MakeOffscreen(geometry.size, geometry.size);

    if (!surface) {
        return null;
    }

    const canvas = surface.getCanvas();

    if (pattern.background !== 'transparent') {
        const background = Skia.Paint();

        background.setColor(toSkiaColor(pattern.background));
        background.setStyle(PaintStyle.Fill);
        canvas.drawRect(Skia.XYWHRect(0, 0, geometry.size, geometry.size), background);
    }

    geometry.shapes.forEach(shape => {
        const paint = Skia.Paint();

        paint.setAntiAlias(true);
        paint.setColor(toSkiaColor(pattern.foreground));

        if (shape.kind === 'line') {
            paint.setStyle(PaintStyle.Stroke);
            paint.setStrokeWidth(shape.width);
            canvas.drawLine(shape.x1, shape.y1, shape.x2, shape.y2, paint);
            return;
        }

        paint.setStyle(PaintStyle.Fill);
        canvas.drawCircle(shape.cx, shape.cy, shape.radius, paint);
    });

    return surface
        .makeImageSnapshot()
        .makeShaderOptions(TileMode.Repeat, TileMode.Repeat, FilterMode.Nearest, MipmapMode.None);
}

function resolvePatternShader(value: string): SkShader | null {
    const cached = patternCache.get(value);

    if (cached !== undefined) {
        return cached;
    }

    if (patternCache.size >= PATTERN_CACHE_LIMIT) {
        patternCache.clear();
    }

    const pattern = parsePattern(value);
    const shader = pattern ? buildPatternShader(pattern) : null;

    patternCache.set(value, shader);

    return shader;
}

/**
 * Resolves a Ripl paint string into a Skia {@link SkShader}, or `null` when the value is a plain
 * color (the caller should then use {@link toSkiaColor}). Supports linear, radial, and conic
 * gradients and repeating `pattern(...)` fills; results are memoized within bounded caches.
 *
 * @param value - The paint string (a gradient, a `pattern(...)`, or a plain color).
 * @param bounds - The rectangle gradient coordinates resolve against (see {@link resolveGradientBounds}).
 * @returns The Skia shader for a gradient/pattern, or `null` for a plain color.
 */
export function toSkiaShader(value: string, bounds: GradientBounds): SkShader | null {
    if (isPatternString(value)) {
        return resolvePatternShader(value);
    }

    if (isGradientString(value)) {
        const gradient = parseGradientMemoized(value);

        if (gradient) {
            return GRADIENT_FACTORIES[gradient.type](gradient, bounds);
        }
    }

    return null;
}
