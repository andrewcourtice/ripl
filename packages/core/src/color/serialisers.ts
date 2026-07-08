import {
    scaleRGB,
} from './scales';

import {
    clamp,
} from '../math';

import {
    rgbaToHSL,
    rgbaToHSV,
} from './utilities';

import type {
    ColorRGBA,
} from './types';

function clampRGBValue(value: number) {
    return clamp(value, 0, 255);
}

function clampPercentageValue(value: number) {
    return clamp(value, 0, 100);
}

/** Converts a single RGB channel value (0–255) to a two-character hexadecimal string. */
export function rgbChannelToHEX(channel: number): string {
    const hex = Math.floor(channel).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
}

/** Serialises RGBA channel values into a hexadecimal color string (e.g. `#ff0000`). */
export function serialiseHEX(...args: ColorRGBA): string {
    let output = rgbChannelToHEX(args[0])
        + rgbChannelToHEX(args[1])
        + rgbChannelToHEX(args[2]);

    if (args[3] < 1) {
        output += rgbChannelToHEX(scaleRGB(args[3]));
    }

    return `#${output}`;
}

/** Serialises RGBA channel values into an `rgb()` color string. */
export function serialiseRGB(...args: ColorRGBA): string {
    return `rgb(${clampRGBValue(args[0])}, ${clampRGBValue(args[1])}, ${clampRGBValue(args[2])})`;
}

/** Serialises RGBA channel values into an `rgba()` color string. */
export function serialiseRGBA(...args: ColorRGBA): string {
    return `rgba(${clampRGBValue(args[0])}, ${clampRGBValue(args[1])}, ${clampRGBValue(args[2])}, ${clamp(args[3], 0, 1)})`;
}

/** Serialises RGBA channel values into an `hsl()` color string. */
export function serialiseHSL(...args: ColorRGBA): string {
    const [
        hue,
        saturation,
        lightness,
    ] = rgbaToHSL(args[0], args[1], args[2]);

    return `hsl(${clamp(hue, 0, 360)}, ${clampPercentageValue(saturation)}%, ${clampPercentageValue(lightness)}%)`;
}

/** Serialises RGBA channel values into an `hsla()` color string. */
export function serialiseHSLA(...args: ColorRGBA): string {
    const [
        hue,
        saturation,
        lightness,
    ] = rgbaToHSL(args[0], args[1], args[2], args[3]);

    return `hsla(${clamp(hue, 0, 360)}, ${clampPercentageValue(saturation)}%, ${clampPercentageValue(lightness)}%, ${clamp(args[3], 0, 1)})`;
}

/** Serialises RGBA channel values into an `hsv()` color string. */
export function serialiseHSV(...args: ColorRGBA): string {
    const [
        hue,
        saturation,
        value,
    ] = rgbaToHSV(args[0], args[1], args[2]);

    return `hsv(${clamp(hue, 0, 360)}, ${clampPercentageValue(saturation)}%, ${clampPercentageValue(value)}%)`;
}

/** Serialises RGBA channel values into an `hsva()` color string. */
export function serialiseHSVA(...args: ColorRGBA): string {
    const [
        hue,
        saturation,
        value,
    ] = rgbaToHSV(args[0], args[1], args[2], args[3]);

    return `hsva(${clamp(hue, 0, 360)}, ${clampPercentageValue(saturation)}%, ${clampPercentageValue(value)}%, ${clamp(args[3], 0, 1)})`;
}