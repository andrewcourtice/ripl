import {
    parseColor,
    serialiseRGBA,
} from '.';

import {
    clamp,
} from '../math';

import type {
    ColorHSL,
    ColorHSLA,
    ColorHSV,
    ColorHSVA,
    ColorRGBA,
} from './types';

export function setColorAlpha(color: string, alpha: number) {
    const rgba = parseColor(color);

    if (!rgba) {
        return color;
    }

    const [
        red,
        green,
        blue,
    ] = rgba;

    return serialiseRGBA(red, green, blue, alpha);
}

export function rgbaToHSL(red: number, green: number, blue: number, alpha: number = 1): ColorHSLA {
    const r = red / 255;
    const g = green / 255;
    const b = blue / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let hue = 0;
    let saturation = 0;
    const lightness = (max + min) / 2;

    if (delta !== 0) {
        saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);

        switch (max) {
            case r:
                hue = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
                break;
            case g:
                hue = ((b - r) / delta + 2) / 6;
                break;
            case b:
                hue = ((r - g) / delta + 4) / 6;
                break;
        }
    }

    return [
        Math.round(hue * 360),
        Math.round(saturation * 100),
        Math.round(lightness * 100),
        alpha,
    ];
}

export function hslToRGBA(hue: number, saturation: number, lightness: number, alpha: number = 1): ColorRGBA {
    const h = clamp(hue, 0, 360) / 360;
    const s = clamp(saturation, 0, 100) / 100;
    const l = clamp(lightness, 0, 100) / 100;

    const hueToRGB = (p: number, q: number, t: number): number => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };

    let r, g, b;

    if (s === 0) {
        r = g = b = l;
    } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hueToRGB(p, q, h + 1 / 3);
        g = hueToRGB(p, q, h);
        b = hueToRGB(p, q, h - 1 / 3);
    }

    return [
        Math.round(r * 255),
        Math.round(g * 255),
        Math.round(b * 255),
        clamp(alpha, 0, 1),
    ];
}

export function rgbaToHSV(red: number, green: number, blue: number, alpha: number = 1): ColorHSVA {
    const r = red / 255;
    const g = green / 255;
    const b = blue / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    let hue = 0;
    const saturation = max === 0 ? 0 : delta / max;
    const value = max;

    if (delta !== 0) {
        switch (max) {
            case r:
                hue = ((g - b) / delta + (g < b ? 6 : 0)) / 6;
                break;
            case g:
                hue = ((b - r) / delta + 2) / 6;
                break;
            case b:
                hue = ((r - g) / delta + 4) / 6;
                break;
        }
    }

    return [
        Math.round(hue * 360),
        Math.round(saturation * 100),
        Math.round(value * 100),
        alpha,
    ];
}

export function hsvToRGBA(hue: number, saturation: number, value: number, alpha: number = 1): ColorRGBA {
    const h = clamp(hue, 0, 360) / 60;
    const s = clamp(saturation, 0, 100) / 100;
    const v = clamp(value, 0, 100) / 100;

    const c = v * s;
    const x = c * (1 - Math.abs((h % 2) - 1));
    const m = v - c;

    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 1) {
        [r, g, b] = [c, x, 0];
    } else if (h >= 1 && h < 2) {
        [r, g, b] = [x, c, 0];
    } else if (h >= 2 && h < 3) {
        [r, g, b] = [0, c, x];
    } else if (h >= 3 && h < 4) {
        [r, g, b] = [0, x, c];
    } else if (h >= 4 && h < 5) {
        [r, g, b] = [x, 0, c];
    } else if (h >= 5 && h < 6) {
        [r, g, b] = [c, 0, x];
    }

    return [
        Math.round((r + m) * 255),
        Math.round((g + m) * 255),
        Math.round((b + m) * 255),
        clamp(alpha, 0, 1),
    ];
}