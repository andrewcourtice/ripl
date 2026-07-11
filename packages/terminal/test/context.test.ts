import {
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    ContextText,
} from '@ripl/core';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

import {
    BRAILLE_CELL_HEIGHT,
    BRAILLE_CELL_WIDTH,
} from '../src/rasterizer';

import {
    TerminalPath,
} from '../src/path';

import {
    createContext,
    TerminalContext,
} from '../src/context';

import type {
    TerminalOutput,
} from '../src/output';

polyfillPath2D();

function createMockOutput(cols = 40, rows = 12): TerminalOutput & { written: string[] } {
    return {
        written: [],
        write(data: string) {
            this.written.push(data);
        },
        columns: cols,
        rows,
    };
}

describe('TerminalContext', () => {

    beforeEach(() => {
        mockCanvasContext();
    });

    // ── constructor ───────────────────────────────────────────────

    test('Should create with mock output', () => {
        const output = createMockOutput();
        const ctx = createContext(output);

        expect(ctx).toBeInstanceOf(TerminalContext);
    });

    test('Should use output dimensions for rasterizer by default', () => {
        const output = createMockOutput(40, 12);
        const ctx = createContext(output);

        expect(ctx.width).toBe(40 * BRAILLE_CELL_WIDTH);
        expect(ctx.height).toBe(12 * BRAILLE_CELL_HEIGHT);
    });

    test('Should use explicit width/height when provided', () => {
        const output = createMockOutput(40, 12);
        const ctx = createContext(output, {
            width: 20,
            height: 10,
        });

        expect(ctx.width).toBe(20 * BRAILLE_CELL_WIDTH);
        expect(ctx.height).toBe(10 * BRAILLE_CELL_HEIGHT);
    });

    // ── createPath ────────────────────────────────────────────────

    test('createPath should return a TerminalPath', () => {
        const output = createMockOutput();
        const ctx = createContext(output);
        const path = ctx.createPath();

        expect(path).toBeInstanceOf(TerminalPath);
    });

    test('createPath should accept a custom id', () => {
        const output = createMockOutput();
        const ctx = createContext(output);
        const path = ctx.createPath('my-path');

        expect(path.id).toBe('my-path');
    });

    // ── createText ────────────────────────────────────────────────

    test('createText should return a ContextText', () => {
        const output = createMockOutput();
        const ctx = createContext(output);
        const text = ctx.createText({
            content: 'hello',
            x: 0,
            y: 0,
        });

        expect(text).toBeInstanceOf(ContextText);
    });

    // ── measureText ───────────────────────────────────────────────

    test('measureText should return width based on character count', () => {
        const output = createMockOutput();
        const ctx = createContext(output);
        const metrics = ctx.measureText('hello');

        expect(metrics.width).toBe(5 * BRAILLE_CELL_WIDTH);
    });

    test('measureText should return correct ascent/descent', () => {
        const output = createMockOutput();
        const ctx = createContext(output);
        const metrics = ctx.measureText('test');

        expect(metrics.actualBoundingBoxAscent).toBe(BRAILLE_CELL_HEIGHT);
        expect(metrics.actualBoundingBoxDescent).toBe(0);
    });

    // ── clear ─────────────────────────────────────────────────────

    test('clear should write cursor-home escape to output', () => {
        const output = createMockOutput();
        const ctx = createContext(output);

        ctx.clear();

        expect(output.written).toContain('\x1b[H');
    });

    // ── onResize ──────────────────────────────────────────────────

    test('Should subscribe to resize events when output supports it', () => {
        const onResizeFn = vi.fn(() => vi.fn());
        const output: TerminalOutput = {
            write: vi.fn(),
            columns: 40,
            rows: 12,
            onResize: onResizeFn,
        };

        createContext(output);

        expect(onResizeFn).toHaveBeenCalledOnce();
    });

    // ── applyFill / applyStroke integration ───────────────────────

    test('applyStroke should rasterize path commands', () => {
        const output = createMockOutput(20, 5);
        const ctx = createContext(output);

        ctx.stroke = '#ff0000';

        const path = ctx.createPath();

        path.moveTo(0, 0);
        path.lineTo(10, 0);

        ctx.markRenderStart();
        ctx.applyStroke(path);
        ctx.markRenderEnd();

        // Output should have been written with braille content
        expect(output.written.length).toBeGreaterThan(0);

        const combined = output.written.join('');

        expect(combined).toMatch(/[\u2800-\u28FF]/);
    });

    test('applyFill on a TerminalPath should rasterize with fill', () => {
        const output = createMockOutput(20, 5);
        const ctx = createContext(output);

        ctx.fill = '#00ff00';

        const path = ctx.createPath();

        path.rect(0, 0, 8, 8);

        ctx.markRenderStart();
        ctx.applyFill(path);
        ctx.markRenderEnd();

        expect(output.written.length).toBeGreaterThan(0);

        const combined = output.written.join('');

        expect(combined).toMatch(/[\u2800-\u28FF]/);
    });

    test('applyFill on a ContextText should rasterize text', () => {
        const output = createMockOutput(20, 5);
        const ctx = createContext(output);

        ctx.fill = '#ffffff';

        // y is offset from the top edge so the default (alphabetic) baseline keeps the glyph on-grid.
        const text = ctx.createText({
            content: 'Hi',
            x: 0,
            y: 8,
        });

        ctx.markRenderStart();
        ctx.applyFill(text);
        ctx.markRenderEnd();

        const combined = output.written.join('');

        expect(combined).toContain('H');
        expect(combined).toContain('i');
    });

    // ── createContext factory ──────────────────────────────────────

    test('createContext factory should return a TerminalContext', () => {
        const output = createMockOutput();
        const ctx = createContext(output);

        expect(ctx).toBeInstanceOf(TerminalContext);
    });

});

