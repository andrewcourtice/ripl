import {
    ANSI_ERASE_DISPLAY_END,
    ANSI_ERASE_LINE_END,
    BRAILLE_ALL_DOTS,
    BRAILLE_BASE,
    BRAILLE_DOT_MAP,
    DEFAULT_BACKGROUND,
    DEFAULT_RGB,
} from './constants';

import {
    ANSI_RESET,
} from './color';

import type {
    TerminalColor,
} from './color';

import type {
    ColorRGBA,
} from '@ripl/core';

/** Options controlling how a rasterizer serializes its grid to a string. */
export interface SerializeOptions {
    /** When `false`, emit plain newline-separated braille text without ANSI color/cursor codes. Defaults to `true`. */
    ansi?: boolean;
}

/** Abstract rasterizer interface for converting pixel data to terminal characters. */
export interface Rasterizer {
    /** Total width of the pixel grid the rasterizer renders into. */
    readonly pixelWidth: number;
    /** Total height of the pixel grid the rasterizer renders into. */
    readonly pixelHeight: number;
    /** Width of one character cell, in pixels. */
    readonly cellWidth: number;
    /** Height of one character cell, in pixels. */
    readonly cellHeight: number;
    /** Resizes the grid to the given number of terminal columns and rows, clearing its contents. */
    resize(cols: number, rows: number): void;
    /** Composites the given color onto the sub-cell pixel at (x, y). */
    setPixel(x: number, y: number, color: TerminalColor): void;
    /** Places a literal character in the given cell with the given color. */
    setChar(col: number, row: number, char: string, color: TerminalColor): void;
    /** Clears all pixels, characters, and colors from the grid. */
    clear(): void;
    /** Serializes the grid to a terminal-ready string (ANSI-colored by default). */
    serialize(options?: SerializeOptions): string;
    /** Rasterizes the current grid to environment-agnostic RGBA pixel data. */
    toImageData(): ImageData;
}

/** Options for constructing a {@link BrailleRasterizer}. */
export interface BrailleRasterizerOptions {
    /**
     * The color residual alpha is composited against when a cell resolves its color. A terminal's
     * real background is unknowable, so this stands in for it. Defaults to opaque black.
     */
    background?: ColorRGBA;
}

/** Each braille cell is 2 pixels wide and 4 pixels tall. */
export const BRAILLE_CELL_WIDTH = 2;

/** Each braille cell is 2 pixels wide and 4 pixels tall. */
export const BRAILLE_CELL_HEIGHT = 4;

/** Constructs an `ImageData` in browsers, or a structurally-compatible object in headless environments. */
function createImageData(data: Uint8ClampedArray<ArrayBuffer>, width: number, height: number): ImageData {
    if (typeof ImageData !== 'undefined') {
        return new ImageData(data, width, height);
    }

    return {
        data,
        width,
        height,
        colorSpace: 'srgb',
    } as ImageData;
}

/** Builds a truecolor SGR foreground sequence for the given channels. */
function toAnsiForeground(red: number, green: number, blue: number): string {
    return `\x1b[38;2;${red};${green};${blue}m`;
}

/**
 * Braille-dot rasterizer. Each terminal cell encodes a 2×4 grid of sub-pixel dots via Unicode
 * braille patterns (U+2800–U+28FF).
 *
 * Pixels are held as an RGBA framebuffer at dot resolution and composited source-over, so two
 * shapes overlapping inside one cell blend rather than the later one taking the whole cell. A cell
 * emits a single color — that is what a character can express — resolved as the alpha-weighted mean
 * of its lit dots.
 */
export class BrailleRasterizer implements Rasterizer {

    #ansiCache = new Map<number, string>();

    private _cols: number;
    private _rows: number;
    private _background: ColorRGBA;
    private _pixels: Uint8ClampedArray<ArrayBuffer>;
    private _defaults: Uint8Array;
    private _chars: Map<number, {
        char: string;
        color: TerminalColor;
    }>;

    /** Total pixel width of the grid (columns times cell width). */
    public get pixelWidth() {
        return this._cols * BRAILLE_CELL_WIDTH;
    }

    /** Total pixel height of the grid (rows times cell height). */
    public get pixelHeight() {
        return this._rows * BRAILLE_CELL_HEIGHT;
    }

    /** Width of one braille cell, in pixels. */
    public get cellWidth() {
        return BRAILLE_CELL_WIDTH;
    }

    /** Height of one braille cell, in pixels. */
    public get cellHeight() {
        return BRAILLE_CELL_HEIGHT;
    }

