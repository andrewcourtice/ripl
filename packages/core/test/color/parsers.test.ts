import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    parseHEX,
    parseRGB,
    parseRGBA,
} from '../../src';

describe('Color', () => {

    describe('Parsers', () => {

        test('Should parse a 6 char HEX color to RGBA', () => {
            const [
                red,
                green,
                blue,
                alpha,
            ] = parseHEX('#FF00FF');

            expect(red).toBe(255);
            expect(green).toBe(0);
            expect(blue).toBe(255);
            expect(alpha).toBe(1);
        });

        test('Should parse an 8 char HEX color to RGBA', () => {
            const [
                red,
                green,
                blue,
                alpha,
            ] = parseHEX('#FF00FFAA');

            expect(red).toBe(255);
            expect(green).toBe(0);
            expect(blue).toBe(255);
            expect(alpha).toBe(2 / 3);
        });

        test('Should parse an RGB color to RGBA', () => {
            const [
                red,
                green,
                blue,
                alpha,
            ] = parseRGB('rgb(121, 80, 233)');

            expect(red).toBe(121);
            expect(green).toBe(80);
            expect(blue).toBe(233);
            expect(alpha).toBe(1);
        });

        test('Should parse an RGB color (with percentages) to RGBA', () => {
            const [
                red,
                green,
                blue,
                alpha,
            ] = parseRGB('rgb(80%, 10%, 50%)');

            expect(red).toBe(255 * 0.8);
            expect(green).toBe(255 * 0.1);
            expect(blue).toBe(255 * 0.5);
            expect(alpha).toBe(1);
        });

        test('Should parse an RGBA color to RGBA', () => {
            const [
                red,
                green,
                blue,
                alpha,
            ] = parseRGBA('rgba(121, 80, 233, 0.3)');

            expect(red).toBe(121);
            expect(green).toBe(80);
            expect(blue).toBe(233);
            expect(alpha).toBe(0.3);
        });

        test('Should parse an RGBA color (with percentages) to RGBA', () => {
            const [
                red,
                green,
                blue,
                alpha,
            ] = parseRGBA('rgba(80%, 10%, 50%, 30%)');

            expect(red).toBe(255 * 0.8);
            expect(green).toBe(255 * 0.1);
            expect(blue).toBe(255 * 0.5);
            expect(alpha).toBe(0.3);
        });

    });

});