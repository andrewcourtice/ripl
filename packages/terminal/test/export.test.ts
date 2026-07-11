import {
    beforeEach,
    describe,
    expect,
    test,
} from 'vitest';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

import {
    BrailleRasterizer,
} from '../src/rasterizer';

import {
    createContext,
} from '../src/context';

import type {
    TerminalOutput,
} from '../src/output';

polyfillPath2D();

function createMockOutput(cols = 40, rows = 12): TerminalOutput {
    return {
        write() {
            // noop
        },
        columns: cols,
        rows,
    };
}

describe('Terminal export', () => {

    describe('BrailleRasterizer.serialize', () => {

        test('Should omit ANSI escape codes when ansi is false', () => {
            const rasterizer = new BrailleRasterizer(10, 4);

            rasterizer.setPixel(0, 0, '\x1b[38;2;255;0;0m');

            const plain = rasterizer.serialize({
                ansi: false,
            });

            expect(plain).not.toContain('\x1b');
        });

        test('Should still emit ANSI codes by default', () => {
            const rasterizer = new BrailleRasterizer(10, 4);

            rasterizer.setPixel(0, 0, '\x1b[38;2;255;0;0m');

            expect(rasterizer.serialize()).toContain('\x1b');
        });

    });

    describe('BrailleRasterizer.toImageData', () => {

        test('Should return pixel data at the braille resolution', () => {
            const rasterizer = new BrailleRasterizer(10, 4);
            const image = rasterizer.toImageData();

            expect(image.width).toBe(rasterizer.pixelWidth);
            expect(image.height).toBe(rasterizer.pixelHeight);
            expect(image.data.length).toBe(rasterizer.pixelWidth * rasterizer.pixelHeight * 4);
        });

        test('Should render a set pixel with its parsed truecolor', () => {
            const rasterizer = new BrailleRasterizer(10, 4);

            rasterizer.setPixel(2, 3, '\x1b[38;2;10;20;30m');

            const image = rasterizer.toImageData();
            const offset = (3 * rasterizer.pixelWidth + 2) * 4;

            expect(image.data[offset]).toBe(10);
            expect(image.data[offset + 1]).toBe(20);
            expect(image.data[offset + 2]).toBe(30);
            expect(image.data[offset + 3]).toBe(255);
        });

        test('Should leave unset pixels transparent', () => {
            const rasterizer = new BrailleRasterizer(10, 4);
            const image = rasterizer.toImageData();

            expect(image.data[3]).toBe(0);
        });

    });

    describe('TerminalContext.export', () => {

        beforeEach(() => {
            mockCanvasContext();
        });

        test('Should expose string, url, and image exporters', async () => {
            const context = createContext(createMockOutput());
            const exported = context.export();

            expect(typeof exported.toString()).toBe('string');
            expect(typeof exported.toURL()).toBe('string');

            const image = await exported.toImage();

            expect(image.width).toBeGreaterThan(0);
            expect(image.height).toBeGreaterThan(0);
        });

    });

});
