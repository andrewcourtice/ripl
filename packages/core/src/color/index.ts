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
    serialiseHEX,
    serialiseHSL,
    serialiseHSLA,
    serialiseHSV,
    serialiseHSVA,
    serialiseRGB,
    serialiseRGBA,
} from './serialisers';

import {
    ColorParser,
    ColorRGBA,
} from './types';

export * from './parsers';
export * from './serialisers';
export * from './utilities';
export * from './types';

const PARSER_MAP = [
    {
        pattern: PATTERNS.hex,
        parse: parseHEX,
        serialise: serialiseHEX,
    },
    {
        pattern: PATTERNS.rgb,
        parse: parseRGB,
        serialise: serialiseRGB,
    },
    {
        pattern: PATTERNS.rgba,
        parse: parseRGBA,
        serialise: serialiseRGBA,
    },
    {
        pattern: PATTERNS.hsl,
        parse: parseHSL,
        serialise: serialiseHSL,
    },
    {
        pattern: PATTERNS.hsla,
        parse: parseHSLA,
        serialise: serialiseHSLA,
    },
    {
        pattern: PATTERNS.hsv,
        parse: parseHSV,
        serialise: serialiseHSV,
    },
    {
        pattern: PATTERNS.hsva,
        parse: parseHSVA,
        serialise: serialiseHSVA,
    },
] as ColorParser[];

export function getColorParser(value: string): ColorParser | undefined {
    return PARSER_MAP.find(({ pattern }) => pattern.test(value));
}

export function parseColor(value: string): ColorRGBA | undefined {
    const parser = getColorParser(value);

    if (parser) {
        return parser.parse(value);
    }
}