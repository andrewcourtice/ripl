import {
    PATTERNS,
} from './constants';

import {
    scaleRGB,
} from './scales';

import {
    hslToRGBA,
    hsvToRGBA,
} from './utilities';

import type {
    ColorRGBA,
    ColorSpace,
} from './types';

import {
    numberClamp,
} from '@ripl/utilities';

/** Error thrown when a color string cannot be parsed in the expected format. */
export class ColorParseError extends Error {

    constructor(value: string, type: ColorSpace) {
        super(`${value} is an ill-formed or unsupported ${type} color`);
    }

}

function parsePercentage(value: string) {
    return numberClamp(parseInt(value.replace('%', ''), 10) / 100, 0, 1);
}

function parseRGBChannel(value: string): number {
    if (!value.endsWith('%')) {
        return numberClamp(parseInt(value, 10), 0, 255);
    }

    return scaleRGB(parsePercentage(value));
}

function parseAlphaChannel(value: string): number {
    if (!value.endsWith('%')) {
        return numberClamp(parseFloat(value), 0, 1);
    }

    return parsePercentage(value);
}

function parseHueChannel(value: string): number {
    return numberClamp(parseInt(value, 10), 0, 360);
}

function parsePercentageChannel(value: string): number {
    return numberClamp(parseInt(value.replace('%', ''), 10), 0, 100);
}

function getHEXChannels(components: RegExpExecArray): string[] {
    if (components[1]) {
        return [
            components[1],
            components[2],
            components[3],
            components[4] || 'ff',
        ];
    }

    // CSS expands a shorthand digit by doubling it, so `#f0a8` is `#ff00aa88`.
    const alpha = components[8] || 'f';

    return [
        components[5] + components[5],
        components[6] + components[6],
        components[7] + components[7],
        alpha + alpha,
    ];
}

/** Parses a hexadecimal color string in any CSS length (e.g. `#f00`, `#f00c`, `#ff0000`, `#ff0000cc`) into an RGBA tuple. */
export function parseHEX(value: string): ColorRGBA {
    const components = PATTERNS.hex.exec(value);

    if (!components) {
        throw new ColorParseError(value, 'hex');
    }

    const [
        red,
        green,
        blue,
        alpha,
    ] = getHEXChannels(components);

    return [
        parseInt(red, 16),
        parseInt(green, 16),
        parseInt(blue, 16),
        scaleRGB.inverse(parseInt(alpha, 16)),
    ];
}

/** Parses an `rgb()` color string into an RGBA tuple with alpha set to 1. */
export function parseRGB(value: string): ColorRGBA {
    const components = PATTERNS.rgb.exec(value);

    if (!components) {
        throw new ColorParseError(value, 'rgb');
    }

    return [
        parseRGBChannel(components[1]),
        parseRGBChannel(components[2]),
        parseRGBChannel(components[3]),
        1,
    ];
}

/** Parses an `rgba()` color string into an RGBA tuple. */
export function parseRGBA(value: string): ColorRGBA {
    const components = PATTERNS.rgba.exec(value);

    if (!components) {
        throw new ColorParseError(value, 'rgba');
    }

    return [
        parseRGBChannel(components[1]),
        parseRGBChannel(components[2]),
        parseRGBChannel(components[3]),
        parseAlphaChannel(components[4]),
    ];
}

/** Parses an `hsl()` color string into an RGBA tuple. */
export function parseHSL(value: string): ColorRGBA {
    const components = PATTERNS.hsl.exec(value);

    if (!components) {
        throw new ColorParseError(value, 'hsl');
    }

    return hslToRGBA(
        parseHueChannel(components[1]),
        parsePercentageChannel(components[2]),
        parsePercentageChannel(components[3]),
        1
    );
}

/** Parses an `hsla()` color string into an RGBA tuple. */
export function parseHSLA(value: string): ColorRGBA {
    const components = PATTERNS.hsla.exec(value);

    if (!components) {
        throw new ColorParseError(value, 'hsla');
    }

    return hslToRGBA(
        parseHueChannel(components[1]),
        parsePercentageChannel(components[2]),
        parsePercentageChannel(components[3]),
        parseAlphaChannel(components[4])
    );
}

/** Parses an `hsv()` color string into an RGBA tuple. */
export function parseHSV(value: string): ColorRGBA {
    const components = PATTERNS.hsv.exec(value);

    if (!components) {
        throw new ColorParseError(value, 'hsv');
    }

    return hsvToRGBA(
        parseHueChannel(components[1]),
        parsePercentageChannel(components[2]),
        parsePercentageChannel(components[3]),
        1
    );
}

/** Parses an `hsva()` color string into an RGBA tuple. */
export function parseHSVA(value: string): ColorRGBA {
    const components = PATTERNS.hsva.exec(value);

    if (!components) {
        throw new ColorParseError(value, 'hsva');
    }

    return hsvToRGBA(
        parseHueChannel(components[1]),
        parsePercentageChannel(components[2]),
        parsePercentageChannel(components[3]),
        parseAlphaChannel(components[4])
    );
}