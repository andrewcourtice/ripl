import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    getMathEngine,
    loadMathEngine,
} from './engine';

describe('Graphing calculator math engine', () => {

    test('Should memoize the loaded module', async () => {
        const first = await loadMathEngine();
        const second = await loadMathEngine();

        expect(first).toBe(second);
    });

    test('Should expose the engine synchronously once loaded', async () => {
        await loadMathEngine();

        expect(getMathEngine().parse('1 + 1').type).toBe('OperatorNode');
    });

    test('Should build a difference node from two parsed sides', async () => {
        const engine = await loadMathEngine();
        const difference = new engine.OperatorNode('-', 'subtract', [engine.parse('x^2 + y^2'), engine.parse('4')]);
        const scope = new Map([['x', 2], ['y', 0]]);

        expect(difference.compile().evaluate(scope)).toBe(0);
    });

    test('Should return NaN rather than a complex number outside a real domain', async () => {
        const engine = await loadMathEngine();
        const scope = new Map([['x', -1]]);

        expect(engine.parse('sqrt(x)').compile().evaluate(scope)).toBeNaN();
        expect(engine.parse('log(x)').compile().evaluate(scope)).toBeNaN();
    });

});
