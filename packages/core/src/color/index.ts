import {
    PATTERNS,
} from './constants';

import {
    parseKeyword,
} from './keywords';

import {
    parseHEX,
    parseHSL,
    parseHSLA,
    parseHSV,
    parseHSVA,
    parseRGB,
    parseRGBA,
} from './parsers';

import {
    serializeHEX,
    serializeHSL,
    serializeHSLA,
    serializeHSV,
    serializeHSVA,
    serializeRGB,
    serializeRGBA,
} from './serializers';

import type {
    ColorParser,
    ColorRGBA,
} from './types';


const PARSER_MAP = [
    {
        pattern: PATTERNS.hex,
        parse: parseHEX,
        serialize: serializeHEX,
    },
    {
        pattern: PATTERNS.rgb,
        parse: parseRGB,
        serialize: serializeRGB,
    },
    {
        pattern: PATTERNS.rgba,
        parse: parseRGBA,
        serialize: serializeRGBA,
    },
    {
        pattern: PATTERNS.hsl,
        parse: parseHSL,
        serialize: serializeHSL,
    },
    {
        pattern: PATTERNS.hsla,
        parse: parseHSLA,
        serialize: serializeHSLA,
    },
    {
        pattern: PATTERNS.hsv,
        parse: parseHSV,
        serialize: serializeHSV,
    },
    {
        pattern: PATTERNS.hsva,
        parse: parseHSVA,
        serialize: serializeHSVA,
    },
] as ColorParser[];

/**
 * Finds the first color parser whose pattern matches the given color string.
 *
 * Matching is purely pattern-based, so a CSS named color such as `red` has no parser and returns
 * `undefined` here even though {@link parseColor} resolves it. Reach for {@link parseColor} to ask
 * whether a string is a color Ripl understands.
 */
export function getColorParser(value: string): ColorParser | undefined {
    return PARSER_MAP.find(({ pattern }) => pattern.test(value));
}

/**
 * Parses any supported color string into an RGBA tuple, or returns `undefined` if nothing matches.
 *
 * The functional and hexadecimal formats are tried first via {@link getColorParser}; anything left
 * over falls through to {@link parseKeyword}, so a CSS named color such as `red` or `transparent`
 * resolves without a CSSOM.
 */
export function parseColor(value: string): ColorRGBA | undefined {
    const parser = getColorParser(value);

    if (parser) {
        return parser.parse(value);
    }

    return parseKeyword(value);
}

export * from './parsers';
export * from './serializers';
export * from './utilities';
export * from './scales';
export * from './schemes';
export * from './types';

export { parseKeyword } from './keywords';
