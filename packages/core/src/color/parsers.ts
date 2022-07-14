import {
    PATTERNS,
} from './constants';

import {
    clamp,
} from '../math';

import {
    scaleRGB,
} from './scales';

import type {
    ColorRGBA,
    ColorSpace,
} from './types';

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