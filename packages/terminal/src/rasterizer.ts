import {
    ANSI_RESET,
} from './color';

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
    /** Resizes the grid to the given number of terminal columns and rows, clearing its contents. */
    resize(cols: number, rows: number): void;
    /** Sets the sub-cell pixel at (x, y) to the given color. */
    setPixel(x: number, y: number, color: string): void;
    /** Places a literal character in the given cell with the given color. */
    setChar(col: number, row: number, char: string, color: string): void;
    /** Clears all pixels, characters, and colors from the grid. */
    clear(): void;
    /** Serializes the grid to a terminal-ready string (ANSI-colored by default). */
    serialize(options?: SerializeOptions): string;
    /** Rasterizes the current grid to environment-agnostic RGBA pixel data. */
    toImageData(): ImageData;
}

/**
 * Braille dot layout per cell (2 wide × 4 tall):
 *
 * ```
 * [0,0] [1,0]    bit 0  bit 3
 * [0,1] [1,1]    bit 1  bit 4
 * [0,2] [1,2]    bit 2  bit 5
 * [0,3] [1,3]    bit 6  bit 7
 * ```
 */
const BRAILLE_BASE = 0x2800;

const BRAILLE_DOT_MAP = [
    [0x01, 0x08],
    [0x02, 0x10],
    [0x04, 0x20],
    [0x40, 0x80],
];

/** Each braille cell is 2 pixels wide and 4 pixels tall. */
export const BRAILLE_CELL_WIDTH = 2;

/** Each braille cell is 2 pixels wide and 4 pixels tall. */
export const BRAILLE_CELL_HEIGHT = 4;

/** Fallback RGB used when a cell has no stored color (matches a light terminal foreground). */
const DEFAULT_RGB: [number, number, number] = [230, 230, 230];

/** Erases from the cursor to the end of the line, clearing columns a narrower grid no longer covers. */
const ANSI_ERASE_LINE_END = '\x1b[K';

/** Erases from the cursor to the end of the display, clearing rows a shorter grid no longer covers. */
const ANSI_ERASE_DISPLAY_END = '\x1b[J';

/** Every dot of a braille cell, used to stand in for a glyph when rasterizing to pixels. */
const BRAILLE_ALL_DOTS = 0xff;

const ANSI_TRUECOLOR_REGEX = /38;2;(\d+);(\d+);(\d+)/;

/** Parses an ANSI truecolor foreground escape (`\x1b[38;2;r;g;bm`) back to an RGB tuple. */
function parseAnsiColor(ansi: string): [number, number, number] {
    const match = ANSI_TRUECOLOR_REGEX.exec(ansi);

    if (!match) {
        return DEFAULT_RGB;
    }

    return [Number(match[1]), Number(match[2]), Number(match[3])];
}

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

/** Writes the set dots of a single braille cell into an RGBA pixel buffer. */
function plotBrailleCell(data: Uint8ClampedArray, width: number, col: number, row: number, dotBits: number, rgb: [number, number, number]): void {
    for (let dy = 0; dy < BRAILLE_CELL_HEIGHT; dy++) {
        for (let dx = 0; dx < BRAILLE_CELL_WIDTH; dx++) {
            if (!(dotBits & BRAILLE_DOT_MAP[dy][dx])) {
                continue;
            }

            const px = col * BRAILLE_CELL_WIDTH + dx;
            const py = row * BRAILLE_CELL_HEIGHT + dy;
            const offset = (py * width + px) * 4;

            data[offset] = rgb[0];
            data[offset + 1] = rgb[1];
            data[offset + 2] = rgb[2];
            data[offset + 3] = 255;
        }
    }
}

/** Braille-dot rasterizer. Each terminal cell encodes a 2×4 grid of sub-pixel dots via Unicode braille patterns (U+2800–U+28FF). */
export class BrailleRasterizer implements Rasterizer {

    private _cols: number;
    private _rows: number;
    private _dots: Uint8Array;
    private _colors: string[];
    private _chars: Map<number, {
        char: string;
        color: string;
    }>;


    /** Total pixel width of the grid (columns times cell width). */
    public get pixelWidth() {
        return this._cols * BRAILLE_CELL_WIDTH;
    }

