import {
    beforeAll,
    describe,
    expect,
    test,
} from 'vitest';

import {
    getMathEngine,
    loadMathEngine,
} from './engine';

import {
    detectParameters,
} from './params';

function detect(source: string, variables: string[] = ['x']): string[] {
    return detectParameters([getMathEngine().parse(source)], variables);
}

describe('Graphing calculator parameter detection', () => {

    beforeAll(async () => {
        await loadMathEngine();
    });

    test('Should detect the free symbols of an expression', () => {
        expect(detect('a*sin(b*x)')).toEqual(['a', 'b']);
    });

    test('Should not report a function name as a parameter', () => {
        expect(detect('sin(x)')).toEqual([]);
        expect(detect('atan2(x, x)')).toEqual([]);
    });

    test('Should not report a plot variable as a parameter', () => {
        expect(detectParameters([getMathEngine().parse('x^2 + y^2')], ['x', 'y'])).toEqual([]);
    });

    test('Should not report a built-in constant as a parameter', () => {
        expect(detect('pi*x + e + tau + phi')).toEqual([]);
    });

    // A `name in math` filter would swallow all four, because mathjs defines them as functions.
    test('Should detect a parameter that shares a name with a mathjs member', () => {
        expect(detect('size*x')).toEqual(['size']);
        expect(detect('map*x')).toEqual(['map']);
        expect(detect('mode*x')).toEqual(['mode']);
        expect(detect('version*x')).toEqual(['version']);
    });

    test('Should merge the parameters of a parametric pair', () => {
        const engine = getMathEngine();
        const nodes = [engine.parse('a*cos(t)'), engine.parse('b*sin(t)')];

        expect(detectParameters(nodes, ['t'])).toEqual(['a', 'b']);
    });

    test('Should deduplicate and sort the parameters', () => {
        expect(detect('c*x + b*x + c*x + a')).toEqual(['a', 'b', 'c']);
    });

});
