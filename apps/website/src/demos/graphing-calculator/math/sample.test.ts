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
} from './compile';

import {
    loadMathEngine,
} from './engine';

import {
    samplePlot,
    SEED_SPACING_PX,
} from './sample';

import type {
    CompiledExpression,
    PlotSampleOptions,
    SampledBranch,
    Viewport2D,
} from '../types';

const WIDTH = 600;
const HEIGHT = 400;

function createViewport(xMin: number, xMax: number, yMin: number, yMax: number): Viewport2D {
    return {
        xMin,
        xMax,
        yMin,
        yMax,
        width: WIDTH,
        height: HEIGHT,
    };
}

function createOptions(viewport: Viewport2D): PlotSampleOptions {
    return {
        viewport,
        params: new Map(),
        devicePixelRatio: 1,
    };
}

function compile(source: string): CompiledExpression {
    return compileExpression(classifyExpression(source));
}

function sample(source: string, viewport: Viewport2D): SampledBranch[] {
    return samplePlot(compile(source), createOptions(viewport));
}

function countPoints(branches: SampledBranch[]): number {
    return branches.reduce((total, branch) => total + branch.points.length, 0);
}

function toDataX(px: number, viewport: Viewport2D): number {
    return viewport.xMin + (px / viewport.width) * (viewport.xMax - viewport.xMin);
}

describe('Graphing calculator curve sampling', () => {

    beforeAll(async () => {
        await loadMathEngine();
    });

    test('Should emit a single branch for a continuous curve', () => {
        const branches = sample('y = sin(x)', createViewport(-10, 10, -2, 2));

        expect(branches).toHaveLength(1);
        expect(branches[0].points.length).toBeGreaterThan(10);
    });

    test('Should break a branch at every pole of tan', () => {
        const branches = sample('y = tan(x)', createViewport(-2 * Math.PI, 2 * Math.PI, -4, 4));

        expect(branches.length).toBeGreaterThanOrEqual(4);
    });

    test('Should split a reciprocal into exactly two branches', () => {
        const branches = sample('y = 1/x', createViewport(-2, 2, -2, 2));

        expect(branches).toHaveLength(2);
    });

    test('Should split an even reciprocal into exactly two branches', () => {
        const branches = sample('y = 1/x^2', createViewport(-2, 2, -2, 2));

        expect(branches).toHaveLength(2);
    });

    test('Should break a step function at each step', () => {
        const branches = sample('y = floor(x)', createViewport(-3, 3, -4, 4));

        expect(branches.length).toBeGreaterThanOrEqual(5);
    });

    test('Should start a square root at its domain edge and never emit NaN', () => {
        const viewport = createViewport(-2, 2, -1, 3);
        const branches = sample('y = sqrt(x)', viewport);

        expect(branches).toHaveLength(1);
        expect(toDataX(branches[0].points[0][0], viewport)).toBeCloseTo(0, 3);

        for (const branch of branches) {
            for (const [px, py] of branch.points) {
                expect(Number.isFinite(px)).toBe(true);
                expect(Number.isFinite(py)).toBe(true);
            }
        }
    });

    // Proves the subdivision is curvature-driven rather than blanket oversampling.
    test('Should keep a straight line near the seed count', () => {
        const seeds = Math.ceil(WIDTH / SEED_SPACING_PX);
        const branches = sample('y = 0.5*x', createViewport(-10, 10, -10, 10));

        expect(branches).toHaveLength(1);
        expect(countPoints(branches)).toBeLessThanOrEqual(seeds + 2);
    });

    test('Should spend more samples on a curved line than a straight one', () => {
        const viewport = createViewport(-10, 10, -2, 2);
        const straight = countPoints(sample('y = 0.5*x', viewport));
        const curved = countPoints(sample('y = sin(5*x)', viewport));

        expect(curved).toBeGreaterThan(straight);
    });

    test('Should honor the evaluation ceiling', () => {
        const options = createOptions(createViewport(-10, 10, -2, 2));
        const branches = samplePlot(compile('y = sin(50*x)'), {
            ...options,
            maxEvaluations: 200,
        });

        expect(countPoints(branches)).toBeLessThan(400);
    });

    test('Should sweep an explicit x equation over the vertical range', () => {
        const branches = sample('x = y^2', createViewport(-1, 5, -2, 2));

        expect(branches).toHaveLength(1);
        expect(branches[0].points.length).toBeGreaterThan(10);
    });

    test('Should sweep a polar equation over a full turn', () => {
        const branches = sample('r = 1 + cos(theta)', createViewport(-3, 3, -2, 2));

        expect(branches).toHaveLength(1);
        expect(branches[0].points.length).toBeGreaterThan(10);
    });

    test('Should sweep a parametric pair over the parameter range', () => {
        const branches = sample('(cos(t), sin(t))', createViewport(-2, 2, -2, 2));

        expect(branches).toHaveLength(1);
        expect(branches[0].points.length).toBeGreaterThan(10);
    });

    test('Should substitute parameter values into the sweep', () => {
        const compiled = compile('y = a*x');
        const viewport = createViewport(-1, 1, -4, 4);
        const flat = samplePlot(compiled, {
            ...createOptions(viewport),
            params: new Map([['a', 0]]),
        });
        const steep = samplePlot(compiled, {
            ...createOptions(viewport),
            params: new Map([['a', 3]]),
        });

        expect(flat[0].points[0][1]).toBeCloseTo(HEIGHT / 2, 6);
        expect(steep[0].points[0][1]).toBeGreaterThan(HEIGHT / 2);
    });

    test('Should return nothing for an expression that failed to compile', () => {
        expect(sample('y = sin(x', createViewport(-1, 1, -1, 1))).toEqual([]);
    });

    test('Should return nothing for a degenerate viewport', () => {
        expect(sample('y = x', createViewport(0, 0, -1, 1))).toEqual([]);
    });

});