    constructor(cols: number, rows: number, options?: BrailleRasterizerOptions) {
        this._cols = cols;
        this._rows = rows;
        this._background = options?.background ?? DEFAULT_BACKGROUND;
        this._pixels = new Uint8ClampedArray(this.pixelWidth * this.pixelHeight * 4);
        this._defaults = new Uint8Array(this.pixelWidth * this.pixelHeight);
        this._chars = new Map();
    }

    /** Composites `color` over the pixel at `offset`, recording whether it asked for the default foreground. */
    private _compositePixel(offset: number, color: TerminalColor): void {
        const pixels = this._pixels;

        if (!color) {
            this._defaults[offset >> 2] = 1;
            pixels[offset + 3] = 255;
            return;
        }

        const [red, green, blue, alpha] = color;
        const source = Math.min(1, Math.max(0, alpha));
        const destination = pixels[offset + 3] / 255;
        const composite = source + destination * (1 - source);

        if (!composite) {
            return;
        }

        pixels[offset] = (red * source + pixels[offset] * destination * (1 - source)) / composite;
        pixels[offset + 1] = (green * source + pixels[offset + 1] * destination * (1 - source)) / composite;
        pixels[offset + 2] = (blue * source + pixels[offset + 2] * destination * (1 - source)) / composite;
        pixels[offset + 3] = composite * 255;
    }

    /**
     * Resolves a cell's dot bits and the single color a character can express: the alpha-weighted
     * mean of its lit dots, composited against the assumed background by their mean opacity.
     *
     * Dots painted in the terminal's own foreground contribute no color of their own, so a cell made
     * only of those reports an empty sequence and serializes as a reset.
     */
    private _resolveCell(col: number, row: number): {
        dots: number;
        color: string;
    } {
        const pixels = this._pixels;
        const width = this.pixelWidth;

        let dots = 0;
        let lit = 0;
        let weight = 0;
        let red = 0;
        let green = 0;
        let blue = 0;

        for (let dy = 0; dy < BRAILLE_CELL_HEIGHT; dy++) {
            for (let dx = 0; dx < BRAILLE_CELL_WIDTH; dx++) {
                const index = (row * BRAILLE_CELL_HEIGHT + dy) * width + col * BRAILLE_CELL_WIDTH + dx;
                const offset = index * 4;
                const alpha = pixels[offset + 3];

                if (!alpha) {
                    continue;
                }

                dots |= BRAILLE_DOT_MAP[dy][dx];

                if (this._defaults[index]) {
                    continue;
                }

                lit += 1;
                weight += alpha;
                red += pixels[offset] * alpha;
                green += pixels[offset + 1] * alpha;
                blue += pixels[offset + 2] * alpha;
            }
        }

        if (!weight) {
            return {
                dots,
                color: '',
            };
        }

        return {
            dots,
            color: this._toAnsi(red / weight, green / weight, blue / weight, weight / lit / 255),
        };
    }

    /** Composites a color against the assumed background and caches the resulting escape sequence. */
    private _toAnsi(red: number, green: number, blue: number, alpha: number): string {
        const [backdropRed, backdropGreen, backdropBlue] = this._background;
        const weight = Math.min(1, Math.max(0, alpha));

        const key = (Math.round(red * weight + backdropRed * (1 - weight)) << 16)
            | (Math.round(green * weight + backdropGreen * (1 - weight)) << 8)
            | Math.round(blue * weight + backdropBlue * (1 - weight));

        const cached = this.#ansiCache.get(key);

        if (cached) {
            return cached;
        }

        const sequence = toAnsiForeground((key >> 16) & 0xff, (key >> 8) & 0xff, key & 0xff);

        this.#ansiCache.set(key, sequence);

        return sequence;
    }

    /** Resizes the grid to the given columns and rows, discarding all existing contents. */
    public resize(cols: number, rows: number): void {
        this._cols = cols;
        this._rows = rows;
        this._pixels = new Uint8ClampedArray(this.pixelWidth * this.pixelHeight * 4);
        this._defaults = new Uint8Array(this.pixelWidth * this.pixelHeight);
        this._chars = new Map();
    }

    /** Composites `color` onto the braille dot covering pixel (x, y); out-of-bounds and non-finite pixels are ignored. */
    public setPixel(x: number, y: number, color: TerminalColor): void {
        const px = Math.round(x);
        const py = Math.round(y);

        // NaN passes every comparison below, and then indexes the framebuffer out of range.
        if (!Number.isFinite(px) || !Number.isFinite(py)) {
            return;
        }

        if (px < 0 || py < 0 || px >= this.pixelWidth || py >= this.pixelHeight) {
            return;
        }

        this._compositePixel((py * this.pixelWidth + px) * 4, color);
    }

    /** Places a literal character in the given cell, overriding its braille dots; out-of-bounds cells are ignored. */
    public setChar(col: number, row: number, char: string, color: TerminalColor): void {
        if (col < 0 || row < 0 || col >= this._cols || row >= this._rows) {
            return;
        }

        this._chars.set(row * this._cols + col, {
            char,
            color,
        });
    }

