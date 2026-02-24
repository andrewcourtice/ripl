import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    easeInCubic,
    easeInOutCubic,
    easeInOutQuad,
    easeInOutQuart,
    easeInOutQuint,
    easeInQuad,
    easeInQuart,
    easeInQuint,
    easeLinear,
    easeOutCubic,
    easeOutQuad,
    easeOutQuart,
    easeOutQuint,
} from '../../src';

const ALL_EASES = {
    easeLinear,
    easeInQuad,
    easeOutQuad,
    easeInOutQuad,
    easeInCubic,
    easeOutCubic,
    easeInOutCubic,
    easeInQuart,
    easeOutQuart,
    easeInOutQuart,
    easeInQuint,
    easeOutQuint,
    easeInOutQuint,
};

describe('Easing Functions', () => {

    for (const [name, ease] of Object.entries(ALL_EASES)) {
        describe(name, () => {

            test('Should return ~0 at time=0', () => {
                expect(ease(0)).toBeCloseTo(0, 5);
            });

            test('Should return ~1 at time=1', () => {
                expect(ease(1)).toBeCloseTo(1, 5);
            });

            test('Should return a value between 0 and 1 at time=0.5', () => {
                const mid = ease(0.5);
                expect(mid).toBeGreaterThanOrEqual(0);
                expect(mid).toBeLessThanOrEqual(1);
            });

            test('Should produce values in [0,1] range for inputs in [0,1]', () => {
                for (let t = 0; t <= 1; t += 0.1) {
                    const val = ease(t);
                    expect(val).toBeGreaterThanOrEqual(-0.01);
                    expect(val).toBeLessThanOrEqual(1.01);
                }
            });

        });
    }

    test('easeLinear should be identity', () => {
        expect(easeLinear(0.3)).toBeCloseTo(0.3, 10);
        expect(easeLinear(0.7)).toBeCloseTo(0.7, 10);
    });

    test('easeInQuad should be slower at start', () => {
        expect(easeInQuad(0.25)).toBeLessThan(0.25);
    });

    test('easeOutQuad should be faster at start', () => {
        expect(easeOutQuad(0.25)).toBeGreaterThan(0.25);
    });

    test('easeInOutQuad should be symmetric around 0.5', () => {
        expect(easeInOutQuad(0.5)).toBeCloseTo(0.5, 5);
    });

});
