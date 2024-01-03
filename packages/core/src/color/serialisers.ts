import {
    scaleRGB,
} from './scales';

import {
    clamp,
} from '../math';

import type {
    ColorRGBA,
} from './types';

function clampRGBValue(value: number) {
    return clamp(value, 0, 255);
}

export function rgbChannelToHEX(channel: number): string {
    const hex = Math.floor(channel).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
}

export function serialiseHEX(...args: ColorRGBA): string {
    let output = rgbChannelToHEX(args[0])
        + rgbChannelToHEX(args[1])
        + rgbChannelToHEX(args[2]);

    if (args[3] < 1) {
        output += rgbChannelToHEX(scaleRGB(args[3]));
    }

    return `#${output}`;
}

export function serialiseRGB(...args: ColorRGBA): string {
    return `rgb(${clampRGBValue(args[0])}, ${clampRGBValue(args[1])}, ${clampRGBValue(args[2])})`;
}

export function serialiseRGBA(...args: ColorRGBA): string {
    return `rgba(${clampRGBValue(args[0])}, ${clampRGBValue(args[1])}, ${clampRGBValue(args[2])}, ${clamp(args[3], 0, 1)})`;
}