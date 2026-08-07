import {
    beforeEach,
    describe,
    expect,
    test,
} from 'vitest';

import {
    createText,
    matrixIdentity,
} from '@ripl/core';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

import {
    layoutGlyphRun,
} from '../src/text';

import {
    createTerminalTransform,
    letterboxMatrix,
} from '../src/transform';

import {
    createContext,
} from '../src/context';

import {
    createMockOutput,
    createSpyRasterizer,
} from './helpers';

polyfillPath2D();

/** Lays out a run against the identity transform and a 2×4 cell. */
function layout(content: string, options: Partial<Parameters<typeof layoutGlyphRun>[0]> = {}) {
    return layoutGlyphRun({
        content,
        x: 0,
        y: 0,
        transform: createTerminalTransform(matrixIdentity()),
        cellWidth: 2,
        cellHeight: 4,
        textAlign: 'left',
        textBaseline: 'top',
        ...options,
    });
}

describe('Glyph run layout', () => {

    test('Should advance left to right with no transform', () => {
        expect(layout('ABCD')).toMatchObject({
            content: 'ABCD',
            col: 0,
            row: 0,
            stepCol: 1,
            stepRow: 0,
        });
    });

    test('Should shift the anchor back by the alignment factor', () => {
        expect(layout('ABCD', {
            x: 40,
            textAlign: 'center',
        })?.col).toBe(18);

        expect(layout('ABCD', {
            x: 40,
            textAlign: 'right',
        })?.col).toBe(16);
    });

    test('Should shift the row by the baseline factor', () => {
        expect(layout('ABCD', {
            y: 8,
            textBaseline: 'bottom',
        })?.row).toBe(1);

        expect(layout('ABCD', {
            y: 8,
            textBaseline: 'top',
        })?.row).toBe(2);
    });

    test('Should advance down the column for a quarter turn', () => {
        const run = layout('ABCD', {
            transform: createTerminalTransform(matrixIdentity(), [0, 1, -1, 0, 0, 0]),
        });

        expect(run?.stepCol).toBe(0);
        expect(run?.stepRow).toBe(1);
    });

    // Canvas rotates the glyphs, so a run advancing upward still reads forwards there. Upright
    // glyphs cannot, so this used to spell the content bottom-to-top.
    test('Should advance down the column for a negative quarter turn', () => {
        const run = layout('ABCD', {
            transform: createTerminalTransform(matrixIdentity(), [0, -1, 1, 0, 0, 0]),
        });

        expect(run?.stepCol).toBe(0);
        expect(run?.stepRow).toBe(1);
    });

    test('Should advance left to right for a half turn', () => {
        const run = layout('ABCD', {
            transform: createTerminalTransform(matrixIdentity(), [-1, 0, 0, -1, 0, 0]),
        });

        expect(run?.stepCol).toBe(1);
        expect(run?.stepRow).toBe(0);
    });

    test('Should advance diagonally for an eighth turn', () => {
        const angle = Math.PI / 4;
        const run = layout('ABCD', {
            transform: createTerminalTransform(matrixIdentity(), [Math.cos(angle), Math.sin(angle), -Math.sin(angle), Math.cos(angle), 0, 0]),
        });

        expect(run?.stepCol).toBe(1);
        expect(run?.stepRow).toBe(1);
    });

    test('Should never read right-to-left or bottom-to-top, whatever the rotation', () => {
        for (let step = 0; step < 16; step++) {
            const angle = (step * Math.PI) / 8;
            const run = layout('ABCD', {
                transform: createTerminalTransform(matrixIdentity(), [Math.cos(angle), Math.sin(angle), -Math.sin(angle), Math.cos(angle), 0, 0]),
            })!;

            expect(run.stepCol).toBeGreaterThanOrEqual(0);
            expect(run.stepCol === 0 && run.stepRow < 0).toBe(false);
        }
    });

    // Flipping a backwards run reverses the order glyphs are placed in; it must not move the run.
    test('Should occupy the cells the unflipped run would have, in reverse', () => {
        const run = layout('ABCD', {
            transform: createTerminalTransform(matrixIdentity(), [0, -1, 1, 0, 0, 0]),
        })!;

        const cells = Array.from({
            length: run.content.length,
        }, (unused, index) => [run.content[index], run.col + run.stepCol * index, run.row + run.stepRow * index]);

        // Advancing up from row 0 would have put A at 0 and D at -3; reading down, D lands at 0.
        expect(cells).toEqual([
            ['A', 0, -3],
            ['B', 0, -2],
            ['C', 0, -1],
            ['D', 0, 0],
        ]);
    });

    test('Should truncate the run to maxWidth', () => {
        expect(layout('ABCDEFGH', {
            maxWidth: 8,
        })?.content).toBe('ABCD');
    });

    test('Should lay out nothing for empty content', () => {
        expect(layout('')).toBeUndefined();
    });

    test('Should measure maxWidth through the transform', () => {
        expect(layout('ABCDEFGH', {
            maxWidth: 8,
            transform: createTerminalTransform(letterboxMatrix(2, 0, 0)),
        })?.content).toBe('ABCDEFGH');
    });

});

describe('TerminalContext rotated text', () => {

    beforeEach(() => {
        mockCanvasContext();
    });

    test('Should run a quarter-turn text element down a single column', () => {
        const rasterizer = createSpyRasterizer(40, 12);
        const context = createContext(createMockOutput(40, 12), {
            rasterizer,
        });

        context.batch(() => createText({
            fill: '#ffffff',
            x: 20,
            y: 4,
            content: 'RIPL',
            rotation: Math.PI / 2,
            transformOriginX: 20,
            transformOriginY: 4,
            textBaseline: 'top',
        }).render(context));

        const columns = new Set(rasterizer.chars.map(([col]) => col));
        const rows = rasterizer.chars.map(([, row]) => row);

        expect(rasterizer.text()).toBe('RIPL');
        expect(columns.size).toBe(1);
        expect(rows).toEqual([...rows].sort((a, b) => a - b));
        expect(new Set(rows).size).toBe(4);
    });

    test('Should leave unrotated text running along the row', () => {
        const rasterizer = createSpyRasterizer(40, 12);
        const context = createContext(createMockOutput(40, 12), {
            rasterizer,
        });

        context.batch(() => createText({
            fill: '#ffffff',
            x: 20,
            y: 4,
            content: 'RIPL',
            textBaseline: 'top',
        }).render(context));

        expect(new Set(rasterizer.chars.map(([, row]) => row)).size).toBe(1);
        expect(rasterizer.chars.map(([col]) => col)).toEqual([10, 11, 12, 13]);
    });

});
