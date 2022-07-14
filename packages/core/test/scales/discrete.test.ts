import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    scaleDiscrete,
} from '../../src';

describe('Scale', () => {

    describe('Discrete Scale', () => {
        const domain = ['James', 'John', 'Mary', 'Andrew'];
        const range = [30, 500];

        test('Should scale a domain to a range', () => {
            const scale = scaleDiscrete(domain, range);

            expect(scale(domain[0])).toBe(range[0]);
            expect(scale(domain[domain.length - 1])).toBe(range[1]);
        });

        test('Should return an inverse value', () => {
            const scale = scaleDiscrete(domain, range);

            expect(scale.inverse(range[0])).toBe(domain[0]);
            expect(scale.inverse(range[1])).toBe(domain[1]);
        });
    });

});