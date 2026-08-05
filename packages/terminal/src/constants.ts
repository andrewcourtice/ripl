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
export const BRAILLE_BASE = 0x2800;

/** Dot bit per (row, column) within a braille cell, indexed `[dy][dx]`. */
export const BRAILLE_DOT_MAP = [
    [0x01, 0x08],
    [0x02, 0x10],
    [0x04, 0x20],
    [0x40, 0x80],
];

/** Every dot of a braille cell, used to stand in for a glyph when rasterizing to pixels. */
export const BRAILLE_ALL_DOTS = 0xff;

/** Fallback RGB used when a cell has no stored color (matches a light terminal foreground). */
export const DEFAULT_RGB: [number, number, number] = [230, 230, 230];

/** Erases from the cursor to the end of the line, clearing columns a narrower grid no longer covers. */
export const ANSI_ERASE_LINE_END = '\x1b[K';

/** Erases from the cursor to the end of the display, clearing rows a shorter grid no longer covers. */
export const ANSI_ERASE_DISPLAY_END = '\x1b[J';

/** Matches an ANSI truecolor foreground escape (`\x1b[38;2;r;g;bm`), capturing its RGB components. */
export const ANSI_TRUECOLOR_REGEX = /38;2;(\d+);(\d+);(\d+)/;
