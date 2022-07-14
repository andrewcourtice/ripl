export type ColorRGBA = [red: number, green: number, blue: number, alpha: number];
export type ColorSpace = 'hex'
| 'rgb'
| 'rgba'
| 'hsl';

export interface ColorParser {
    pattern: RegExp;
    parse(value: string): ColorRGBA;
    serialise(...args: ColorRGBA): string;
}