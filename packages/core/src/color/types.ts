export type ColorRGBA = [red: number, green: number, blue: number, alpha: number];
export type ColorHSL = [hue: number, saturation: number, lightness: number];
export type ColorHSLA = [hue: number, saturation: number, lightness: number, alpha: number];
export type ColorHSV = [hue: number, saturation: number, value: number];
export type ColorHSVA = [hue: number, saturation: number, value: number, alpha: number];
export type ColorSpace = 'hex'
| 'rgb'
| 'rgba'
| 'hsl'
| 'hsla'
| 'hsv'
| 'hsva';

export interface ColorParser {
    pattern: RegExp;
    parse(value: string): ColorRGBA;
    serialise(...args: ColorRGBA): string;
}