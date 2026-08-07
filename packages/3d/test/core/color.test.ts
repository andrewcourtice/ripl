import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    DEFAULT_SURFACE_COLOR,
    resolveColor,
    resolveColorUnitRGB,
    rgbaToUnit,
    rgbToUnit,
} from '../../src';

describe('Color', () => {

    describe('resolveColor', () => {

        test('Should parse hex, rgb and named colors', () => {
            expect(resolveColor('#ff0000')).toEqual([255, 0, 0, 1]);
            expect(resolveColor('rgb(0, 128, 255)')).toEqual([0, 128, 255, 1]);
            expect(resolveColor('red')).toEqual([255, 0, 0, 1]);
        });

        test('Should return undefined for an unparseable value', () => {
            expect(resolveColor('not-a-color')).toBeUndefined();
        });

        test('Should return the same result on a cache hit', () => {
            expect(resolveColor('#123456')).toEqual(resolveColor('#123456'));
        });

        test('Should cache the undefined result rather than reparsing', () => {
            expect(resolveColor('still-not-a-color')).toBeUndefined();
            expect(resolveColor('still-not-a-color')).toBeUndefined();
        });

    });

    test('Should convert 0-255 channels to unit range', () => {
        expect(rgbToUnit([255, 0, 51, 1])).toEqual([1, 0, 0.2]);
        expect(rgbaToUnit([255, 0, 51, 0.5])).toEqual([1, 0, 0.2, 0.5]);
    });

    describe('resolveColorUnitRGB', () => {

        test('Should resolve straight to unit range', () => {
            expect(resolveColorUnitRGB('#ff0000')).toEqual([1, 0, 0]);
        });

        test('Should fall back when the value is unparseable', () => {
            expect(resolveColorUnitRGB('nope', [0.1, 0.2, 0.3])).toEqual([0.1, 0.2, 0.3]);
        });

    });

    test('Should expose a parseable default surface color', () => {
        expect(resolveColor(DEFAULT_SURFACE_COLOR)).toEqual([136, 136, 136, 1]);
    });

});
