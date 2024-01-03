import {
    parseColor,
    serialiseRGBA,
} from '.';

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