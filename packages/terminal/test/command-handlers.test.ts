import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

import {
    createContext,
} from '../src/context';

import type {
    TerminalOutput,
} from '../src/output';

polyfillPath2D();

function createMockOutput(cols = 30, rows = 10): TerminalOutput & { written: string[] } {
    return {
        written: [],
        write(data: string) {
            this.written.push(data);
        },
        columns: cols,
        rows,
    };
}

const BRAILLE = /[⠀-⣿]/;

/**
 * Exercises the object-keyed command dispatch (TERMINAL_COMMAND_HANDLERS) that replaced the two
 * parallel `switch (cmd.type)` statements. Each command type is driven through both the outline
 * pass (applyStroke → rasterize) and the fill pass (applyFill → toContour).
 */
describe('terminal path command dispatch', () => {

    beforeEach(() => mockCanvasContext());
    afterEach(() => vi.restoreAllMocks());

    function drawAll() {
        const output = createMockOutput();
        const ctx = createContext(output);

        ctx.stroke = '#ffffff';
        ctx.fill = '#ffffff';

        const path = ctx.createPath();

        path.moveTo(2, 2);
        path.lineTo(20, 2);
        path.arc(10, 6, 4, 0, Math.PI * 2);
        path.ellipse(14, 8, 5, 3, 0, 0, Math.PI * 2);
        path.bezierCurveTo(2, 2, 8, 10, 20, 6);
        path.quadraticCurveTo(6, 2, 18, 10);
        path.rect(2, 2, 10, 6);
        path.closePath();

        return {
            ctx,
            path,
            output,
        };
    }

    test('rasterizes every command type via applyStroke', () => {
        const { ctx, path, output } = drawAll();

        ctx.markRenderStart();
        expect(() => ctx.applyStroke(path)).not.toThrow();
        ctx.markRenderEnd();

        expect(output.written.join('')).toMatch(BRAILLE);
    });

    test('builds contours for every command type via applyFill', () => {
        const { ctx, path, output } = drawAll();

        ctx.markRenderStart();
        expect(() => ctx.applyFill(path)).not.toThrow();
        ctx.markRenderEnd();

        expect(output.written.join('')).toMatch(BRAILLE);
    });

    test('a full-circle arc rasterizes as a circle', () => {
        const output = createMockOutput();
        const ctx = createContext(output);

        ctx.stroke = '#ffffff';

        const path = ctx.createPath();

        path.arc(12, 5, 4, 0, Math.PI * 2);

        ctx.markRenderStart();
        ctx.applyStroke(path);
        ctx.markRenderEnd();

        expect(output.written.join('')).toMatch(BRAILLE);
    });

});
