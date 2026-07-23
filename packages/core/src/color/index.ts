import {
    PATTERNS,
} from './constants';

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


export * from './parsers';
export * from './serializers';
export * from './utilities';
export * from './scales';
export * from './schemes';
export * from './types';

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

/** Finds the first color parser whose pattern matches the given color string. */
export function getColorParser(value: string): ColorParser | undefined {
    return PARSER_MAP.find(({ pattern }) => pattern.test(value));
}

/** Parses any supported color string into an RGBA tuple, or returns `undefined` if no parser matches. */
export function parseColor(value: string): ColorRGBA | undefined {
    const parser = getColorParser(value);

    if (parser) {
        return parser.parse(value);
    }
}