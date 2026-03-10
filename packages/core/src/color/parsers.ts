import {
    PATTERNS,
} from './constants';

import {
    clamp,
} from '../math';

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

/** Error thrown when a color string cannot be parsed in the expected format. */
export class ColorParseError extends Error {

    constructor(value: string, type: ColorSpace) {
        super(`${value} is an ill-formed or unsupported ${type} color`);
    }

}

function parsePercentage(value: string) {
    return clamp(parseInt(value.replace('%', ''), 10) / 100, 0, 1);
}

function parseRGBChannel(value: string): number {
    if (!value.endsWith('%')) {
        return clamp(parseInt(value, 10), 0, 255);
    }

    return scaleRGB(parsePercentage(value));
}

function parseAlphaChannel(value: string): number {
    if (!value.endsWith('%')) {
        return clamp(parseFloat(value), 0, 1);
    }

    return parsePercentage(value);
}

function parseHueChannel(value: string): number {
    return clamp(parseInt(value, 10), 0, 360);
}

function parsePercentageChannel(value: string): number {
    return clamp(parseInt(value.replace('%', ''), 10), 0, 100);
}

/** Parses a hexadecimal color string (e.g. `#ff0000` or `#ff000080`) into an RGBA tuple. */
export function parseHEX(value: string): ColorRGBA {
    const components = PATTERNS.hex.exec(value);

    if (!components) {
        throw new ColorParseError(value, 'hex');
    }

    const alpha = scaleRGB.inverse(parseInt(components[4] ?? 'ff', 16));

    return [
        parseInt(components[1], 16),
        parseInt(components[2], 16),
        parseInt(components[3], 16),
        alpha,
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