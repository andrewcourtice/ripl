import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    ANSI_RESET,
} from '../src/color';

import {
    BRAILLE_CELL_HEIGHT,
    BRAILLE_CELL_WIDTH,
    BrailleRasterizer,
} from '../src/rasterizer';

describe('BrailleRasterizer', () => {

    // ── constructor & dimensions ──────────────────────────────────

    test('Should compute pixelWidth as cols * BRAILLE_CELL_WIDTH', () => {
        const rasterizer = new BrailleRasterizer(80, 24);

        expect(rasterizer.pixelWidth).toBe(80 * BRAILLE_CELL_WIDTH);
    });

    test('Should compute pixelHeight as rows * BRAILLE_CELL_HEIGHT', () => {
        const rasterizer = new BrailleRasterizer(80, 24);

        expect(rasterizer.pixelHeight).toBe(24 * BRAILLE_CELL_HEIGHT);
    });

    // ── setPixel ──────────────────────────────────────────────────

    test('Should set a pixel and produce a non-empty braille character', () => {
        const rasterizer = new BrailleRasterizer(10, 5);

        rasterizer.setPixel(0, 0, '\x1b[38;2;255;0;0m');

        const output = rasterizer.serialize();

        // Should contain a braille character (U+2800 range)
        expect(output).toMatch(/[\u2800-\u28FF]/);
    });

    test('Should ignore out-of-bounds pixels (negative)', () => {
        const rasterizer = new BrailleRasterizer(10, 5);

        rasterizer.setPixel(-1, -1, '\x1b[38;2;255;0;0m');

        const output = rasterizer.serialize();

        // No braille characters should appear
        expect(output).not.toMatch(/[\u2801-\u28FF]/);
    });

    test('Should ignore out-of-bounds pixels (beyond dimensions)', () => {
        const rasterizer = new BrailleRasterizer(10, 5);

        rasterizer.setPixel(999, 999, '\x1b[38;2;255;0;0m');

        const output = rasterizer.serialize();

        expect(output).not.toMatch(/[\u2801-\u28FF]/);
    });

    test('Should map pixel (0,0) to top-left braille dot (bit 0)', () => {
        const rasterizer = new BrailleRasterizer(10, 5);

        rasterizer.setPixel(0, 0, '');

        const output = rasterizer.serialize();

        // Bit 0 = 0x01, so braille char = U+2801
        expect(output).toContain('\u2801');
    });

    test('Should map pixel (1,0) to bit 3 of braille cell', () => {
        const rasterizer = new BrailleRasterizer(10, 5);

        rasterizer.setPixel(1, 0, '');

        const output = rasterizer.serialize();

        // Bit 3 = 0x08, so braille char = U+2808
        expect(output).toContain('\u2808');
    });

    test('Should combine multiple dots in the same cell', () => {
        const rasterizer = new BrailleRasterizer(10, 5);

        rasterizer.setPixel(0, 0, ''); // bit 0 = 0x01
        rasterizer.setPixel(1, 0, ''); // bit 3 = 0x08

        const output = rasterizer.serialize();

        // Combined: 0x01 | 0x08 = 0x09 → U+2809
        expect(output).toContain('\u2809');
    });

    // ── setChar ───────────────────────────────────────────────────

    test('Should override cell with a character', () => {
        const rasterizer = new BrailleRasterizer(10, 5);

        rasterizer.setChar(0, 0, 'X', '\x1b[38;2;255;255;255m');

        const output = rasterizer.serialize();

        expect(output).toContain('X');
    });

    test('Should ignore out-of-bounds chars', () => {
        const rasterizer = new BrailleRasterizer(10, 5);

        rasterizer.setChar(-1, 0, 'X', '');
        rasterizer.setChar(0, -1, 'X', '');
        rasterizer.setChar(100, 0, 'X', '');
        rasterizer.setChar(0, 100, 'X', '');

        const output = rasterizer.serialize();

        expect(output).not.toContain('X');
    });

    test('setChar should take priority over dots in the same cell', () => {
        const rasterizer = new BrailleRasterizer(10, 5);

        rasterizer.setPixel(0, 0, '');
        rasterizer.setChar(0, 0, 'A', '');

        const output = rasterizer.serialize();

        expect(output).toContain('A');
    });

    // ── clear ─────────────────────────────────────────────────────

    test('Should reset all state after clear', () => {
        const rasterizer = new BrailleRasterizer(10, 5);

        rasterizer.setPixel(0, 0, '\x1b[38;2;255;0;0m');
        rasterizer.setChar(1, 0, 'X', '');
        rasterizer.clear();

        const output = rasterizer.serialize();

        expect(output).not.toMatch(/[\u2801-\u28FF]/);
        expect(output).not.toContain('X');
    });

    // ── resize ────────────────────────────────────────────────────

    test('Should update dimensions and clear state on resize', () => {
        const rasterizer = new BrailleRasterizer(10, 5);

        rasterizer.setPixel(0, 0, '');
        rasterizer.resize(20, 10);

        expect(rasterizer.pixelWidth).toBe(20 * BRAILLE_CELL_WIDTH);
        expect(rasterizer.pixelHeight).toBe(10 * BRAILLE_CELL_HEIGHT);

        const output = rasterizer.serialize();

        expect(output).not.toMatch(/[\u2801-\u28FF]/);
    });

    // ── serialize ─────────────────────────────────────────────────

    test('Should produce cursor positioning sequences for each row', () => {
        const rasterizer = new BrailleRasterizer(5, 3);
        const output = rasterizer.serialize();

        expect(output).toContain('\x1b[1;1H');
        expect(output).toContain('\x1b[2;1H');
        expect(output).toContain('\x1b[3;1H');
    });

    test('Should emit ANSI reset after colored cells', () => {
        const rasterizer = new BrailleRasterizer(5, 1);

        rasterizer.setPixel(0, 0, '\x1b[38;2;255;0;0m');

        const output = rasterizer.serialize();

        expect(output).toContain(ANSI_RESET);
    });

    test('Empty grid should produce spaces for all cells', () => {
        const rasterizer = new BrailleRasterizer(3, 1);
        const output = rasterizer.serialize();

        // After cursor positioning, should have 3 spaces
        // eslint-disable-next-line no-control-regex
        const afterCursor = output.replace(/\x1b\[[^m]*[mH]/g, '');

        expect(afterCursor).toBe('   ');
    });

    test('Should include color escape before colored braille character', () => {
        const rasterizer = new BrailleRasterizer(3, 1);
        const color = '\x1b[38;2;0;255;0m';

        rasterizer.setPixel(0, 0, color);

        const output = rasterizer.serialize();

        expect(output).toContain(color);
    });

});
