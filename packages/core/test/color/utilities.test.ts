import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    hslToRGBA,
    hsvToRGBA,
    rgbaToHSL,
    rgbaToHSV,
} from '../../src';

describe('Color', () => {

    describe('Utilities', () => {

        describe('RGB to HSL conversions', () => {

            test('Should convert red RGB to HSL', () => {
                const [
                    hue,
                    saturation,
                    lightness,
                    alpha,
                ] = rgbaToHSL(255, 0, 0, 1);

                expect(hue).toBe(0);
                expect(saturation).toBe(100);
                expect(lightness).toBe(50);
                expect(alpha).toBe(1);
            });

            test('Should convert green RGB to HSL', () => {
                const [
                    hue,
                    saturation,
                    lightness,
                    alpha,
                ] = rgbaToHSL(0, 255, 0, 1);

                expect(hue).toBe(120);
                expect(saturation).toBe(100);
                expect(lightness).toBe(50);
                expect(alpha).toBe(1);
            });

            test('Should convert blue RGB to HSL', () => {
                const [
                    hue,
                    saturation,
                    lightness,
                    alpha,
                ] = rgbaToHSL(0, 0, 255, 1);

                expect(hue).toBe(240);
                expect(saturation).toBe(100);
                expect(lightness).toBe(50);
                expect(alpha).toBe(1);
            });

            test('Should convert white RGB to HSL', () => {
                const [
                    hue,
                    saturation,
                    lightness,
                    alpha,
                ] = rgbaToHSL(255, 255, 255, 1);

                expect(hue).toBe(0);
                expect(saturation).toBe(0);
                expect(lightness).toBe(100);
                expect(alpha).toBe(1);
            });

            test('Should convert black RGB to HSL', () => {
                const [
                    hue,
                    saturation,
                    lightness,
                    alpha,
                ] = rgbaToHSL(0, 0, 0, 1);

                expect(hue).toBe(0);
                expect(saturation).toBe(0);
                expect(lightness).toBe(0);
                expect(alpha).toBe(1);
            });

            test('Should convert gray RGB to HSL', () => {
                const [
                    hue,
                    saturation,
                    lightness,
                    alpha,
                ] = rgbaToHSL(128, 128, 128, 1);

                expect(hue).toBe(0);
                expect(saturation).toBe(0);
                expect(lightness).toBe(50);
                expect(alpha).toBe(1);
            });

            test('Should preserve alpha channel', () => {
                const [
                    hue,
                    saturation,
                    lightness,
                    alpha,
                ] = rgbaToHSL(255, 0, 0, 0.5);

                expect(hue).toBe(0);
                expect(saturation).toBe(100);
                expect(lightness).toBe(50);
                expect(alpha).toBe(0.5);
            });

        });

        describe('HSL to RGB conversions', () => {

            test('Should convert red HSL to RGB', () => {
                const [
                    red,
                    green,
                    blue,
                    alpha,
                ] = hslToRGBA(0, 100, 50, 1);

                expect(red).toBe(255);
                expect(green).toBe(0);
                expect(blue).toBe(0);
                expect(alpha).toBe(1);
            });

            test('Should convert green HSL to RGB', () => {
                const [
                    red,
                    green,
                    blue,
                    alpha,
                ] = hslToRGBA(120, 100, 50, 1);

                expect(red).toBe(0);
                expect(green).toBe(255);
                expect(blue).toBe(0);
                expect(alpha).toBe(1);
            });

            test('Should convert blue HSL to RGB', () => {
                const [
                    red,
                    green,
                    blue,
                    alpha,
                ] = hslToRGBA(240, 100, 50, 1);

                expect(red).toBe(0);
                expect(green).toBe(0);
                expect(blue).toBe(255);
                expect(alpha).toBe(1);
            });

            test('Should convert white HSL to RGB', () => {
                const [
                    red,
                    green,
                    blue,
                    alpha,
                ] = hslToRGBA(0, 0, 100, 1);

                expect(red).toBe(255);
                expect(green).toBe(255);
                expect(blue).toBe(255);
                expect(alpha).toBe(1);
            });

            test('Should convert black HSL to RGB', () => {
                const [
                    red,
                    green,
                    blue,
                    alpha,
                ] = hslToRGBA(0, 0, 0, 1);

                expect(red).toBe(0);
                expect(green).toBe(0);
                expect(blue).toBe(0);
                expect(alpha).toBe(1);
            });

            test('Should preserve alpha channel', () => {
                const [
                    red,
                    green,
                    blue,
                    alpha,
                ] = hslToRGBA(0, 100, 50, 0.5);

                expect(red).toBe(255);
                expect(green).toBe(0);
                expect(blue).toBe(0);
                expect(alpha).toBe(0.5);
            });

        });

        describe('RGB to HSV conversions', () => {

            test('Should convert red RGB to HSV', () => {
                const [
                    hue,
                    saturation,
                    value,
                    alpha,
                ] = rgbaToHSV(255, 0, 0, 1);

                expect(hue).toBe(0);
                expect(saturation).toBe(100);
                expect(value).toBe(100);
                expect(alpha).toBe(1);
            });

            test('Should convert green RGB to HSV', () => {
                const [
                    hue,
                    saturation,
                    value,
                    alpha,
                ] = rgbaToHSV(0, 255, 0, 1);

                expect(hue).toBe(120);
                expect(saturation).toBe(100);
                expect(value).toBe(100);
                expect(alpha).toBe(1);
            });

            test('Should convert blue RGB to HSV', () => {
                const [
                    hue,
                    saturation,
                    value,
                    alpha,
                ] = rgbaToHSV(0, 0, 255, 1);

                expect(hue).toBe(240);
                expect(saturation).toBe(100);
                expect(value).toBe(100);
                expect(alpha).toBe(1);
            });

            test('Should convert white RGB to HSV', () => {
                const [
                    hue,
                    saturation,
                    value,
                    alpha,
                ] = rgbaToHSV(255, 255, 255, 1);

                expect(hue).toBe(0);
                expect(saturation).toBe(0);
                expect(value).toBe(100);
                expect(alpha).toBe(1);
            });

            test('Should convert black RGB to HSV', () => {
                const [
                    hue,
                    saturation,
                    value,
                    alpha,
                ] = rgbaToHSV(0, 0, 0, 1);

                expect(hue).toBe(0);
                expect(saturation).toBe(0);
                expect(value).toBe(0);
                expect(alpha).toBe(1);
            });

            test('Should preserve alpha channel', () => {
                const [
                    hue,
                    saturation,
                    value,
                    alpha,
                ] = rgbaToHSV(255, 0, 0, 0.5);

                expect(hue).toBe(0);
                expect(saturation).toBe(100);
                expect(value).toBe(100);
                expect(alpha).toBe(0.5);
            });

        });

        describe('HSV to RGB conversions', () => {

            test('Should convert red HSV to RGB', () => {
                const [
                    red,
                    green,
                    blue,
                    alpha,
                ] = hsvToRGBA(0, 100, 100, 1);

                expect(red).toBe(255);
                expect(green).toBe(0);
                expect(blue).toBe(0);
                expect(alpha).toBe(1);
            });

            test('Should convert green HSV to RGB', () => {
                const [
                    red,
                    green,
                    blue,
                    alpha,
                ] = hsvToRGBA(120, 100, 100, 1);

                expect(red).toBe(0);
                expect(green).toBe(255);
                expect(blue).toBe(0);
                expect(alpha).toBe(1);
            });

            test('Should convert blue HSV to RGB', () => {
                const [
                    red,
                    green,
                    blue,
                    alpha,
                ] = hsvToRGBA(240, 100, 100, 1);

                expect(red).toBe(0);
                expect(green).toBe(0);
                expect(blue).toBe(255);
                expect(alpha).toBe(1);
            });

            test('Should convert white HSV to RGB', () => {
                const [
                    red,
                    green,
                    blue,
                    alpha,
                ] = hsvToRGBA(0, 0, 100, 1);

                expect(red).toBe(255);
                expect(green).toBe(255);
                expect(blue).toBe(255);
                expect(alpha).toBe(1);
            });

            test('Should convert black HSV to RGB', () => {
                const [
                    red,
                    green,
                    blue,
                    alpha,
                ] = hsvToRGBA(0, 0, 0, 1);

                expect(red).toBe(0);
                expect(green).toBe(0);
                expect(blue).toBe(0);
                expect(alpha).toBe(1);
            });

            test('Should preserve alpha channel', () => {
                const [
                    red,
                    green,
                    blue,
                    alpha,
                ] = hsvToRGBA(0, 100, 100, 0.5);

                expect(red).toBe(255);
                expect(green).toBe(0);
                expect(blue).toBe(0);
                expect(alpha).toBe(0.5);
            });

        });

    });

});
