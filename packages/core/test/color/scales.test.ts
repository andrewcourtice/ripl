import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    COLOR_SCHEME_RDBU,
    COLOR_SCHEME_VIRIDIS,
    interpolateColors,
    parseColor,
    scaleSequential,
} from '../../src';

/**
 * Extracts the rounded RGB channels of a colour string for comparison, ignoring the serialised
 * format. Falls back to a numeric scan for interpolated `rgba()` strings with fractional channels,
 * which the library's integer-only `parseColor` does not match.
 */
function rgb(color: string): [number, number, number] {
    const parsed = parseColor(color);

    if (parsed) {
        return [
            Math.round(parsed[0]),
            Math.round(parsed[1]),
            Math.round(parsed[2]),
        ];
    }

    const [
        red,
        green,
        blue,
    ] = (color.match(/[\d.]+/g) ?? []).map(Number);

    return [
        Math.round(red),
        Math.round(green),
        Math.round(blue),
    ];
}

describe('interpolateColors', () => {

    test('Should return the endpoints at positions 0 and 1', () => {
        const interpolate = interpolateColors(['#000000', '#ffffff']);

        expect(rgb(interpolate(0))).toEqual([0, 0, 0]);
        expect(rgb(interpolate(1))).toEqual([255, 255, 255]);
    });

    test('Should interpolate between adjacent stops', () => {
        const interpolate = interpolateColors(['#000000', '#ffffff']);
        const [red] = rgb(interpolate(0.5));

        expect(red).toBeGreaterThan(120);
        expect(red).toBeLessThan(136);
    });

    test('Should pick the correct segment across multiple stops', () => {
        const interpolate = interpolateColors(['#ff0000', '#00ff00', '#0000ff']);

        expect(rgb(interpolate(0))).toEqual([255, 0, 0]);
        expect(rgb(interpolate(0.5))).toEqual([0, 255, 0]);
        expect(rgb(interpolate(1))).toEqual([0, 0, 255]);
    });

});

describe('scaleSequential', () => {

    test('Should map domain endpoints to the scheme endpoints', () => {
        const scale = scaleSequential(COLOR_SCHEME_VIRIDIS, [0, 100]);

        expect(rgb(scale(0))).toEqual(rgb(COLOR_SCHEME_VIRIDIS[0]));
        expect(rgb(scale(100))).toEqual(rgb(COLOR_SCHEME_VIRIDIS[COLOR_SCHEME_VIRIDIS.length - 1]));
    });

    test('Should clamp values outside the domain', () => {
        const scale = scaleSequential(COLOR_SCHEME_VIRIDIS, [0, 100]);

        expect(rgb(scale(-50))).toEqual(rgb(COLOR_SCHEME_VIRIDIS[0]));
        expect(rgb(scale(500))).toEqual(rgb(COLOR_SCHEME_VIRIDIS[COLOR_SCHEME_VIRIDIS.length - 1]));
    });

    test('Should accept a custom interpolator function', () => {
        const scale = scaleSequential(() => '#123456', [0, 1]);

        expect(rgb(scale(0.42))).toEqual(rgb('#123456'));
    });

    test('Should expose ticks over the domain', () => {
        const scale = scaleSequential(COLOR_SCHEME_VIRIDIS, [0, 100]);
        const ticks = scale.ticks(5);

        expect(ticks[0]).toBe(0);
        expect(ticks[ticks.length - 1]).toBe(100);
    });

});

describe('scaleSequential (diverging domain)', () => {

    test('Should centre the neutral value at the interpolator midpoint', () => {
        const scale = scaleSequential(COLOR_SCHEME_RDBU, [-10, 0, 10]);

        expect(rgb(scale(-10))).toEqual(rgb(COLOR_SCHEME_RDBU[0]));
        expect(rgb(scale(10))).toEqual(rgb(COLOR_SCHEME_RDBU[COLOR_SCHEME_RDBU.length - 1]));
        expect(rgb(scale(0))).toEqual(rgb(COLOR_SCHEME_RDBU[4]));
    });

    test('Should handle asymmetric domains around the neutral', () => {
        const scale = scaleSequential(COLOR_SCHEME_RDBU, [-5, 0, 20]);

        expect(rgb(scale(-5))).toEqual(rgb(COLOR_SCHEME_RDBU[0]));
        expect(rgb(scale(0))).toEqual(rgb(COLOR_SCHEME_RDBU[4]));
        expect(rgb(scale(20))).toEqual(rgb(COLOR_SCHEME_RDBU[COLOR_SCHEME_RDBU.length - 1]));
    });

});
