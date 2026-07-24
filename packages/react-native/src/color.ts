import {
    Skia,
} from '@shopify/react-native-skia';

import type {
    SkColor,
} from '@shopify/react-native-skia';

import {
    parseColor,
    serializeRGBA,
} from '@ripl/core';

/**
 * Resolves a Ripl color string into a Skia {@link SkColor}.
 *
 * Ripl colors may be named, hex, `rgb(a)`, or `hsl(a)` strings; Skia's own parser is stricter, so the
 * value is first normalized through Ripl's `parseColor`/`serializeRGBA` (which understand the full
 * set) and only handed to `Skia.Color` as a plain string it reliably accepts. Unparseable values fall
 * back to Skia's parser directly.
 *
 * @param value - The Ripl color string to convert.
 * @returns The equivalent Skia color.
 */
export function toSkiaColor(value: string): SkColor {
    const rgba = parseColor(value);

    return Skia.Color(rgba ? serializeRGBA(...rgba) : value);
}
