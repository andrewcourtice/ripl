import {
    beforeAll,
    describe,
    expect,
    test,
} from 'vitest';

import {
    classifyExpression,
} from './classify';

import {
    compileExpression,
    createEvaluationScope,
} from './compile';

import {
    loadMathEngine,
} from './engine';

import type {
    CompiledExpression,
} from '../types';

function compile(source: string): CompiledExpression {
    return compileExpression(classifyExpression(source));
}

describe('Graphing calculator compilation', () => {

    beforeAll(async () => {
        await loadMathEngine();
    });

    test('Should compile an explicit expression', () => {
        const compiled = compile('y = sin(x)');

        expect(compiled.kind).toBe('explicit-y');
        expect(compiled.error).toBeUndefined();
        expect(compiled.evaluate(new Map([['x', 0]]))).toBe(0);
    });

    test('Should report the free symbols as parameters', () => {
        const compiled = compile('y = a*sin(b*x)');

        expect(compiled.params).toEqual(['a', 'b']);
    });

    // parse('x^2+y^2 = 4') throws outright, so the field has to be built by AST subtraction.
    test('Should compile an implicit equation into a difference field', () => {
        const compiled = compile('x^2 + y^2 = 4');

        expect(compiled.kind).toBe('implicit');
        expect(compiled.error).toBeUndefined();
        expect(compiled.evaluate(new Map([['x', 2], ['y', 0]]))).toBe(0);
        expect(compiled.evaluate(new Map([['x', 0], ['y', 0]]))).toBe(-4);
    });

    test('Should compile both bodies of a parametric pair', () => {
        const compiled = compile('(cos(t), sin(t))');
        const scope = new Map([['t', 0]]);

        expect(compiled.kind).toBe('parametric');
        expect(compiled.evaluate(scope)).toBe(1);
        expect(compiled.evaluateY?.(scope)).toBe(0);
    });

    test('Should surface unbalanced parentheses as an inline error', () => {
        const compiled = compile('y = sin(x');

        expect(compiled.kind).toBe('invalid');
        expect(compiled.error).toBeTruthy();
        expect(compiled.evaluate(new Map())).toBeNaN();
    });

    test('Should reject an inequality rather than split it on the equals sign', () => {
        const compiled = compile('x >= 2');

        expect(compiled.kind).toBe('invalid');
        expect(compiled.error).toBeTruthy();
    });

    test('Should reject an expression the guard refuses', () => {
        expect(compile('y = zeros(1e8)').error).toBeTruthy();
        expect(compile('y = 1:1e9').error).toBeTruthy();
    });

    test('Should return NaN outside the real domain instead of throwing', () => {
        const compiled = compile('y = sqrt(x)');

        expect(compiled.evaluate(new Map([['x', -1]]))).toBeNaN();
        expect(compiled.evaluate(new Map([['x', 4]]))).toBe(2);
    });

    test('Should return Infinity for a division by zero', () => {
        const compiled = compile('y = 1/x');

        expect(compiled.evaluate(new Map([['x', 0]]))).toBe(Infinity);
    });

    test('Should build a scope holding only the parameters', () => {
        const compiled = compile('y = a*sin(b*x)');
        const scope = createEvaluationScope(compiled, new Map([['a', 3]]));

        expect(scope.get('a')).toBe(3);
        expect(scope.get('b')).toBe(1);
        expect(scope.has('x')).toBe(false);
    });

});
