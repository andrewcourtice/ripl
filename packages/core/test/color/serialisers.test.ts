import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    rgbChannelToHEX,
    serialiseHEX,
    serialiseHSL,
    serialiseHSLA,
    serialiseHSV,
    serialiseHSVA,
    serialiseRGB,
    serialiseRGBA,
} from '../../src';

describe('Color Serialisers', () => {

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

    // ── serialiseHEX ─────────────────────────────────────────────

    describe('serialiseHEX', () => {

        test('Should serialise opaque color without alpha', () => {
            expect(serialiseHEX(255, 0, 0, 1)).toBe('#ff0000');
            expect(serialiseHEX(0, 255, 0, 1)).toBe('#00ff00');
            expect(serialiseHEX(0, 0, 255, 1)).toBe('#0000ff');
        });

        test('Should include alpha when less than 1', () => {
            const result = serialiseHEX(255, 0, 0, 0.5);
            expect(result).toMatch(/^#ff0000[0-9a-f]{2}$/);
        });

        test('Should handle black', () => {
            expect(serialiseHEX(0, 0, 0, 1)).toBe('#000000');
        });

        test('Should handle white', () => {
            expect(serialiseHEX(255, 255, 255, 1)).toBe('#ffffff');
        });

    });

    // ── serialiseRGB ─────────────────────────────────────────────

    describe('serialiseRGB', () => {

        test('Should format as rgb()', () => {
            expect(serialiseRGB(255, 128, 0, 1)).toBe('rgb(255, 128, 0)');
        });

        test('Should clamp values exceeding 0-255 range', () => {
            expect(serialiseRGB(300, -10, 128, 1)).toBe('rgb(255, 0, 128)');
        });

    });

    // ── serialiseRGBA ────────────────────────────────────────────

    describe('serialiseRGBA', () => {

        test('Should format as rgba()', () => {
            expect(serialiseRGBA(255, 128, 0, 0.5)).toBe('rgba(255, 128, 0, 0.5)');
        });

        test('Should clamp alpha to 0-1', () => {
            expect(serialiseRGBA(255, 0, 0, 2)).toBe('rgba(255, 0, 0, 1)');
            expect(serialiseRGBA(255, 0, 0, -1)).toBe('rgba(255, 0, 0, 0)');
        });

        test('Should clamp channel values', () => {
            expect(serialiseRGBA(300, -10, 128, 0.8)).toBe('rgba(255, 0, 128, 0.8)');
        });

    });

    // ── serialiseHSL ─────────────────────────────────────────────

    describe('serialiseHSL', () => {

        test('Should serialise pure red', () => {
            expect(serialiseHSL(255, 0, 0, 1)).toBe('hsl(0, 100%, 50%)');
        });

        test('Should serialise pure green', () => {
            expect(serialiseHSL(0, 128, 0, 1)).toBe('hsl(120, 100%, 25%)');
        });

        test('Should serialise white', () => {
            expect(serialiseHSL(255, 255, 255, 1)).toBe('hsl(0, 0%, 100%)');
        });

        test('Should serialise black', () => {
            expect(serialiseHSL(0, 0, 0, 1)).toBe('hsl(0, 0%, 0%)');
        });

    });

    // ── serialiseHSLA ────────────────────────────────────────────

    describe('serialiseHSLA', () => {

        test('Should include alpha channel', () => {
            expect(serialiseHSLA(255, 0, 0, 0.5)).toBe('hsla(0, 100%, 50%, 0.5)');
        });

        test('Should clamp alpha', () => {
            expect(serialiseHSLA(255, 0, 0, 2)).toBe('hsla(0, 100%, 50%, 1)');
        });

    });

    // ── serialiseHSV ─────────────────────────────────────────────

    describe('serialiseHSV', () => {

        test('Should serialise pure red', () => {
            expect(serialiseHSV(255, 0, 0, 1)).toBe('hsv(0, 100%, 100%)');
        });

        test('Should serialise white', () => {
            expect(serialiseHSV(255, 255, 255, 1)).toBe('hsv(0, 0%, 100%)');
        });

        test('Should serialise black', () => {
            expect(serialiseHSV(0, 0, 0, 1)).toBe('hsv(0, 0%, 0%)');
        });

    });

    // ── serialiseHSVA ────────────────────────────────────────────

    describe('serialiseHSVA', () => {

        test('Should include alpha channel', () => {
            expect(serialiseHSVA(255, 0, 0, 0.5)).toBe('hsva(0, 100%, 100%, 0.5)');
        });

        test('Should clamp alpha', () => {
            expect(serialiseHSVA(255, 0, 0, 2)).toBe('hsva(0, 100%, 100%, 1)');
        });

    });

});