describe('TerminalContext logical sizing', () => {

    beforeEach(() => {
        mockCanvasContext();
    });

    /** Captures every plotted pixel so tests can assert raster-space bounds. */
    function createSpyRasterizer(cols: number, rows: number) {
        const pixels: [number, number][] = [];

        return {
            pixels,
            pixelWidth: cols * BRAILLE_CELL_WIDTH,
            pixelHeight: rows * BRAILLE_CELL_HEIGHT,
            resize: vi.fn(),
            setPixel(x: number, y: number) {
                pixels.push([x, y]);
            },
            setChar: vi.fn(),
            clear: vi.fn(),
            serialize: () => '',
        };
    }

    test('reports the logical dimensions, not the braille grid', () => {
        const output = createMockOutput(40, 12);
        const ctx = createContext(output, {
            logicalWidth: 400,
            logicalHeight: 300,
        });

        expect(ctx.width).toBe(400);
        expect(ctx.height).toBe(300);
    });

    test('maps the logical space into the raster with a uniform, centred scale', () => {
        // 40×12 cells → 80×48 raster pixels; 400×300 logical → limiting axis is Y (48/300)
        const output = createMockOutput(40, 12);
        const ctx = createContext(output, {
            logicalWidth: 400,
            logicalHeight: 300,
        });

        const scale = 48 / 300;
        const scaledWidth = 400 * scale;
        const offsetX = (80 - scaledWidth) / 2;

        // Uniform factor on both axes (circles stay circular).
        expect(ctx.scaleX(400) - ctx.scaleX(0)).toBeCloseTo(scaledWidth, 6);
        expect(ctx.scaleY(300) - ctx.scaleY(0)).toBeCloseTo(48, 6);
        expect((ctx.scaleX(400) - ctx.scaleX(0)) / 400).toBeCloseTo((ctx.scaleY(300) - ctx.scaleY(0)) / 300, 6);

        // Letterboxed symmetrically on the non-limiting axis, flush on the limiting one.
        expect(ctx.scaleX(0)).toBeCloseTo(offsetX, 6);
        expect(ctx.scaleX(400)).toBeCloseTo(80 - offsetX, 6);
        expect(ctx.scaleY(0)).toBeCloseTo(0, 6);
        expect(ctx.scaleY(300)).toBeCloseTo(48, 6);
    });

    test('rasterizes logical-space geometry within the raster bounds', () => {
        const output = createMockOutput(40, 12);
        const rasterizer = createSpyRasterizer(40, 12);
        const ctx = createContext(output, {
            rasterizer,
            logicalWidth: 400,
            logicalHeight: 300,
        });

        ctx.stroke = '#ffffff';

        // A line spanning the full logical space — far outside a bare 80×48 raster.
        const path = ctx.createPath();
        path.moveTo(0, 0);
        path.lineTo(400, 300);

        ctx.markRenderStart();
        ctx.applyStroke(path);
        ctx.markRenderEnd();

        expect(rasterizer.pixels.length).toBeGreaterThan(0);

        const xs = rasterizer.pixels.map(([x]) => x);
        const ys = rasterizer.pixels.map(([, y]) => y);

        expect(Math.min(...xs)).toBeGreaterThanOrEqual(0);
        expect(Math.max(...xs)).toBeLessThanOrEqual(80);
        expect(Math.min(...ys)).toBeGreaterThanOrEqual(0);
        expect(Math.max(...ys)).toBeLessThanOrEqual(48);
    });

    test('measures text in logical units', () => {
        const output = createMockOutput(40, 12);
        const ctx = createContext(output, {
            logicalWidth: 400,
            logicalHeight: 300,
        });

        const scale = 48 / 300;
        const metrics = ctx.measureText('hello');

        expect(metrics.width).toBeCloseTo((5 * BRAILLE_CELL_WIDTH) / scale, 6);
    });

    test('re-applies the logical mapping when the output resizes', () => {
        let notifyResize: ((cols: number, rows: number) => void) | undefined;

        const output: TerminalOutput = {
            write: vi.fn(),
            columns: 40,
            rows: 12,
            onResize(callback) {
                notifyResize = callback;
                return () => {};
            },
        };

        const ctx = createContext(output, {
            logicalWidth: 400,
            logicalHeight: 300,
        });

        // Grow to 80×24 cells → 160×96 raster pixels; the logical size must not change.
        notifyResize?.(80, 24);

        expect(ctx.width).toBe(400);
        expect(ctx.height).toBe(300);
        // BrailleRasterizer.resize mutates its dimensions, so the mapping now targets 160×96.
        expect(ctx.scaleY(300) - ctx.scaleY(0)).toBeCloseTo(96, 6);
    });

    test('behaves exactly as before when no logical size is given', () => {
        const output = createMockOutput(40, 12);
        const ctx = createContext(output);

        expect(ctx.width).toBe(40 * BRAILLE_CELL_WIDTH);
        expect(ctx.height).toBe(12 * BRAILLE_CELL_HEIGHT);
        // Identity mapping.
        expect(ctx.scaleX(37)).toBe(37);
        expect(ctx.scaleY(21)).toBe(21);
        expect(ctx.measureText('hi').width).toBe(2 * BRAILLE_CELL_WIDTH);
    });

});

