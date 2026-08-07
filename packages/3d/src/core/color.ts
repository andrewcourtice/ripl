import {
    parseColor,
} from '@ripl/core';

import {
    createLRUCache,
} from '@ripl/utilities';

import type {
    ColorRGBA,
} from '@ripl/core';

/** Linear RGB triple with each channel in the `0`–`1` range. */
export type ColorUnitRGB = [r: number, g: number, b: number];

/** RGBA quad with each channel in the `0`–`1` range. */
export type ColorUnitRGBA = [r: number, g: number, b: number, a: number];

/** The colour used when an element has no `fill` and no material colour. */
export const DEFAULT_SURFACE_COLOR = '#888888';

// Bounded rather than unbounded: a demo animating a colour mints a new string every frame.
const COLOR_CACHE_SIZE = 256;

const colorCache = createLRUCache<string, ColorRGBA | undefined>(COLOR_CACHE_SIZE);

/**
 * Parses a CSS colour into `0`–`255` RGBA channels, caching the result.
 *
 * Light and material colours are resolved once per frame per surface, and `parseColor` is a regex
 * match plus allocation — this keeps the shading path off it.
 *
 * @param value - Any colour string `@ripl/core` can parse.
 * @returns The parsed colour, or `undefined` when `value` is not a colour.
 */
export function resolveColor(value: string): ColorRGBA | undefined {
    return colorCache.getOrInsertComputed(value, parseColor);
}

/** Converts `0`–`255` RGB channels to the `0`–`1` range the shading maths and GPU buffers use. */
export function rgbToUnit(color: ColorRGBA): ColorUnitRGB {
    return [color[0] / 255, color[1] / 255, color[2] / 255];
}

/** Converts `0`–`255` RGBA channels to the `0`–`1` range the shading maths and GPU buffers use. */
export function rgbaToUnit(color: ColorRGBA): ColorUnitRGBA {
    return [color[0] / 255, color[1] / 255, color[2] / 255, color[3]];
}

/**
 * Parses a CSS colour straight into unit-range RGB, falling back to `fallback` when unparseable.
 *
 * @param value - Any colour string `@ripl/core` can parse.
 * @param fallback - The colour to return when `value` cannot be parsed.
 * @returns The colour as unit-range RGB.
 */
export function resolveColorUnitRGB(value: string, fallback: ColorUnitRGB = [1, 1, 1]): ColorUnitRGB {
    const parsed = resolveColor(value);

    return parsed ? rgbToUnit(parsed) : fallback;
}
