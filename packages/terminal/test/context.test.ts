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

        const text = ctx.createText({
            content: 'Hi',
            x: 0,
            y: 0,
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