describe('TerminalContext text alignment', () => {

    beforeEach(() => {
        mockCanvasContext();
    });

    /** Renders text through the context and returns the captured `setChar(col, row, …)` calls. */
    function renderText(
        content: string,
        x: number,
        y: number,
        textAlign: 'left' | 'center' | 'right' | 'start' | 'end',
        textBaseline: 'top' | 'middle' | 'bottom' | 'alphabetic'
    ): [number, number, string, string][] {
        const output = createMockOutput(40, 12);
        const calls: [number, number, string, string][] = [];

        const rasterizer = {
            pixelWidth: 40 * BRAILLE_CELL_WIDTH,
            pixelHeight: 12 * BRAILLE_CELL_HEIGHT,
            resize: vi.fn(),
            setPixel: vi.fn(),
            setChar: (col: number, row: number, char: string, color: string) => {
                calls.push([col, row, char, color]);
            },
            clear: vi.fn(),
            serialize: () => '',
            toImageData: () => ({
                data: new Uint8ClampedArray(0),
                width: 0,
                height: 0,
            } as ImageData),
        };

        const ctx = createContext(output, {
            rasterizer,
        });

        // No logical size → identity scale, so col = round(x / cellWidth) before alignment.
        ctx.fill = '#ffffff';
        ctx.textAlign = textAlign;
        ctx.textBaseline = textBaseline;

        const text = ctx.createText({
            content,
            x,
            y,
        });

        ctx.markRenderStart();
        ctx.applyFill(text);
        ctx.markRenderEnd();

        return calls;
    }

    // 'ABCD' (width 4 cells) anchored at x=40 → base column 20, so shifts are exact cell counts.
    test('left/start alignment anchors the first character at the position', () => {
        expect(renderText('ABCD', 40, 20, 'left', 'top')[0][0]).toBe(20);
        expect(renderText('ABCD', 40, 20, 'start', 'top')[0][0]).toBe(20);
    });

    test('center alignment shifts the text left by half its width', () => {
        expect(renderText('ABCD', 40, 20, 'center', 'top')[0][0]).toBe(18);
    });

    test('right/end alignment shifts the text left by its full width', () => {
        expect(renderText('ABCD', 40, 20, 'right', 'top')[0][0]).toBe(16);
        expect(renderText('ABCD', 40, 20, 'end', 'top')[0][0]).toBe(16);
    });

    test('baseline shifts the row — bottom sits one cell above top', () => {
        const top = renderText('ABCD', 40, 20, 'left', 'top')[0][1];
        const bottom = renderText('ABCD', 40, 20, 'left', 'bottom')[0][1];

        expect(bottom).toBe(top - 1);
    });

});
