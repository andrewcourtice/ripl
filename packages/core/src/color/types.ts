/** An RGBA color represented as a four-element tuple of channel values. */
export type ColorRGBA = [red: number, green: number, blue: number, alpha: number];

/** An HSL color represented as a three-element tuple. */
export type ColorHSL = [hue: number, saturation: number, lightness: number];

/** An HSLA color represented as a four-element tuple. */
export type ColorHSLA = [hue: number, saturation: number, lightness: number, alpha: number];

/** An HSV color represented as a three-element tuple. */
export type ColorHSV = [hue: number, saturation: number, value: number];

/** An HSVA color represented as a four-element tuple. */
export type ColorHSVA = [hue: number, saturation: number, value: number, alpha: number];

/** Supported color space identifiers. */
export type ColorSpace = 'hex'
| 'rgb'
| 'rgba'
| 'hsl'
| 'hsla'
| 'hsv'
| 'hsva';

/** A color parser that can test, parse, and serialize a specific color format. */
export interface ColorParser {
    /** Pattern that matches color strings this parser can handle. */
    pattern: RegExp;
    /** Parses a color string into an RGBA tuple. */
    parse(value: string): ColorRGBA;
    /** Serializes RGBA channel values back into a color string in this parser's format. */
    serialize(...args: ColorRGBA): string;
}