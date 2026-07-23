import {
    scaleRGB,
} from './scales';

import {
    rgbaToHSL,
    rgbaToHSV,
} from './utilities';

import type {
    ColorRGBA,
} from './types';

import {
    numberClamp,
} from '@ripl/utilities';

function clampRGBValue(value: number) {
    return numberClamp(value, 0, 255);
}

function clampPercentageValue(value: number) {
    return numberClamp(value, 0, 100);
}

/** Converts a single RGB channel value (0–255) to a two-character hexadecimal string. */
export function rgbChannelToHEX(channel: number): string {
    const hex = Math.floor(channel).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
}

/** Serializes RGBA channel values into a hexadecimal color string (e.g. `#ff0000`). */
export function serializeHEX(...args: ColorRGBA): string {
    let output = rgbChannelToHEX(args[0])
        + rgbChannelToHEX(args[1])
        + rgbChannelToHEX(args[2]);

    if (args[3] < 1) {
        output += rgbChannelToHEX(scaleRGB(args[3]));
    }

    return `#${output}`;
}

/** Serializes RGBA channel values into an `rgb()` color string. */
export function serializeRGB(...args: ColorRGBA): string {
    return `rgb(${clampRGBValue(args[0])}, ${clampRGBValue(args[1])}, ${clampRGBValue(args[2])})`;
}

/** Serializes RGBA channel values into an `rgba()` color string. */
export function serializeRGBA(...args: ColorRGBA): string {
    return `rgba(${clampRGBValue(args[0])}, ${clampRGBValue(args[1])}, ${clampRGBValue(args[2])}, ${numberClamp(args[3], 0, 1)})`;
}

/** Serializes RGBA channel values into an `hsl()` color string. */
export function serializeHSL(...args: ColorRGBA): string {
    const [
        hue,
        saturation,
        lightness,
    ] = rgbaToHSL(args[0], args[1], args[2]);

    return `hsl(${numberClamp(hue, 0, 360)}, ${clampPercentageValue(saturation)}%, ${clampPercentageValue(lightness)}%)`;
}

/** Serializes RGBA channel values into an `hsla()` color string. */
export function serializeHSLA(...args: ColorRGBA): string {
    const [
        hue,
        saturation,
        lightness,
    ] = rgbaToHSL(args[0], args[1], args[2], args[3]);

    return `hsla(${numberClamp(hue, 0, 360)}, ${clampPercentageValue(saturation)}%, ${clampPercentageValue(lightness)}%, ${numberClamp(args[3], 0, 1)})`;
}

/** Serializes RGBA channel values into an `hsv()` color string. */
export function serializeHSV(...args: ColorRGBA): string {
    const [
        hue,
        saturation,
        value,
    ] = rgbaToHSV(args[0], args[1], args[2]);

    return `hsv(${numberClamp(hue, 0, 360)}, ${clampPercentageValue(saturation)}%, ${clampPercentageValue(value)}%)`;
}

/** Serializes RGBA channel values into an `hsva()` color string. */
export function serializeHSVA(...args: ColorRGBA): string {
    const [
        hue,
        saturation,
        value,
    ] = rgbaToHSV(args[0], args[1], args[2], args[3]);

    return `hsva(${numberClamp(hue, 0, 360)}, ${clampPercentageValue(saturation)}%, ${clampPercentageValue(value)}%, ${numberClamp(args[3], 0, 1)})`;
}