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
    sampleImplicit,
} from './implicit';

import type {
    PlotSampleOptions,
    SampledBranch,
    Viewport2D,
} from '../types';

const VIEWPORT: Viewport2D = {
    xMin: -2,
    xMax: 2,
    yMin: -2,
    yMax: 2,
    width: 400,
    height: 400,
};

function createOptions(): PlotSampleOptions {
    return {
        viewport: VIEWPORT,
        params: new Map(),
        devicePixelRatio: 1,
    };
}

function trace(source: string, cellSize?: number): SampledBranch[] {
    return sampleImplicit(compileExpression(classifyExpression(source)), createOptions(), cellSize);
}

function toDataRadius([px, py]: readonly [number, number]): number {
    const x = VIEWPORT.xMin + (px / VIEWPORT.width) * (VIEWPORT.xMax - VIEWPORT.xMin);
    const y = VIEWPORT.yMax - (py / VIEWPORT.height) * (VIEWPORT.yMax - VIEWPORT.yMin);

    return Math.hypot(x, y);
}

describe('Graphing calculator implicit tracing', () => {

    beforeAll(async () => {
        await loadMathEngine();
    });

    test('Should close a unit circle into a single loop', () => {
        const branches = trace('x^2 + y^2 = 1');

        expect(branches).toHaveLength(1);

        const { points } = branches[0];

        expect(points.length).toBeGreaterThan(20);
        expect(points[0]).toEqual(points[points.length - 1]);
    });

    test('Should place the traced circle at the right radius', () => {
        const [branch] = trace('x^2 + y^2 = 1');

        for (const point of branch.points) {
            expect(toDataRadius(point)).toBeCloseTo(1, 2);
        }
    });

    test('Should trace both loops of a two-component contour', () => {
        const branches = trace('x^2 - y^2 = 1');

        expect(branches).toHaveLength(2);
    });

    // An unresolved saddle drops the ambiguous cell's two segments and leaves four stubs instead.
    test('Should resolve an ambiguous saddle cell into two crossing runs', () => {
        expect(trace('x*y = 0', 9)).toHaveLength(2);
        expect(trace('x*y = 0', 11)).toHaveLength(2);
        expect(trace('x*y = 0', 13)).toHaveLength(2);
    });

    test('Should coarsen the grid when the cell size grows', () => {
        const fine = trace('x^2 + y^2 = 1', 8);
        const coarse = trace('x^2 + y^2 = 1', 32);

        expect(coarse[0].points.length).toBeLessThan(fine[0].points.length);
    });

    test('Should cap the grid at the evaluation budget', () => {
        const compiled = compileExpression(classifyExpression('x^2 + y^2 = 1'));
        const branches = sampleImplicit(compiled, {
            ...createOptions(),
            maxEvaluations: 400,
        });

        expect(branches).toHaveLength(1);
    });

    // A NaN vertex invalidates its four incident cells, or the contour grows a spurious edge at x = 0.
    test('Should not emit a contour through an undefined region', () => {
        const branches = trace('log(x) + y = 0');

        for (const branch of branches) {
            for (const [px] of branch.points) {
                expect(px).toBeGreaterThan(VIEWPORT.width / 2 - 1);
            }
        }
    });

    test('Should return nothing when the contour is empty', () => {
        expect(trace('x^2 + y^2 = -1')).toEqual([]);
    });

    test('Should return nothing for an expression that failed to compile', () => {
        expect(trace('x^2 + y^2 = ')).toEqual([]);
    });

});
