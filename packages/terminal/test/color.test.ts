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

    test('Should return empty string for empty input', () => {
        expect(colorToAnsiFg('')).toBe('');
    });

    test('Should return empty string for "none"', () => {
        expect(colorToAnsiFg('none')).toBe('');
    });

    test('Should return empty string for "transparent"', () => {
        expect(colorToAnsiFg('transparent')).toBe('');
    });

});

describe('colorToAnsiBg', () => {

    test('Should convert hex color to truecolor background sequence', () => {
        expect(colorToAnsiBg('#00ff00')).toBe('\x1b[48;2;0;255;0m');
    });

    test('Should return empty string for empty input', () => {
        expect(colorToAnsiBg('')).toBe('');
    });

    test('Should return empty string for "none"', () => {
        expect(colorToAnsiBg('none')).toBe('');
    });

    test('Should return empty string for "transparent"', () => {
        expect(colorToAnsiBg('transparent')).toBe('');
    });

});
