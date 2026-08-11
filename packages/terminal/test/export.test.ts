import {
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

        test('Should render a set pixel with its own color', () => {
            const rasterizer = new BrailleRasterizer(10, 4);

            rasterizer.setPixel(2, 3, [10, 20, 30, 1]);

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

        // The loop read only the dot grid, so every glyph placed by setChar — axis labels, legend
        // labels, titles — was missing from the exported image while toString() showed them.
        test('Should render a character cell so glyphs survive the export', () => {
            const rasterizer = new BrailleRasterizer(4, 1);

            rasterizer.setChar(0, 0, 'X', [10, 20, 30, 1]);

            const image = rasterizer.toImageData();

            expect(image.data[0]).toBe(10);
            expect(image.data[1]).toBe(20);
            expect(image.data[2]).toBe(30);
            expect(image.data[3]).toBe(255);
        });

        test('Should fill the whole cell for a glyph', () => {
            const rasterizer = new BrailleRasterizer(4, 1);

            rasterizer.setChar(0, 0, 'X', [10, 20, 30, 1]);

            const image = rasterizer.toImageData();
            const alphas = [];

            for (let y = 0; y < 4; y++) {
                for (let x = 0; x < 2; x++) {
                    alphas.push(image.data[(y * image.width + x) * 4 + 3]);
                }
            }

            expect(alphas.every(alpha => alpha === 255)).toBe(true);
        });

        test('Should leave a whitespace glyph transparent', () => {
            const rasterizer = new BrailleRasterizer(4, 1);

            rasterizer.setChar(0, 0, ' ', '\x1b[38;2;10;20;30m');

            expect(rasterizer.toImageData().data[3]).toBe(0);
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

        test('Should mint the URL once so release has a single handle to revoke', () => {
            const context = createContext(createMockOutput());
            const exported = context.export();

            expect(exported.toURL()).toBe(exported.toURL());
        });

        test('Should expose a release hook', () => {
            const context = createContext(createMockOutput());
            const exported = context.export();

            exported.toURL();

            expect(exported.release).toBeTypeOf('function');
            expect(() => exported.release?.()).not.toThrow();
        });

        test('Should revoke the object URL it handed out', () => {
            const dataURL = vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,AA==');
            const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:terminal-export');
            const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
            const context = createContext(createMockOutput());
            const exported = context.export();

            expect(exported.toURL()).toBe('blob:terminal-export');

            exported.release?.();

            expect(revoke).toHaveBeenCalledWith('blob:terminal-export');

            dataURL.mockRestore();
            create.mockRestore();
            revoke.mockRestore();
        });

        test('Should not revoke a data URL fallback', () => {
            const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
            const context = createContext(createMockOutput());
            const exported = context.export();

            expect(exported.toURL()).toMatch(/^data:/);

            exported.release?.();

            expect(revoke).not.toHaveBeenCalled();

            revoke.mockRestore();
        });

        test('Should tolerate repeated release calls', () => {
            const context = createContext(createMockOutput());
            const exported = context.export();

            exported.toURL();
            exported.release?.();

            expect(() => exported.release?.()).not.toThrow();
        });

    });

});
