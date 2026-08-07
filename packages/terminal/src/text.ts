import type {
    TerminalTransform,
} from './transform';

/** A glyph run laid out onto the character grid. */
export interface GlyphRun {
    /** The characters to draw, after any `maxWidth` truncation. */
    content: string;
    /** Column of the first glyph. */
    col: number;
    /** Row of the first glyph. */
    row: number;
    /** Columns to advance between glyphs. */
    stepCol: number;
    /** Rows to advance between glyphs. */
    stepRow: number;
}

/** Options describing the text run to lay out. */
export interface GlyphRunOptions {
    /** The text to lay out. */
    content: string;
    /** X coordinate of the text's anchor, in logical space. */
    x: number;
    /** Y coordinate of the text's anchor, in logical space. */
    y: number;
    /** Maximum run length in logical units, beyond which the content is truncated. */
    maxWidth?: number;
    /** The logical-to-raster mapping in force. */
    transform: TerminalTransform;
    /** Width of one character cell, in raster pixels. */
    cellWidth: number;
    /** Height of one character cell, in raster pixels. */
    cellHeight: number;
    /** How the run is anchored horizontally. */
    textAlign: string;
    /** How the run is anchored vertically. */
    textBaseline: string;
}

/** Fraction of the run length to shift the anchor back by, per `textAlign` (LTR). */
const TEXT_ALIGN_FACTORS: Record<string, number> = {
    left: 0,
    start: 0,
    center: 0.5,
    right: 1,
    end: 1,
};

/** Number of cells to shift the anchor back by, per `textBaseline` (glyphs are one cell tall). */
const TEXT_BASELINE_FACTORS: Record<string, number> = {
    top: 0,
    hanging: 0,
    middle: 0.5,
    alphabetic: 1,
    ideographic: 1,
    bottom: 1,
};

/** Angular size of each of the eight directions a glyph run can be snapped to. */
const DIRECTION_STEP = Math.PI / 4;

/**
 * Snaps the run's direction to the nearest of eight compass directions.
 *
 * A glyph fills a whole character cell and cannot itself be rotated, so a rotated run can only
 * advance along the grid. Snapping to eight directions rather than one is what lets a y-axis title
 * rotated by a quarter turn read down the side of a chart instead of straight across it.
 */
function snapDirection(dx: number, dy: number): [number, number] {
    const angle = Math.round(Math.atan2(dy, dx) / DIRECTION_STEP) * DIRECTION_STEP;

    return [Math.round(Math.cos(angle)), Math.round(Math.sin(angle))];
}

/**
 * Lays a text run onto the character grid, honoring the current transform.
 *
 * The anchor is mapped through the transform, and the run then advances one cell at a time along
 * the transform's own x axis, snapped to the grid.
 *
 * @param options - The run to lay out and the state to lay it out against.
 * @returns The laid-out run, or `undefined` when nothing is left to draw.
 */
export function layoutGlyphRun(options: GlyphRunOptions): GlyphRun | undefined {
    const {
        content,
        x,
        y,
        maxWidth,
        transform,
        cellWidth,
        cellHeight,
        textAlign,
        textBaseline,
    } = options;

    const limit = maxWidth ? Math.floor(transform.scalar(maxWidth) / cellWidth) : undefined;
    const text = limit === undefined ? content : content.slice(0, Math.max(0, limit));

    if (!text) {
        return undefined;
    }

    const anchor = transform.point(x, y);
    const [stepCol, stepRow] = snapDirection(transform.matrix[0], transform.matrix[1]);

    const alignFactor = TEXT_ALIGN_FACTORS[textAlign] ?? 0;
    const baselineFactor = TEXT_BASELINE_FACTORS[textBaseline] ?? 1;

    // The baseline shifts across the run, so it follows the direction perpendicular to it.
    const alignShift = text.length * alignFactor;

    return {
        content: text,
        col: Math.round(anchor.x / cellWidth - stepCol * alignShift + stepRow * baselineFactor),
        row: Math.round(anchor.y / cellHeight - stepRow * alignShift - stepCol * baselineFactor),
        stepCol,
        stepRow,
    };
}
