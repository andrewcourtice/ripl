import {
    getPathLength,
    radiansToDegrees,
    samplePathPoint,
} from '@ripl/core';

import type {
    ContextText,
    TextAlignment,
    TextBaseline,
} from '@ripl/core';

import {
    FontSlant,
    FontWeight,
    Skia,
} from '@shopify/react-native-skia';

import type {
    FontMetrics,
    SkCanvas,
    SkFont,
    SkFontMgr,
    SkPaint,
    SkTypeface,
} from '@shopify/react-native-skia';

/** Options accepted by {@link measureSkiaText}. */
export interface MeasureSkiaTextOptions {
    /** The CSS `font` shorthand to measure with (e.g. `'bold 16px Menlo'`). Defaults to `12px sans-serif`. */
    font?: string;
}

interface ParsedFont {
    size: number;
    family: string;
    weight: FontWeight;
    slant: FontSlant;
}

const DEFAULT_FONT = '12px sans-serif';
const DEFAULT_SIZE = 12;
const DEFAULT_FAMILY = 'sans-serif';

// Proportional fallback used when no typeface can be resolved (mirrors the headless `@ripl/node`
// stub): roughly half-em glyph advance, 80/20 ascent/descent split.
const STUB_ADVANCE_RATIO = 0.5;
const STUB_ASCENT_RATIO = 0.8;
const STUB_DESCENT_RATIO = 0.2;

const ALIGN_FACTORS: Record<TextAlignment, number> = {
    left: 0,
    start: 0,
    center: 0.5,
    right: 1,
    end: 1,
};

const BASELINE_OFFSETS: Record<TextBaseline, (metrics: FontMetrics) => number> = {
    top: metrics => -metrics.ascent,
    hanging: metrics => -metrics.ascent,
    middle: metrics => (-metrics.ascent - metrics.descent) / 2,
    alphabetic: () => 0,
    ideographic: metrics => -metrics.descent,
    bottom: metrics => -metrics.descent,
};

const fontRegistry = new Map<string, SkTypeface>();
const fontCache = new Map<string, SkFont>();

let systemFontManager: SkFontMgr | null | undefined;

/**
 * Registers a typeface under a family name so {@link measureSkiaText} and text rendering can resolve
 * it synchronously. Skia loads typefaces asynchronously, so a custom family must be registered (e.g.
 * from React Native Skia's `useFonts`) before the first render that measures or draws with it.
 *
 * @param family - The family name that a Ripl `font` string will reference.
 * @param typeface - The loaded Skia typeface.
 */
export function registerTypeface(family: string, typeface: SkTypeface): void {
    fontRegistry.set(family, typeface);
    // A newly registered family may replace a cached fallback resolution, so clear the font cache.
    fontCache.clear();
}

function getSystemFontManager(): SkFontMgr | null {
    if (systemFontManager === undefined) {
        try {
            systemFontManager = Skia.FontMgr.System();
        } catch {
            systemFontManager = null;
        }
    }

    return systemFontManager;
}

/**
 * Parses a CSS `font` shorthand into the pieces Skia needs (size, family, weight, slant). Unknown or
 * missing pieces fall back to a 12px upright `sans-serif` at normal weight.
 *
 * @param css - The CSS `font` shorthand string.
 * @returns The parsed size, family, weight, and slant.
 */
