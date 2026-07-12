import {
    bench,
    describe,
} from 'vitest';

import {
    interpolateColor,
    interpolateNumber,
    interpolatePoints,
} from '../src';

import type {
    Point,
} from '../src';

const SAMPLES = 100;

function drive(interpolator: (time: number) => unknown): void {
    for (let index = 0; index <= SAMPLES; index++) {
        interpolator(index / SAMPLES);
    }
}

function createPolygon(sides: number, radius: number): Point[] {
    return Array.from({ length: sides }, (_, index) => {
        const theta = index / sides * Math.PI * 2;

        return [Math.cos(theta) * radius, Math.sin(theta) * radius] as Point;
    });
}

/**
 * Interpolation throughput for the property types the transition system exercises every frame. Path
 * (point-set) interpolation is the most expensive, so it is benchmarked separately.
 */
describe('interpolation', () => {

    bench('number (factory + 100 samples)', () => {
        drive(interpolateNumber(0, 100));
    });

    bench('color (factory + 100 samples)', () => {
        drive(interpolateColor('#1e6978', '#c0ffee'));
    });

    bench('points polygon 6→12 (factory + 100 samples)', () => {
        drive(interpolatePoints(createPolygon(6, 50), createPolygon(12, 80)));
    });

});
