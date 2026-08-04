import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    ANSI_RESET,
    colorToAnsiBg,
    colorToAnsiFg,
} from '../src/color';

describe('ANSI_RESET', () => {

    test('Should equal the SGR reset sequence', () => {
        expect(ANSI_RESET).toBe('\x1b[0m');
    });

});

describe('colorToAnsiFg', () => {

    test('Should convert hex color to truecolor foreground sequence', () => {
        expect(colorToAnsiFg('#ff0000')).toBe('\x1b[38;2;255;0;0m');
    });

    test('Should convert black hex', () => {
        expect(colorToAnsiFg('#000000')).toBe('\x1b[38;2;0;0;0m');
    });

    test('Should convert white hex', () => {
        expect(colorToAnsiFg('#ffffff')).toBe('\x1b[38;2;255;255;255m');
    });

    test('Should convert rgb() notation', () => {
        expect(colorToAnsiFg('rgb(128, 64, 32)')).toBe('\x1b[38;2;128;64;32m');
    });

    // `undefined` (do not paint) rather than `''` (paint, uncolored): the two were conflated, and
    // `applyFill` painted for both, so a `transparent` fill drew solid geometry.
    test('Should return undefined for empty input', () => {
        expect(colorToAnsiFg('')).toBeUndefined();
    });

    test('Should return undefined for "none"', () => {
        expect(colorToAnsiFg('none')).toBeUndefined();
    });

    test('Should return undefined for "transparent"', () => {
        expect(colorToAnsiFg('transparent')).toBeUndefined();
    });

    test('Should return undefined for a zero-alpha color', () => {
        expect(colorToAnsiFg('rgba(255, 0, 0, 0.0)')).toBeUndefined();
    });

    // The shared rgba/hsla/hsva patterns reject an integer alpha, so this parses as nothing at all
    // and has to be recognised as transparent before it reaches the parsers.
    test('Should return undefined for an integer zero alpha the shared parsers reject', () => {
        expect(colorToAnsiFg('rgba(255, 0, 0, 0)')).toBeUndefined();
        expect(colorToAnsiFg('hsla(0, 100%, 50%, 0)')).toBeUndefined();
    });

    test('Should return undefined for zero opacity', () => {
        expect(colorToAnsiFg('#ff0000', 0)).toBeUndefined();
    });

    test('Should return an empty string for a color it cannot resolve', () => {
        expect(colorToAnsiFg('currentColor')).toBe('');
    });

    test('Should resolve CSS named colors', () => {
        expect(colorToAnsiFg('red')).toBe('\x1b[38;2;255;0;0m');
        expect(colorToAnsiFg('white')).toBe('\x1b[38;2;255;255;255m');
        expect(colorToAnsiFg('steelblue')).toBe('\x1b[38;2;70;130;180m');
    });

    test('Should resolve a named color regardless of case or surrounding space', () => {
        expect(colorToAnsiFg('  ReD  ')).toBe('\x1b[38;2;255;0;0m');
    });

    test('Should resolve shorthand hex', () => {
        expect(colorToAnsiFg('#f00')).toBe('\x1b[38;2;255;0;0m');
        expect(colorToAnsiFg('#888')).toBe('\x1b[38;2;136;136;136m');
    });

    test('Should resolve a gradient to its first stop', () => {
        expect(colorToAnsiFg('linear-gradient(90deg, #ff0000, #0000ff)')).toBe('\x1b[38;2;255;0;0m');
    });

    test('Should resolve a pattern to its foreground', () => {
        expect(colorToAnsiFg('pattern(diagonal, #ff0000, #ffffff, 8)')).toBe('\x1b[38;2;255;0;0m');
    });

    // A transparent first stop does not make the paint invisible, and dropping it took a
    // mostly-opaque fill out of the output altogether.
    test('Should skip a transparent leading gradient stop', () => {
        expect(colorToAnsiFg('linear-gradient(transparent, red)')).toBe('\x1b[38;2;255;0;0m');
    });

    test('Should fall back to a pattern\'s background when its foreground is transparent', () => {
        expect(colorToAnsiFg('pattern(diagonal, transparent, #fff, 8)')).toBe('\x1b[38;2;255;255;255m');
    });

    test('Should return undefined for a wholly transparent gradient or pattern', () => {
        expect(colorToAnsiFg('linear-gradient(transparent, transparent)')).toBeUndefined();
        expect(colorToAnsiFg('pattern(diagonal, transparent, transparent, 8)')).toBeUndefined();
    });

    test('Should fall back to no color for a malformed gradient or pattern', () => {
        expect(colorToAnsiFg('linear-gradient()')).toBe('');
        expect(colorToAnsiFg('pattern()')).toBe('');
    });

    test('Should attenuate a color by its own alpha', () => {
        expect(colorToAnsiFg('rgba(200, 100, 50, 0.5)')).toBe('\x1b[38;2;100;50;25m');
    });

    test('Should attenuate a color by the supplied opacity', () => {
        expect(colorToAnsiFg('#ff0000', 0.5)).toBe('\x1b[38;2;128;0;0m');
    });

    test('Should composite the supplied opacity over the color\'s own alpha', () => {
        expect(colorToAnsiFg('rgba(255, 0, 0, 0.5)', 0.5)).toBe('\x1b[38;2;64;0;0m');
    });

});

describe('colorToAnsiBg', () => {

    test('Should convert hex color to truecolor background sequence', () => {
        expect(colorToAnsiBg('#00ff00')).toBe('\x1b[48;2;0;255;0m');
    });

    test('Should return undefined for empty input', () => {
        expect(colorToAnsiBg('')).toBeUndefined();
    });

    test('Should return undefined for "none"', () => {
        expect(colorToAnsiBg('none')).toBeUndefined();
    });

    test('Should return undefined for "transparent"', () => {
        expect(colorToAnsiBg('transparent')).toBeUndefined();
    });

    test('Should resolve CSS named colors', () => {
        expect(colorToAnsiBg('lime')).toBe('\x1b[48;2;0;255;0m');
    });

});