export function parseFont(css: string): ParsedFont {
    const tokens = css.trim().split(/\s+/);
    const sizeIndex = tokens.findIndex(token => /^-?\.?\d/.test(token));
    const size = sizeIndex >= 0 ? parseFloat(tokens[sizeIndex]) || DEFAULT_SIZE : DEFAULT_SIZE;
    const family = (sizeIndex >= 0 ? tokens.slice(sizeIndex + 1).join(' ') : '').replace(/["']/g, '').trim() || DEFAULT_FAMILY;

    let weight = FontWeight.Normal;
    let slant = FontSlant.Upright;

    (sizeIndex >= 0 ? tokens.slice(0, sizeIndex) : tokens).forEach(token => {
        const lower = token.toLowerCase();

        if (lower === 'italic') {
            slant = FontSlant.Italic;
        } else if (lower === 'oblique') {
            slant = FontSlant.Oblique;
        } else if (lower === 'bold' || lower === 'bolder') {
            weight = FontWeight.Bold;
        } else if (/^\d{3}$/.test(lower)) {
            // CSS numeric weights (100–900) map 1:1 onto the `FontWeight` enum values.
            weight = parseInt(lower, 10) as FontWeight;
        }
    });

    return {
        size,
        family,
        weight,
        slant,
    };
}

function resolveTypeface(parsed: ParsedFont): SkTypeface | null {
    const registered = fontRegistry.get(parsed.family);

    if (registered) {
        return registered;
    }

    const manager = getSystemFontManager();

    if (!manager) {
        return null;
    }

    return manager.matchFamilyStyle(parsed.family, {
        weight: parsed.weight,
        slant: parsed.slant,
    });
}

function resolveFont(css: string, parsed: ParsedFont): SkFont {
    const cached = fontCache.get(css);

    if (cached) {
        return cached;
    }

    const typeface = resolveTypeface(parsed);
    const font = typeface ? Skia.Font(typeface, parsed.size) : Skia.Font(undefined, parsed.size);

    fontCache.set(css, font);

    return font;
}

function sumGlyphWidths(font: SkFont, text: string): number {
    if (!text) {
        return 0;
    }

    return font
        .getGlyphWidths(font.getGlyphIDs(text))
        .reduce((total, advance) => total + advance, 0);
}

function stubTextMetrics(text: string, size: number): TextMetrics {
    const width = text.length * size * STUB_ADVANCE_RATIO;

    return buildTextMetrics(width, size * STUB_ASCENT_RATIO, size * STUB_DESCENT_RATIO);
}

function buildTextMetrics(width: number, ascent: number, descent: number): TextMetrics {
    return {
        width,
        actualBoundingBoxLeft: 0,
        actualBoundingBoxRight: width,
        actualBoundingBoxAscent: ascent,
        actualBoundingBoxDescent: descent,
        fontBoundingBoxAscent: ascent,
        fontBoundingBoxDescent: descent,
        alphabeticBaseline: 0,
        emHeightAscent: ascent,
        emHeightDescent: descent,
        hangingBaseline: ascent,
        ideographicBaseline: -descent,
    } as TextMetrics;
}

/**
 * Measures text synchronously using Skia font metrics, returning a DOM-shaped {@link TextMetrics} so
 * Ripl layout code (chart titles, legends, tooltips) sizes text consistently. Falls back to a
 * proportional estimate when no typeface can be resolved, and never throws.
 *
 * @param text - The string to measure.
 * @param options - Measurement options (the CSS `font` to use).
 * @returns The measured text metrics.
 */
export function measureSkiaText(text: string, options?: MeasureSkiaTextOptions): TextMetrics {
    const css = options?.font ?? DEFAULT_FONT;
    const parsed = parseFont(css);

    try {
        const font = resolveFont(css, parsed);
        const width = sumGlyphWidths(font, text);

        if (width <= 0 && text.length > 0) {
            return stubTextMetrics(text, parsed.size);
        }

        const metrics = font.getMetrics();

        return buildTextMetrics(width, Math.abs(metrics.ascent), Math.abs(metrics.descent));
    } catch {
        return stubTextMetrics(text, parsed.size);
    }
}

function drawTextOnPath(canvas: SkCanvas, text: ContextText, paint: SkPaint, font: SkFont): void {
    const pathData = text.pathData as string;
    const totalLength = getPathLength(pathData);

    let distance = (text.startOffset ?? 0) * totalLength;

    for (const char of text.content) {
        const charWidth = sumGlyphWidths(font, char);
        const midDistance = distance + charWidth / 2;

        if (midDistance > totalLength) {
            break;
        }

        const { x, y, angle } = samplePathPoint(pathData, midDistance);

        canvas.save();
        canvas.translate(x, y);
        canvas.rotate(radiansToDegrees(angle), 0, 0);
        canvas.drawText(char, 0, 0, paint, font);
        canvas.restore();

        distance += charWidth;
    }
}

/**
 * Draws a {@link ContextText} onto a Skia canvas, honoring `textAlign`/`textBaseline` (resolved from
 * measured width and font metrics) and dispatching to per-glyph text-on-a-path rendering when the
 * text carries `pathData`.
 *
 * @param canvas - The Skia canvas to draw into.
 * @param text - The text element to render.
 * @param paint - The fill or stroke paint to draw with.
 * @param cssFont - The CSS `font` shorthand for the current drawing state.
 * @param textAlign - The horizontal alignment of the text anchor.
 * @param textBaseline - The vertical baseline of the text anchor.
 */
export function drawSkiaText(
    canvas: SkCanvas,
    text: ContextText,
    paint: SkPaint,
    cssFont: string,
    textAlign: TextAlignment,
    textBaseline: TextBaseline
): void {
    const parsed = parseFont(cssFont);
    const font = resolveFont(cssFont, parsed);

    if (text.pathData) {
        drawTextOnPath(canvas, text, paint, font);
        return;
    }

    const width = sumGlyphWidths(font, text.content);
    const metrics = font.getMetrics();
    const x = text.x - width * (ALIGN_FACTORS[textAlign] ?? 0);
    const y = text.y + (BASELINE_OFFSETS[textBaseline] ?? BASELINE_OFFSETS.alphabetic)(metrics);

    canvas.drawText(text.content, x, y, paint, font);
}