    /** Clears all pixels, characters, and colors from the grid. */
    public clear(): void {
        this._pixels.fill(0);
        this._defaults.fill(0);
        this._chars.clear();
    }

    /** Resolves the escape sequence a glyph overlay should be drawn in. */
    private _charColor(color: TerminalColor): string {
        if (!color) {
            return '';
        }

        const [red, green, blue, alpha] = color;

        return this._toAnsi(red, green, blue, alpha);
    }

    private _serializeRow(row: number): string {
        let output = '';
        let lastColor = '';

        // An uncolored cell must actively reset, or it inherits the previous cell's SGR forever.
        const setColor = (color: string) => {
            if (color === lastColor) {
                return;
            }

            output += color || ANSI_RESET;
            lastColor = color;
        };

        for (let col = 0; col < this._cols; col++) {
            const charEntry = this._chars.get(row * this._cols + col);

            if (charEntry) {
                setColor(this._charColor(charEntry.color));
                output += charEntry.char;
                continue;
            }

            const cell = this._resolveCell(col, row);

            if (cell.dots === 0) {
                setColor('');
                output += ' ';
                continue;
            }

            setColor(cell.color);
            output += String.fromCharCode(BRAILLE_BASE + cell.dots);
        }

        return lastColor ? `${output}${ANSI_RESET}` : output;
    }

    private _serializePlainRow(row: number): string {
        let output = '';

        for (let col = 0; col < this._cols; col++) {
            const charEntry = this._chars.get(row * this._cols + col);

            if (charEntry) {
                output += charEntry.char;
                continue;
            }

            const dots = this._resolveCell(col, row).dots;

            output += dots === 0 ? ' ' : String.fromCharCode(BRAILLE_BASE + dots);
        }

        return output;
    }

    /**
     * Serializes the grid to a string, including ANSI color and cursor codes unless `ansi` is
     * disabled. The ANSI form erases past the end of every row and past the last row, so a grid that
     * has shrunk since the previous frame does not leave the old output stranded on screen.
     */
    public serialize(options?: SerializeOptions): string {
        const ansi = options?.ansi ?? true;

        if (!ansi) {
            const lines: string[] = [];

            for (let row = 0; row < this._rows; row++) {
                lines.push(this._serializePlainRow(row));
            }

            return lines.join('\n');
        }

        let output = '';

        for (let row = 0; row < this._rows; row++) {
            // Position cursor at the start of each row (1-indexed), then erase the columns beyond it.
            output += `\x1b[${row + 1};1H${this._serializeRow(row)}${ANSI_ERASE_LINE_END}`;
        }

        // Nothing else overwrites rows the grid no longer covers, so a shrink would strand them.
        return `${output}\x1b[${this._rows + 1};1H${ANSI_ERASE_DISPLAY_END}`;
    }

    /**
     * Rasterizes the grid to environment-agnostic RGBA pixel data. A glyph occupies a whole cell,
     * which is 2×4 pixels here — far too small for a legible letterform — so each one rasterizes as
     * a filled block. Text reads as a solid bar rather than disappearing from the image entirely.
     */
    public toImageData(): ImageData {
        const width = this.pixelWidth;
        const height = this.pixelHeight;
        const data = new Uint8ClampedArray(this._pixels);

        for (let index = 0; index < this._defaults.length; index++) {
            if (!this._defaults[index]) {
                continue;
            }

            const offset = index * 4;

            data[offset] = DEFAULT_RGB[0];
            data[offset + 1] = DEFAULT_RGB[1];
            data[offset + 2] = DEFAULT_RGB[2];
        }

        this._chars.forEach(({ char, color }, cellIndex) => {
            if (!char.trim()) {
                return;
            }

            const col = cellIndex % this._cols;
            const row = (cellIndex - col) / this._cols;
            const rgb = color ? [color[0], color[1], color[2]] : DEFAULT_RGB;

            for (let dy = 0; dy < BRAILLE_CELL_HEIGHT; dy++) {
                for (let dx = 0; dx < BRAILLE_CELL_WIDTH; dx++) {
                    if (!(BRAILLE_ALL_DOTS & BRAILLE_DOT_MAP[dy][dx])) {
                        continue;
                    }

                    const offset = ((row * BRAILLE_CELL_HEIGHT + dy) * width + col * BRAILLE_CELL_WIDTH + dx) * 4;

                    data[offset] = rgb[0];
                    data[offset + 1] = rgb[1];
                    data[offset + 2] = rgb[2];
                    data[offset + 3] = 255;
                }
            }
        });

        return createImageData(data, width, height);
    }

}