    /** Total pixel height of the grid (rows times cell height). */
    public get pixelHeight() {
        return this._rows * BRAILLE_CELL_HEIGHT;
    }

    constructor(cols: number, rows: number) {
        this._cols = cols;
        this._rows = rows;

        const cellCount = cols * rows;

        this._dots = new Uint8Array(cellCount);
        this._colors = new Array(cellCount).fill('');
        this._chars = new Map();
    }

    /** Resizes the grid to the given columns and rows, discarding all existing contents. */
    public resize(cols: number, rows: number): void {
        this._cols = cols;
        this._rows = rows;

        const cellCount = cols * rows;

        this._dots = new Uint8Array(cellCount);
        this._colors = new Array(cellCount).fill('');
        this._chars = new Map();
    }

    /** Sets the braille dot covering pixel (x, y) and stores its color; out-of-bounds and non-finite pixels are ignored. */
    public setPixel(x: number, y: number, color: string): void {
        const px = Math.round(x);
        const py = Math.round(y);

        // NaN passes every comparison below, and then indexes the dot map out of range.
        if (!Number.isFinite(px) || !Number.isFinite(py)) {
            return;
        }

        if (px < 0 || py < 0 || px >= this.pixelWidth || py >= this.pixelHeight) {
            return;
        }

        const col = (px / BRAILLE_CELL_WIDTH) | 0;
        const row = (py / BRAILLE_CELL_HEIGHT) | 0;
        const dx = px % BRAILLE_CELL_WIDTH;
        const dy = py % BRAILLE_CELL_HEIGHT;
        const cellIndex = row * this._cols + col;

        this._dots[cellIndex] |= BRAILLE_DOT_MAP[dy][dx];

        if (color) {
            this._colors[cellIndex] = color;
        }
    }

    /** Places a literal character in the given cell, overriding its braille dots; out-of-bounds cells are ignored. */
    public setChar(col: number, row: number, char: string, color: string): void {
        if (col < 0 || row < 0 || col >= this._cols || row >= this._rows) {
            return;
        }

        this._chars.set(row * this._cols + col, {
            char,
            color,
        });
    }

    /** Clears all dots, characters, and colors from the grid. */
    public clear(): void {
        this._dots.fill(0);
        this._colors.fill('');
        this._chars.clear();
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
            const cellIndex = row * this._cols + col;
            const charEntry = this._chars.get(cellIndex);

            if (charEntry) {
                setColor(charEntry.color);
                output += charEntry.char;
                continue;
            }

            const dotBits = this._dots[cellIndex];

            if (dotBits === 0) {
                setColor('');
                output += ' ';
                continue;
            }

            setColor(this._colors[cellIndex]);
            output += String.fromCharCode(BRAILLE_BASE + dotBits);
        }

        return lastColor ? `${output}${ANSI_RESET}` : output;
    }

    private _serializePlainRow(row: number): string {
        let output = '';

        for (let col = 0; col < this._cols; col++) {
            const cellIndex = row * this._cols + col;
            const charEntry = this._chars.get(cellIndex);

            if (charEntry) {
                output += charEntry.char;
                continue;
            }

            const dotBits = this._dots[cellIndex];

            output += dotBits === 0 ? ' ' : String.fromCharCode(BRAILLE_BASE + dotBits);
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
        const data = new Uint8ClampedArray(width * height * 4);

        for (let row = 0; row < this._rows; row++) {
            for (let col = 0; col < this._cols; col++) {
                const cellIndex = row * this._cols + col;
                const charEntry = this._chars.get(cellIndex);

                if (charEntry) {
                    if (charEntry.char.trim()) {
                        plotBrailleCell(data, width, col, row, BRAILLE_ALL_DOTS, parseAnsiColor(charEntry.color));
                    }

                    continue;
                }

                const dotBits = this._dots[cellIndex];

                if (dotBits === 0) {
                    continue;
                }

                plotBrailleCell(data, width, col, row, dotBits, parseAnsiColor(this._colors[cellIndex]));
            }
        }

        return createImageData(data, width, height);
    }

}
