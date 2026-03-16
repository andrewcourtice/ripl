import {
    ANSI_RESET,
} from './color';

/** Abstract rasterizer interface for converting pixel data to terminal characters. */
export interface Rasterizer {
    readonly pixelWidth: number;
    readonly pixelHeight: number;
    resize(cols: number, rows: number): void;
    setPixel(x: number, y: number, color: string): void;
    setChar(col: number, row: number, char: string, color: string): void;
    clear(): void;
    serialize(): string;
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

/** Braille-dot rasterizer. Each terminal cell encodes a 2×4 grid of sub-pixel dots via Unicode braille patterns (U+2800–U+28FF). */
export class BrailleRasterizer implements Rasterizer {

    private cols: number;
    private rows: number;
    private dots: Uint8Array;
    private colors: string[];
    private chars: Map<number, {
        char: string;
        color: string;
    }>;


    public get pixelWidth() {
        return this.cols * BRAILLE_CELL_WIDTH;
    }

    public get pixelHeight() {
        return this.rows * BRAILLE_CELL_HEIGHT;
    }

    constructor(cols: number, rows: number) {
        this.cols = cols;
        this.rows = rows;

        const cellCount = cols * rows;

        this.dots = new Uint8Array(cellCount);
        this.colors = new Array(cellCount).fill('');
        this.chars = new Map();
    }

    public resize(cols: number, rows: number): void {
        this.cols = cols;
        this.rows = rows;

        const cellCount = cols * rows;

        this.dots = new Uint8Array(cellCount);
        this.colors = new Array(cellCount).fill('');
        this.chars = new Map();
    }

    public setPixel(x: number, y: number, color: string): void {
        const px = Math.round(x);
        const py = Math.round(y);

        if (px < 0 || py < 0 || px >= this.pixelWidth || py >= this.pixelHeight) {
            return;
        }

        const col = (px / BRAILLE_CELL_WIDTH) | 0;
        const row = (py / BRAILLE_CELL_HEIGHT) | 0;
        const dx = px % BRAILLE_CELL_WIDTH;
        const dy = py % BRAILLE_CELL_HEIGHT;
        const cellIndex = row * this.cols + col;

        this.dots[cellIndex] |= BRAILLE_DOT_MAP[dy][dx];

        if (color) {
            this.colors[cellIndex] = color;
        }
    }

    public setChar(col: number, row: number, char: string, color: string): void {
        if (col < 0 || row < 0 || col >= this.cols || row >= this.rows) {
            return;
        }

        this.chars.set(row * this.cols + col, {
            char,
            color,
        });
    }

    public clear(): void {
        this.dots.fill(0);
        this.colors.fill('');
        this.chars.clear();
    }

    public serialize(): string {
        let output = '';

        for (let row = 0; row < this.rows; row++) {
            // Position cursor at the start of each row (1-indexed)
            output += `\x1b[${row + 1};1H`;

            let lastColor = '';

            for (let col = 0; col < this.cols; col++) {
                const cellIndex = row * this.cols + col;
                const charEntry = this.chars.get(cellIndex);

                if (charEntry) {
                    if (charEntry.color !== lastColor) {
                        output += charEntry.color;
                        lastColor = charEntry.color;
                    }

                    output += charEntry.char;
                    continue;
                }

                const dotBits = this.dots[cellIndex];

                if (dotBits === 0) {
                    if (lastColor) {
                        output += ANSI_RESET;
                        lastColor = '';
                    }

                    output += ' ';
                    continue;
                }

                const color = this.colors[cellIndex];

                if (color !== lastColor) {
                    output += color;
                    lastColor = color;
                }

                output += String.fromCharCode(BRAILLE_BASE + dotBits);
            }

            if (lastColor) {
                output += ANSI_RESET;
            }
        }

        return output;
    }

}
