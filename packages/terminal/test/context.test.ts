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
    comparitorNumeric,
} from '@ripl/utilities';

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

import {
    createMockOutput,
    createSpyRasterizer,
} from './helpers';

polyfillPath2D();

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

    test('reports the logical dimensions, not the braille grid', () => {
        const output = createMockOutput(40, 12);
        const ctx = createContext(output, {
            logicalWidth: 400,
            logicalHeight: 300,
        });

        expect(ctx.width).toBe(400);
        expect(ctx.height).toBe(300);
    });

    test('maps the logical space into the raster with a uniform, centered scale', () => {
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

    // `Element.intersectsWith` maps hit points through these, so the letterbox offset must survive.
    test('round-trips a point through the letterbox mapping', () => {
        const output = createMockOutput(80, 10);
        const ctx = createContext(output, {
            logicalWidth: 100,
            logicalHeight: 100,
        });

        ([[0, 0], [10, 10], [50, 25], [100, 100]] as [number, number][]).forEach(([x, y]) => {
            const [surfaceX, surfaceY] = ctx.toSurfacePoint(x, y);
            const [logicalX, logicalY] = ctx.toLogicalPoint(surfaceX, surfaceY);

            expect(logicalX).toBeCloseTo(x, 6);
            expect(logicalY).toBeCloseTo(y, 6);

            const [drawnX, drawnY] = ctx.toLogicalPoint(ctx.scaleX(x), ctx.scaleY(y));

            expect(drawnX).toBeCloseTo(x, 6);
            expect(drawnY).toBeCloseTo(y, 6);
        });
    });

    test('maps a point to the same place the scales draw it', () => {
        const output = createMockOutput(80, 10);
        const ctx = createContext(output, {
            logicalWidth: 100,
            logicalHeight: 100,
        });

        ([[0, 0], [10, 10], [50, 25], [100, 100]] as [number, number][]).forEach(([x, y]) => {
            expect(ctx.toSurfacePoint(x, y)).toEqual([ctx.scaleX(x), ctx.scaleY(y)]);
        });
    });

    test('round-trips a point when no logical size is given', () => {
        const output = createMockOutput(40, 12);
        const ctx = createContext(output);

        expect(ctx.toSurfacePoint(37, 21)).toEqual([37, 21]);
        expect(ctx.toLogicalPoint(37, 21)).toEqual([37, 21]);
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
        const rasterizer = createSpyRasterizer(40, 12);
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

        return rasterizer.chars;
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

describe('TerminalContext paint resolution', () => {

    beforeEach(() => {
        mockCanvasContext();
    });

    /** Fills a 6×6 rect through a spy rasterizer and returns what reached the grid. */
    function fillRect(configure: (ctx: TerminalContext) => void) {
        const rasterizer = createSpyRasterizer(20, 5);
        const ctx = createContext(createMockOutput(20, 5), {
            rasterizer,
        });

        configure(ctx);

        const path = ctx.createPath();

        path.rect(0, 0, 6, 6);

        ctx.markRenderStart();
        ctx.applyFill(path);
        ctx.markRenderEnd();

        return rasterizer;
    }

    // Every one of these was rasterized at full strength: nothing treated "no color" as "no paint".
    test('Should draw nothing for a transparent fill', () => {
        expect(fillRect(ctx => {
            ctx.fill = 'transparent';
        }).pixels).toHaveLength(0);
    });

    test('Should draw nothing for a "none" fill', () => {
        expect(fillRect(ctx => {
            ctx.fill = 'none';
        }).pixels).toHaveLength(0);
    });

    test('Should draw nothing for a zero-alpha fill', () => {
        expect(fillRect(ctx => {
            ctx.fill = 'rgba(255, 0, 0, 0)';
        }).pixels).toHaveLength(0);
    });

    // opacity was composited by the pipeline and read by nobody, so chart crosshairs parked at
    // opacity 0 were permanently visible.
    test('Should draw nothing at zero opacity', () => {
        expect(fillRect(ctx => {
            ctx.fill = '#ff0000';
            ctx.opacity = 0;
        }).pixels).toHaveLength(0);
    });

    test('Should attenuate the emitted color by opacity', () => {
        const { pixels } = fillRect(ctx => {
            ctx.fill = '#ff0000';
            ctx.opacity = 0.5;
        });

        expect(pixels.length).toBeGreaterThan(0);
        expect(pixels[0][2]).toBe('\x1b[38;2;128;0;0m');
    });

    test('Should still draw at full opacity', () => {
        const { pixels } = fillRect(ctx => {
            ctx.fill = '#ff0000';
        });

        expect(pixels.length).toBeGreaterThan(0);
        expect(pixels[0][2]).toBe('\x1b[38;2;255;0;0m');
    });

    test('Should resolve a named fill to a truecolor escape', () => {
        expect(fillRect(ctx => {
            ctx.fill = 'red';
        }).pixels[0][2]).toBe('\x1b[38;2;255;0;0m');
    });

    test('Should resolve a shorthand hex fill to a truecolor escape', () => {
        expect(fillRect(ctx => {
            ctx.fill = '#f00';
        }).pixels[0][2]).toBe('\x1b[38;2;255;0;0m');
    });

    test('Should resolve a gradient fill to its first stop', () => {
        expect(fillRect(ctx => {
            ctx.fill = 'linear-gradient(90deg, #ff0000, #0000ff)';
        }).pixels[0][2]).toBe('\x1b[38;2;255;0;0m');
    });

    test('Should still draw an unresolvable fill, uncolored', () => {
        const { pixels } = fillRect(ctx => {
            ctx.fill = 'currentColor';
        });

        expect(pixels.length).toBeGreaterThan(0);
        expect(pixels[0][2]).toBe('');
    });

    // applyFill also ran the outline pass, painting a pixel beyond the even-odd interior in the
    // fill color — and painting something for a degenerate, zero-area fill.
    test('Should paint nothing for an open, zero-area fill', () => {
        const rasterizer = createSpyRasterizer(20, 5);
        const ctx = createContext(createMockOutput(20, 5), {
            rasterizer,
        });

        ctx.fill = '#ff0000';

        const path = ctx.createPath();

        path.moveTo(0, 0);
        path.lineTo(10, 0);

        ctx.markRenderStart();
        ctx.applyFill(path);
        ctx.markRenderEnd();

        expect(rasterizer.pixels).toHaveLength(0);
    });

    test('Should keep a filled rect within its geometric bounds', () => {
        const { pixels } = fillRect(ctx => {
            ctx.fill = '#ff0000';
        });

        expect(Math.min(...pixels.map(([x]) => x))).toBeGreaterThanOrEqual(0);
        expect(Math.max(...pixels.map(([x]) => x))).toBeLessThanOrEqual(6);
        expect(Math.max(...pixels.map(([, y]) => y))).toBeLessThanOrEqual(6);
    });

});

describe('TerminalContext stroked text', () => {

    beforeEach(() => {
        mockCanvasContext();
    });

    // Text.render prefers stroke over fill, and applyStroke had no ContextText branch, so an
    // outlined label produced no output at all rather than degrading.
    test('Should render glyphs for text with a stroke', () => {
        const rasterizer = createSpyRasterizer(20, 5);
        const ctx = createContext(createMockOutput(20, 5), {
            rasterizer,
        });

        ctx.stroke = '#ff0000';
        ctx.textBaseline = 'top';

        ctx.markRenderStart();
        ctx.applyStroke(ctx.createText({
            content: 'label',
            x: 0,
            y: 0,
        }));
        ctx.markRenderEnd();

        expect(rasterizer.text()).toBe('label');
    });

    test('Should render stroked glyphs in the stroke color', () => {
        const rasterizer = createSpyRasterizer(20, 5);
        const ctx = createContext(createMockOutput(20, 5), {
            rasterizer,
        });

        ctx.stroke = '#ff0000';
        ctx.textBaseline = 'top';

        ctx.markRenderStart();
        ctx.applyStroke(ctx.createText({
            content: 'ab',
            x: 0,
            y: 0,
        }));
        ctx.markRenderEnd();

        expect(rasterizer.chars[0][3]).toBe('\x1b[38;2;255;0;0m');
    });

    test('Should draw nothing for text with a transparent stroke', () => {
        const rasterizer = createSpyRasterizer(20, 5);
        const ctx = createContext(createMockOutput(20, 5), {
            rasterizer,
        });

        ctx.stroke = 'transparent';

        ctx.markRenderStart();
        ctx.applyStroke(ctx.createText({
            content: 'ab',
            x: 0,
            y: 0,
        }));
        ctx.markRenderEnd();

        expect(rasterizer.chars).toHaveLength(0);
    });

});

describe('TerminalContext ellipse geometry', () => {

    beforeEach(() => {
        mockCanvasContext();
    });

    /** Strokes a path through a spy rasterizer and returns the plotted pixels. */
    function strokePath(build: (path: ReturnType<TerminalContext['createPath']>) => void) {
        const rasterizer = createSpyRasterizer(40, 12);
        const ctx = createContext(createMockOutput(40, 12), {
            rasterizer,
        });

        ctx.stroke = '#ffffff';

        const path = ctx.createPath();

        build(path);

        ctx.markRenderStart();
        ctx.applyStroke(path);
        ctx.markRenderEnd();

        return rasterizer.pixels;
    }

    // Both command passes read only args[0..3], so the sweep and rotation an Ellipse element
    // forwards were dropped and every ellipse drew whole and upright.
    test('Should honor the sweep angles', () => {
        const pixels = strokePath(path => path.ellipse(20, 20, 15, 5, 0, 0, Math.PI, false));

        expect(Math.min(...pixels.map(([, y]) => y))).toBeGreaterThanOrEqual(20);
    });

    test('Should honor the rotation', () => {
        const upright = strokePath(path => path.ellipse(20, 20, 15, 5, 0, 0, Math.PI * 2, false));
        const rotated = strokePath(path => path.ellipse(20, 20, 15, 5, Math.PI / 2, 0, Math.PI * 2, false));

        expect(Math.max(...upright.map(([x]) => x))).toBeCloseTo(35, 0);
        expect(Math.max(...rotated.map(([x]) => x))).toBeCloseTo(25, 0);
    });

    test('Should still draw a full ellipse when given a full sweep', () => {
        const pixels = strokePath(path => path.ellipse(20, 20, 15, 5, 0, 0, Math.PI * 2, false));

        expect(Math.min(...pixels.map(([, y]) => y))).toBeCloseTo(15, 0);
        expect(Math.max(...pixels.map(([, y]) => y))).toBeCloseTo(25, 0);
    });

});

describe('TerminalContext line dash', () => {

    beforeEach(() => {
        mockCanvasContext();
    });

    /** Strokes a horizontal line through a spy rasterizer and returns the plotted x coordinates. */
    function strokeLine(configure: (ctx: TerminalContext) => void): number[] {
        const rasterizer = createSpyRasterizer(20, 5);
        const ctx = createContext(createMockOutput(20, 5), {
            rasterizer,
        });

        ctx.stroke = '#ffffff';
        configure(ctx);

        const path = ctx.createPath();

        path.moveTo(0, 0);
        path.lineTo(19, 0);

        ctx.markRenderStart();
        ctx.applyStroke(path);
        ctx.markRenderEnd();

        return rasterizer.pixels.map(([x]) => x);
    }

    // A dashed reference line was indistinguishable from a solid data line.
    test('Should leave gaps in a dashed stroke', () => {
        const dashed = strokeLine(ctx => {
            ctx.lineDash = [2, 2];
        });

        expect(dashed).toEqual([0, 1, 4, 5, 8, 9, 12, 13, 16, 17]);
    });

    test('Should draw a solid stroke with no dash pattern', () => {
        expect(strokeLine(() => {})).toHaveLength(20);
    });

    test('Should shift the pattern by lineDashOffset', () => {
        const dashed = strokeLine(ctx => {
            ctx.lineDash = [2, 2];
            ctx.lineDashOffset = 2;
        });

        expect(dashed[0]).toBe(2);
    });

    test('Should not dash a fill', () => {
        const rasterizer = createSpyRasterizer(20, 5);
        const ctx = createContext(createMockOutput(20, 5), {
            rasterizer,
        });

        ctx.fill = '#ffffff';
        ctx.lineDash = [2, 2];

        const path = ctx.createPath();

        path.rect(0, 0, 6, 6);

        ctx.markRenderStart();
        ctx.applyFill(path);
        ctx.markRenderEnd();

        const row = rasterizer.pixels.filter(([, y]) => y === 3).map(([x]) => x);

        expect(row).toEqual([0, 1, 2, 3, 4, 5, 6]);
    });

});

describe('TerminalContext line width', () => {

    beforeEach(() => {
        mockCanvasContext();
    });

    /** Strokes a horizontal line through a spy rasterizer and returns its de-duplicated dots. */
    function strokeLine(configure: (ctx: TerminalContext) => void): [number, number][] {
        const rasterizer = createSpyRasterizer(20, 5);
        const ctx = createContext(createMockOutput(20, 5), {
            rasterizer,
        });

        ctx.stroke = '#ffffff';
        configure(ctx);

        const path = ctx.createPath();

        path.moveTo(0, 10);
        path.lineTo(19, 10);

        ctx.markRenderStart();
        ctx.applyStroke(path);
        ctx.markRenderEnd();

        // The spy records every call; the real rasterizer ORs repeats into one dot.
        const seen = new Set(rasterizer.pixels.map(([x, y]) => `${x},${y}`));

        return [...seen].map(key => key.split(',').map(Number) as [number, number]);
    }

    /** Counts the distinct rows the stroke occupies in a column clear of its round caps. */
    function thicknessAt(dots: [number, number][], x: number): number {
        return dots.filter(dot => dot[0] === x).length;
    }

    // A Sankey link encodes its flow magnitude entirely in lineWidth, so a hairline loses the data.
    test('Should stroke wider than one dot when lineWidth asks for it', () => {
        expect(thicknessAt(strokeLine(() => {}), 10)).toBe(1);

        expect(thicknessAt(strokeLine(ctx => {
            ctx.lineWidth = 3;
        }), 10)).toBe(3);

        expect(thicknessAt(strokeLine(ctx => {
            ctx.lineWidth = 5;
        }), 10)).toBe(5);
    });

    test('Should keep a thick stroke centred on its path', () => {
        const rows = strokeLine(ctx => {
            ctx.lineWidth = 5;
        }).filter(dot => dot[0] === 10).map(dot => dot[1]);

        expect(Math.min(...rows)).toBe(8);
        expect(Math.max(...rows)).toBe(12);
    });

    // Thickening inside the dash gate would advance the pattern once per stamped dot rather than
    // per centreline dot, shredding the pattern into far more, far shorter runs. The gap is wider
    // than the widest brush here, since round caps legitimately bridge a gap narrower than they are.
    test('Should keep the dash pattern at the same period for any width', () => {
        const runs = (width: number) => {
            const columns = [...new Set(strokeLine(ctx => {
                ctx.lineDash = [4, 8];
                ctx.lineWidth = width;
            }).map(dot => dot[0]))].sort(comparitorNumeric);

            return columns.filter((column, index) => index === 0 || column !== columns[index - 1] + 1).length;
        };

        expect(runs(1)).toBe(2);
        expect(runs(3)).toBe(2);
        expect(runs(5)).toBe(2);
    });

    test('Should thicken a dashed stroke within each dash', () => {
        const dashed = strokeLine(ctx => {
            ctx.lineDash = [4, 8];
            ctx.lineWidth = 3;
        });

        expect(thicknessAt(dashed, 1)).toBe(3);
    });

    test('Should leave fills at their traced geometry', () => {
        const rasterizer = createSpyRasterizer(20, 5);
        const ctx = createContext(createMockOutput(20, 5), {
            rasterizer,
        });

        ctx.fill = '#ffffff';
        ctx.lineWidth = 9;

        const path = ctx.createPath();

        path.rect(2, 2, 6, 6);

        ctx.markRenderStart();
        ctx.applyFill(path);
        ctx.markRenderEnd();

        expect(rasterizer.pixels.every(([x]) => x >= 2 && x <= 8)).toBe(true);
    });

});

describe('TerminalContext sizing', () => {

    beforeEach(() => {
        mockCanvasContext();
    });

    // The resize handler forwarded the terminal's new size unconditionally, so a deliberately
    // fixed-size viewport silently became full-screen on the first SIGWINCH.
    test('Should keep an explicit grid size across a resize', () => {
        const output = createMockOutput(100, 40);
        const ctx = createContext(output, {
            width: 20,
            height: 10,
        });

        output.notifyResize(100, 41);

        expect(ctx.width).toBe(20 * BRAILLE_CELL_WIDTH);
        expect(ctx.height).toBe(10 * BRAILLE_CELL_HEIGHT);
    });

    test('Should still follow the terminal when no explicit size is given', () => {
        const output = createMockOutput(40, 12);
        const ctx = createContext(output);

        output.notifyResize(80, 24);

        expect(ctx.width).toBe(80 * BRAILLE_CELL_WIDTH);
        expect(ctx.height).toBe(24 * BRAILLE_CELL_HEIGHT);
    });

    // rescale reset the scales to identity and emitted `resize` synchronously, so a listener that
    // repainted saw the new rasterScale against the old, offset-free scales.
    test('Should have the letterbox mapping installed before resize is emitted', () => {
        const output = createMockOutput(40, 12);
        const ctx = createContext(output, {
            logicalWidth: 400,
            logicalHeight: 300,
        });

        let observed = 0;

        ctx.on('resize', () => {
            observed = ctx.scaleX(0);
        });

        output.notifyResize(80, 24);

        expect(observed).toBe(ctx.scaleX(0));
        expect(observed).toBeGreaterThan(0);
    });

    test('Should paint a resize repaint where the next explicit render paints', () => {
        const output = createMockOutput(40, 12);
        const rasterizer = createSpyRasterizer(40, 12);
        const ctx = createContext(output, {
            rasterizer,
            logicalWidth: 400,
            logicalHeight: 300,
        });

        const paint = () => {
            const path = ctx.createPath();

            path.rect(0, 0, 400, 300);

            ctx.markRenderStart();
            ctx.applyStroke(path);
            ctx.markRenderEnd();
        };

        ctx.stroke = '#ffffff';

        const during = ctx.on('resize', paint);

        output.notifyResize(80, 24);

        const resizePixels = rasterizer.pixels.map(([x, y]) => `${x},${y}`);

        during.dispose();
        rasterizer.clear();
        paint();

        expect(resizePixels).toEqual(rasterizer.pixels.map(([x, y]) => `${x},${y}`));
    });

});

describe('TerminalContext lifecycle', () => {

    beforeEach(() => {
        mockCanvasContext();
    });

    test('reset should clear the grid as well as the drawing state', () => {
        const output = createMockOutput(20, 5);
        const ctx = createContext(output);

        ctx.fill = '#ff0000';

        const path = ctx.createPath();

        path.rect(0, 0, 6, 6);

        ctx.markRenderStart();
        ctx.applyFill(path);
        ctx.markRenderEnd();

        expect(ctx.export().toString()).toMatch(/[⠁-⣿]/);

        ctx.reset();

        expect(ctx.export().toString()).not.toMatch(/[⠁-⣿]/);
    });

    test('reset should restore the default drawing state', () => {
        const ctx = createContext(createMockOutput());

        ctx.fill = '#ff0000';
        ctx.save();
        ctx.reset();

        expect(ctx.fill).not.toBe('#ff0000');
    });

    // Nothing wrote a final reset, so a colored last frame could leave the user's shell colored
    // after the process exited.
    test('destroy should reset SGR state and show the cursor', () => {
        const output = createMockOutput(20, 5);
        const ctx = createContext(output);

        ctx.destroy();

        const last = output.written[output.written.length - 1];

        expect(last).toContain('\x1b[0m');
        expect(last).toContain('\x1b[?25h');
    });

    test('destroy should park the cursor below the grid', () => {
        const output = createMockOutput(20, 5);
        const ctx = createContext(output);

        ctx.destroy();

        expect(output.written[output.written.length - 1]).toContain('\x1b[6;1H');
    });

    // Group.render leaves the render depth unbalanced on a throw, and the terminal gates its only
    // flush on depth 0 — so a single exception used to freeze the display for the whole session.
    test('an unbalanced markRenderEnd should not stop later frames flushing', () => {
        const output = createMockOutput(20, 5);
        const ctx = createContext(output);

        ctx.markRenderEnd();
        output.written.length = 0;

        ctx.fill = '#ff0000';

        const path = ctx.createPath();

        path.rect(0, 0, 6, 6);

        ctx.markRenderStart();
        ctx.applyFill(path);
        ctx.markRenderEnd();

        expect(output.written.join('')).toMatch(/[⠁-⣿]/);
    });

});

describe('TerminalContext contract', () => {

    beforeEach(() => {
        mockCanvasContext();
    });

    // Terminal paths are inert command recorders, so there is nothing to rebuild each frame.
    test('Should allow path caching', () => {
        expect(createContext(createMockOutput()).supportsPathCaching).toBe(true);
    });

    // The backend applies no transform, so a hit point is already in the space it drew in.
    test('Should report that hit testing honors transforms', () => {
        expect(createContext(createMockOutput()).hitTestHonorsTransform).toBe(true);
    });

    test.todo('Should hit a translated element at its drawn, untranslated position once hit testing exists');

    test('Should warn once when a transform is discarded', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const ctx = createContext(createMockOutput());

        ctx.translate(10, 20);
        ctx.rotate(Math.PI / 2);
        ctx.scale(2, 2);

        expect(warn).toHaveBeenCalledOnce();

        warn.mockRestore();
    });

    test('Should not warn for an identity transform', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const ctx = createContext(createMockOutput());

        ctx.translate(0, 0);
        ctx.rotate(0);
        ctx.scale(1, 1);
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.transform(1, 0, 0, 1, 0, 0);

        expect(warn).not.toHaveBeenCalled();

        warn.mockRestore();
    });

    test('Should warn for a non-identity matrix', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const ctx = createContext(createMockOutput());

        ctx.transform(1, 0, 0, 1, 30, 0);

        expect(warn).toHaveBeenCalledOnce();

        warn.mockRestore();
    });

    // destination-out means canvas erases where the terminal draws: inverted, not degraded.
    test('Should warn once for destination-out compositing', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const ctx = createContext(createMockOutput(20, 5));

        ctx.fill = '#ff0000';
        ctx.globalCompositeOperation = 'destination-out';

        const path = ctx.createPath();

        path.rect(0, 0, 6, 6);

        ctx.applyFill(path);
        ctx.applyFill(path);

        expect(warn).toHaveBeenCalledOnce();

        warn.mockRestore();
    });

    test('Should not warn for the default compositing mode', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const ctx = createContext(createMockOutput(20, 5));

        ctx.fill = '#ff0000';

        const path = ctx.createPath();

        path.rect(0, 0, 6, 6);

        ctx.applyFill(path);

        expect(warn).not.toHaveBeenCalled();

        warn.mockRestore();
    });

});
