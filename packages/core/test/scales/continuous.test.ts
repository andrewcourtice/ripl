import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    scaleContinuous,
} from '../../src';

describe('Scale', () => {

    describe('Linear Scale', () => {
        const domain = [-5, 10];
        const range = [30, 500];

        test('Should scale a domain to a range', () => {
            const scale = scaleContinuous(domain, range);

            expect(scale(domain[0])).toBe(range[0]);
            expect(scale(domain[1])).toBe(range[1]);
        });

        test('Should clamp values outside the range', () => {
            const scale = scaleContinuous(domain, range, {
                clamp: true,
            });

            expect(scale(-10)).toBe(range[0]);
            expect(scale(15)).toBe(range[1]);
        });

        test('Should return an inverse value', () => {
            const scale = scaleContinuous(domain, range);

            expect(scale.inverse(range[0])).toBe(domain[0]);
            expect(scale.inverse(range[1])).toBe(domain[1]);
        });

    });

});