import {
    vi,
} from 'vitest';

import {
    BRAILLE_CELL_HEIGHT,
    BRAILLE_CELL_WIDTH,
} from '../src/rasterizer';

import type {
    Rasterizer,
    SerializeOptions,
} from '../src/rasterizer';

import type {
    TerminalOutput,
} from '../src/output';

/** A pixel handed to the rasterizer: `[x, y, color]`. */
export type SpyPixel = [number, number, string];

/** A glyph handed to the rasterizer: `[col, row, char, color]`. */
export type SpyChar = [number, number, string, string];

/** A {@link Rasterizer} that records everything drawn into it, for asserting on paint decisions. */
export interface SpyRasterizer extends Rasterizer {
    /** Every pixel passed to `setPixel`, in call order. */
    pixels: SpyPixel[];
    /** Every glyph passed to `setChar`, in call order. */
    chars: SpyChar[];
    /** The glyphs joined into a single string, for asserting on rendered text. */
    text(): string;
}

/** Captures every plotted pixel and placed glyph so tests can assert what the context decided to paint. */
export function createSpyRasterizer(cols: number, rows: number): SpyRasterizer {
    const pixels: SpyPixel[] = [];
    const chars: SpyChar[] = [];

    let currentCols = cols;
    let currentRows = rows;

    return {
        pixels,
        chars,
        text: () => chars.map(([,, char]) => char).join(''),
        get pixelWidth() {
            return currentCols * BRAILLE_CELL_WIDTH;
        },
        get pixelHeight() {
            return currentRows * BRAILLE_CELL_HEIGHT;
        },
        resize(nextCols: number, nextRows: number) {
            currentCols = nextCols;
            currentRows = nextRows;
        },
        setPixel(x: number, y: number, color: string) {
            pixels.push([x, y, color]);
        },
        setChar(col: number, row: number, char: string, color: string) {
            chars.push([col, row, char, color]);
        },
        clear() {
            pixels.length = 0;
            chars.length = 0;
        },
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        serialize: (options?: SerializeOptions) => '',
        toImageData: () => ({
            data: new Uint8ClampedArray(0),
            width: 0,
            height: 0,
        } as ImageData),
    };
}

/** A {@link TerminalOutput} that collects everything written to it. */
export interface MockTerminalOutput extends TerminalOutput {
    /** Every string passed to `write`, in call order. */
    written: string[];
    /** Delivers a resize to the subscribed listener, if any. */
    notifyResize(cols: number, rows: number): void;
}

/** Creates a terminal output adapter that records its writes and can be resized on demand. */
export function createMockOutput(cols = 40, rows = 12): MockTerminalOutput {
    const written: string[] = [];

    let listener: ((cols: number, rows: number) => void) | undefined;

    return {
        written,
        columns: cols,
        rows,
        write(data: string) {
            written.push(data);
        },
        onResize(callback) {
            listener = callback;

            return vi.fn(() => {
                listener = undefined;
            });
        },
        notifyResize(nextCols: number, nextRows: number) {
            listener?.(nextCols, nextRows);
        },
    };
}
