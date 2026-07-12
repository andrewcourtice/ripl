import {
    bench,
    describe,
} from 'vitest';

import {
    scaleBand,
    scaleContinuous,
    scaleLogarithmic,
    scaleTime,
} from '../src';

const SAMPLES = 1000;

/** Scale construction + sampling throughput for the scales charts hit on every layout pass. */
describe('scales', () => {

    const categories = Array.from({ length: 50 }, (_, index) => `cat-${index}`);

    bench('continuous (construct + 1000 samples)', () => {
        const scale = scaleContinuous([0, 100], [0, 1920]);

        for (let index = 0; index < SAMPLES; index++) {
            scale(index / SAMPLES * 100);
        }
    });

    bench('logarithmic (construct + 1000 samples)', () => {
        const scale = scaleLogarithmic([1, 100000], [0, 1080]);

        for (let index = 1; index <= SAMPLES; index++) {
            scale(index);
        }
    });

    bench('time (construct + 1000 samples)', () => {
        const scale = scaleTime([new Date(2020, 0, 1), new Date(2020, 11, 31)], [0, 1920]);

        for (let index = 0; index < SAMPLES; index++) {
            scale(new Date(2020, 0, 1 + index % 365));
        }
    });

    bench('band (construct + 50 lookups)', () => {
        const scale = scaleBand(categories, [0, 1920]);

        for (const category of categories) {
            scale(category);
        }
    });

});
