import {
    isGradientString,
    isPatternString,
    isTransparentColor,
    parseColor,
    parseGradientCached,
    parsePatternCached,
} from '@ripl/core';

import type {
    ColorRGBA,
} from '@ripl/core';

/** ANSI SGR reset sequence. */
export const ANSI_RESET = '\x1b[0m';

/**
 * Paint values that resolve to nothing at all, as opposed to a color the terminal cannot express.
 * Keeping the two apart is what lets a `transparent` fill draw no geometry while an unrecognized
 * one still draws, uncolored.
 */
const NO_PAINT_KEYWORDS = new Set([
    '',
    'none',
    'transparent',
]);

/**
 * A functional paint whose alpha argument is an explicit integer zero. The shared `rgba`/`hsla`/
 * `hsva` patterns only accept a fractional or percentage alpha, so `rgba(0, 0, 0, 0)` parses as
 * nothing at all and would otherwise be painted as an unresolvable color rather than skipped.
 */
const ZERO_ALPHA_REGEX = /^(?:rgba|hsla|hsva)\([^)]*,\s*0\s*\)$/i;

/**
 * Resolves the single color that stands in for a multi-color paint: the first that is not fully
 * transparent, so a mostly opaque gradient or pattern still paints rather than vanishing.
 */
function resolveRepresentative(colors: string[]): ColorRGBA | undefined {
    const representative = colors.find(color => !isTransparentColor(color)) ?? colors[0];

    return representative ? resolvePaint(representative) : undefined;
}

/**
 * Resolves a CSS paint string to RGBA, covering everything the shared parsers cover plus the
 * representative color of a gradient or pattern (a character cell cannot interpolate, so one of its
 * colors is the closest available).
 */
function resolvePaint(color: string): ColorRGBA | undefined {
    const parsed = parseColor(color);

    if (parsed) {
        return parsed;
    }

    if (isGradientString(color)) {
        const stops = parseGradientCached(color)?.stops ?? [];

        return resolveRepresentative(stops.map(stop => stop.color));
    }

    if (isPatternString(color)) {
        const pattern = parsePatternCached(color);

        return pattern ? resolveRepresentative([pattern.foreground, pattern.background]) : undefined;
    }
}

/**
 * Attenuates a color toward the terminal background. A cell is either lit or not, so alpha can only
 * be expressed as a darker color; the background is unknowable, so assume the conventional dark one
 * (the same assumption the rasterizer's light default foreground already encodes).
 */
function attenuate(channel: number, alpha: number): number {
    return Math.round(channel * alpha);
}

/** Builds a truecolor SGR sequence for the given parameter (`38` foreground, `48` background). */
function toAnsiSequence(parameter: number, color: string, opacity: number): string | undefined {
    const normalized = color.trim().toLowerCase();

    if (opacity <= 0 || NO_PAINT_KEYWORDS.has(normalized) || ZERO_ALPHA_REGEX.test(normalized)) {
        return undefined;
    }

    const resolved = resolvePaint(color);

    if (!resolved) {
        return '';
    }

    const [r, g, b, a] = resolved;
    const alpha = a * opacity;

    if (alpha <= 0) {
        return undefined;
    }

    return `\x1b[${parameter};2;${attenuate(r, alpha)};${attenuate(g, alpha)};${attenuate(b, alpha)}m`;
}

/**
 * Converts a CSS color string to an ANSI truecolor foreground escape sequence.
 *
 * @param color - The paint to resolve. Named colors, hex (including shorthand), `rgb()`/`rgba()`,
 * `hsl()`/`hsla()`, `hsv()`/`hsva()`, gradients and patterns are all supported; a gradient or
 * pattern resolves to its first non-transparent color, the closest single color a character cell
 * can show.
 * @param opacity - Additional alpha to composite over the paint's own, typically
 * `Context.opacity`. Defaults to `1`.
 * @returns The escape sequence; `''` when the paint is a color the terminal cannot resolve (draw
 * it, but uncolored); or `undefined` when the paint resolves to nothing and must not be drawn at
 * all (`none`, `transparent`, or zero effective alpha).
 */
export function colorToAnsiFg(color: string, opacity: number = 1): string | undefined {
    return toAnsiSequence(38, color, opacity);
}

/**
 * Converts a CSS color string to an ANSI truecolor background escape sequence. Resolution and
 * return values match {@link colorToAnsiFg}.
 *
 * @param color - The paint to resolve.
 * @param opacity - Additional alpha to composite over the paint's own. Defaults to `1`.
 * @returns The escape sequence, `''` when unresolvable, or `undefined` when it must not be drawn.
 */
export function colorToAnsiBg(color: string, opacity: number = 1): string | undefined {
    return toAnsiSequence(48, color, opacity);
}
