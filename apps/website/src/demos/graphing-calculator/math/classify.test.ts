import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    classifyExpression,
} from './classify';

describe('Graphing calculator classification', () => {

    test('Should read an explicit y equation', () => {
        const classified = classifyExpression('y = sin(x)');

        expect(classified.kind).toBe('explicit-y');
        expect(classified.bodies).toEqual(['sin(x)']);
        expect(classified.variables).toEqual(['x']);
    });

    test('Should read an explicit x equation', () => {
        const classified = classifyExpression('x = y^2 - 1');

        expect(classified.kind).toBe('explicit-x');
        expect(classified.bodies).toEqual(['y^2 - 1']);
        expect(classified.variables).toEqual(['y']);
    });

    test('Should read a polar equation', () => {
        const classified = classifyExpression('r = cos(3 theta)');

        expect(classified.kind).toBe('polar');
        expect(classified.variables).toEqual(['theta']);
    });

    test('Should normalize the theta symbol', () => {
        const classified = classifyExpression('r = cos(3θ)');

        expect(classified.kind).toBe('polar');
        expect(classified.bodies).toEqual(['cos(3theta)']);
    });

    test('Should read a parametric pair', () => {
        const classified = classifyExpression('(cos(t), sin(t))');

        expect(classified.kind).toBe('parametric');
        expect(classified.bodies).toEqual(['cos(t)', 'sin(t)']);
        expect(classified.variables).toEqual(['t']);
    });

    test('Should read a surface equation', () => {
        const classified = classifyExpression('z = x^2 - y^2');

        expect(classified.kind).toBe('surface');
        expect(classified.variables).toEqual(['x', 'y']);
    });

    test('Should read an implicit equation as two bodies', () => {
        const classified = classifyExpression('x^2 + y^2 = 4');

        expect(classified.kind).toBe('implicit');
        expect(classified.bodies).toEqual(['x^2 + y^2', '4']);
        expect(classified.variables).toEqual(['x', 'y']);
    });

    test('Should treat a bare expression as an implied y equation', () => {
        const classified = classifyExpression('sin(x) * x');

        expect(classified.kind).toBe('explicit-y');
        expect(classified.bodies).toEqual(['sin(x) * x']);
    });

    test('Should treat a bare expression in x and y as a contour at zero', () => {
        const classified = classifyExpression('x^2 + y^2 - 4');

        expect(classified.kind).toBe('implicit');
        expect(classified.bodies).toEqual(['x^2 + y^2 - 4', '0']);
    });

    test('Should treat a bare expression in theta as polar', () => {
        const classified = classifyExpression('1 + cos(theta)');

        expect(classified.kind).toBe('polar');
        expect(classified.variables).toEqual(['theta']);
    });

    test('Should not split an inequality on its equals sign', () => {
        const classified = classifyExpression('x >= 2');

        expect(classified.kind).toBe('explicit-y');
        expect(classified.bodies).toEqual(['x >= 2']);
    });

    test('Should split an explicit equality operator', () => {
        const classified = classifyExpression('x^2 + y^2 == 4');

        expect(classified.kind).toBe('implicit');
        expect(classified.bodies).toEqual(['x^2 + y^2', '4']);
    });

    test('Should reject an empty line', () => {
        const classified = classifyExpression('   ');

        expect(classified.kind).toBe('invalid');
        expect(classified.error).toBeTruthy();
    });

    test('Should reject a parametric tuple that is not a pair', () => {
        const classified = classifyExpression('(cos(t), sin(t), t)');

        expect(classified.kind).toBe('invalid');
        expect(classified.error).toBeTruthy();
    });

    test('Should reject an equation with an unsupported left hand side', () => {
        const classified = classifyExpression('f(x) = x^2');

        expect(classified.kind).toBe('invalid');
        expect(classified.error).toBeTruthy();
    });

    test('Should reject an equation missing a side', () => {
        const classified = classifyExpression('y =');

        expect(classified.kind).toBe('invalid');
        expect(classified.error).toBeTruthy();
    });

});
