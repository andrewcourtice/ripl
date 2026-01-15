import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    parseHEX,
    parseHSL,
    parseHSLA,
    parseHSV,
    parseHSVA,
    parseRGB,
    parseRGBA,
    serialiseHSL,
    serialiseHSLA,
    serialiseHSV,
    serialiseHSVA,
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

    describe('HSL Parsers', () => {

        test('Should parse an HSL color to RGBA', () => {
            const [
                red,
                green,
                blue,
                alpha,
            ] = parseHSL('hsl(0, 100%, 50%)');

            expect(red).toBe(255);
            expect(green).toBe(0);
            expect(blue).toBe(0);
            expect(alpha).toBe(1);
        });

        test('Should parse an HSL color (green) to RGBA', () => {
            const [
                red,
                green,
                blue,
                alpha,
            ] = parseHSL('hsl(120, 100%, 50%)');

            expect(red).toBe(0);
            expect(green).toBe(255);
            expect(blue).toBe(0);
            expect(alpha).toBe(1);
        });

        test('Should parse an HSL color (blue) to RGBA', () => {
            const [
                red,
                green,
                blue,
                alpha,
            ] = parseHSL('hsl(240, 100%, 50%)');

            expect(red).toBe(0);
            expect(green).toBe(0);
            expect(blue).toBe(255);
            expect(alpha).toBe(1);
        });

        test('Should parse an HSLA color to RGBA', () => {
            const [
                red,
                green,
                blue,
                alpha,
            ] = parseHSLA('hsla(0, 100%, 50%, 0.5)');

            expect(red).toBe(255);
            expect(green).toBe(0);
            expect(blue).toBe(0);
            expect(alpha).toBe(0.5);
        });

        test('Should parse an HSLA color (with percentage alpha) to RGBA', () => {
            const [
                red,
                green,
                blue,
                alpha,
            ] = parseHSLA('hsla(120, 100%, 50%, 50%)');

            expect(red).toBe(0);
            expect(green).toBe(255);
            expect(blue).toBe(0);
            expect(alpha).toBe(0.5);
        });

    });

    describe('HSV Parsers', () => {

        test('Should parse an HSV color to RGBA', () => {
            const [
                red,
                green,
                blue,
                alpha,
            ] = parseHSV('hsv(0, 100%, 100%)');

            expect(red).toBe(255);
            expect(green).toBe(0);
            expect(blue).toBe(0);
            expect(alpha).toBe(1);
        });

        test('Should parse an HSV color (green) to RGBA', () => {
            const [
                red,
                green,
                blue,
                alpha,
            ] = parseHSV('hsv(120, 100%, 100%)');

            expect(red).toBe(0);
            expect(green).toBe(255);
            expect(blue).toBe(0);
            expect(alpha).toBe(1);
        });

        test('Should parse an HSV color (blue) to RGBA', () => {
            const [
                red,
                green,
                blue,
                alpha,
            ] = parseHSV('hsv(240, 100%, 100%)');

            expect(red).toBe(0);
            expect(green).toBe(0);
            expect(blue).toBe(255);
            expect(alpha).toBe(1);
        });

        test('Should parse an HSVA color to RGBA', () => {
            const [
                red,
                green,
                blue,
                alpha,
            ] = parseHSVA('hsva(0, 100%, 100%, 0.5)');

            expect(red).toBe(255);
            expect(green).toBe(0);
            expect(blue).toBe(0);
            expect(alpha).toBe(0.5);
        });

        test('Should parse an HSVA color (with percentage alpha) to RGBA', () => {
            const [
                red,
                green,
                blue,
                alpha,
            ] = parseHSVA('hsva(120, 100%, 100%, 50%)');

            expect(red).toBe(0);
            expect(green).toBe(255);
            expect(blue).toBe(0);
            expect(alpha).toBe(0.5);
        });

    });

    describe('Serializers', () => {

        test('Should serialize RGBA to HSL', () => {
            const hsl = serialiseHSL(255, 0, 0, 1);

            expect(hsl).toBe('hsl(0, 100%, 50%)');
        });

        test('Should serialize RGBA to HSLA', () => {
            const hsla = serialiseHSLA(255, 0, 0, 0.5);

            expect(hsla).toBe('hsla(0, 100%, 50%, 0.5)');
        });

        test('Should serialize RGBA to HSV', () => {
            const hsv = serialiseHSV(255, 0, 0, 1);

            expect(hsv).toBe('hsv(0, 100%, 100%)');
        });

        test('Should serialize RGBA to HSVA', () => {
            const hsva = serialiseHSVA(255, 0, 0, 0.5);

            expect(hsva).toBe('hsva(0, 100%, 100%, 0.5)');
        });

        test('Should serialize white to HSL', () => {
            const hsl = serialiseHSL(255, 255, 255, 1);

            expect(hsl).toBe('hsl(0, 0%, 100%)');
        });

        test('Should serialize black to HSL', () => {
            const hsl = serialiseHSL(0, 0, 0, 1);

            expect(hsl).toBe('hsl(0, 0%, 0%)');
        });

    });

});