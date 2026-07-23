import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    rgbChannelToHEX,
    serializeHEX,
    serializeHSL,
    serializeHSLA,
    serializeHSV,
    serializeHSVA,
    serializeRGB,
    serializeRGBA,
} from '../../src';

describe('Color Serializers', () => {

    // ── rgbChannelToHEX ──────────────────────────────────────────

    describe('rgbChannelToHEX', () => {

        test('Should pad single digit values with leading zero', () => {
            expect(rgbChannelToHEX(0)).toBe('00');
            expect(rgbChannelToHEX(5)).toBe('05');
            expect(rgbChannelToHEX(15)).toBe('0f');
        });

        test('Should not pad double digit hex values', () => {
            expect(rgbChannelToHEX(16)).toBe('10');
            expect(rgbChannelToHEX(255)).toBe('ff');
            expect(rgbChannelToHEX(128)).toBe('80');
        });

    });

    // ── serializeHEX ─────────────────────────────────────────────

    describe('serializeHEX', () => {

        test('Should serialize opaque color without alpha', () => {
            expect(serializeHEX(255, 0, 0, 1)).toBe('#ff0000');
            expect(serializeHEX(0, 255, 0, 1)).toBe('#00ff00');
            expect(serializeHEX(0, 0, 255, 1)).toBe('#0000ff');
        });

        test('Should include alpha when less than 1', () => {
            const result = serializeHEX(255, 0, 0, 0.5);
            expect(result).toMatch(/^#ff0000[0-9a-f]{2}$/);
        });

        test('Should handle black', () => {
            expect(serializeHEX(0, 0, 0, 1)).toBe('#000000');
        });

        test('Should handle white', () => {
            expect(serializeHEX(255, 255, 255, 1)).toBe('#ffffff');
        });

    });

    // ── serializeRGB ─────────────────────────────────────────────

    describe('serializeRGB', () => {

        test('Should format as rgb()', () => {
            expect(serializeRGB(255, 128, 0, 1)).toBe('rgb(255, 128, 0)');
        });

        test('Should clamp values exceeding 0-255 range', () => {
            expect(serializeRGB(300, -10, 128, 1)).toBe('rgb(255, 0, 128)');
        });

    });

    // ── serializeRGBA ────────────────────────────────────────────

    describe('serializeRGBA', () => {

        test('Should format as rgba()', () => {
            expect(serializeRGBA(255, 128, 0, 0.5)).toBe('rgba(255, 128, 0, 0.5)');
        });

        test('Should clamp alpha to 0-1', () => {
            expect(serializeRGBA(255, 0, 0, 2)).toBe('rgba(255, 0, 0, 1)');
            expect(serializeRGBA(255, 0, 0, -1)).toBe('rgba(255, 0, 0, 0)');
        });

        test('Should clamp channel values', () => {
            expect(serializeRGBA(300, -10, 128, 0.8)).toBe('rgba(255, 0, 128, 0.8)');
        });

    });

    // ── serializeHSL ─────────────────────────────────────────────

    describe('serializeHSL', () => {

        test('Should serialize pure red', () => {
            expect(serializeHSL(255, 0, 0, 1)).toBe('hsl(0, 100%, 50%)');
        });

        test('Should serialize pure green', () => {
            expect(serializeHSL(0, 128, 0, 1)).toBe('hsl(120, 100%, 25%)');
        });

        test('Should serialize white', () => {
            expect(serializeHSL(255, 255, 255, 1)).toBe('hsl(0, 0%, 100%)');
        });

        test('Should serialize black', () => {
            expect(serializeHSL(0, 0, 0, 1)).toBe('hsl(0, 0%, 0%)');
        });

    });

    // ── serializeHSLA ────────────────────────────────────────────

    describe('serializeHSLA', () => {

        test('Should include alpha channel', () => {
            expect(serializeHSLA(255, 0, 0, 0.5)).toBe('hsla(0, 100%, 50%, 0.5)');
        });

        test('Should clamp alpha', () => {
            expect(serializeHSLA(255, 0, 0, 2)).toBe('hsla(0, 100%, 50%, 1)');
        });

    });

    // ── serializeHSV ─────────────────────────────────────────────

    describe('serializeHSV', () => {

        test('Should serialize pure red', () => {
            expect(serializeHSV(255, 0, 0, 1)).toBe('hsv(0, 100%, 100%)');
        });

        test('Should serialize white', () => {
            expect(serializeHSV(255, 255, 255, 1)).toBe('hsv(0, 0%, 100%)');
        });

        test('Should serialize black', () => {
            expect(serializeHSV(0, 0, 0, 1)).toBe('hsv(0, 0%, 0%)');
        });

    });

    // ── serializeHSVA ────────────────────────────────────────────

    describe('serializeHSVA', () => {

        test('Should include alpha channel', () => {
            expect(serializeHSVA(255, 0, 0, 0.5)).toBe('hsva(0, 100%, 100%, 0.5)');
        });

        test('Should clamp alpha', () => {
            expect(serializeHSVA(255, 0, 0, 2)).toBe('hsva(0, 100%, 100%, 1)');
        });

    });

});
