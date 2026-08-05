import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    createGraph2D,
} from './graph-2d';

import type {
    Graph2D,
} from './graph-2d';

import {
    DEFAULT_GRAPH_THEME,
} from './theme';

import type {
    CompiledExpression,
    SampledBranch,
    SamplePlot,
    Viewport2D,
} from '../types';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

import {
    isGroup,
} from '@ripl/web';

import type {
    Group,
} from '@ripl/web';

const WIDTH = 800;
const HEIGHT = 600;

const EXPRESSION: CompiledExpression = {
    kind: 'explicit-y',
    variables: ['x'],
    params: [],
    evaluate: scope => scope.get('x') ?? 0,
};

interface SamplerStub {
    sample: SamplePlot;
    viewports: Viewport2D[];
}

function createSampler(branches: SampledBranch[] = [{ points: [[0, 0], [400, 300], [800, 100]] }]): SamplerStub {
    const viewports: Viewport2D[] = [];

    return {
        viewports,
        sample: (_expression, options) => {
            viewports.push(options.viewport);
            return branches;
        },
    };
}

function countElements(group: Group): number {
    return group.children.reduce((total, child) => total + 1 + (isGroup(child) ? countElements(child) : 0), 0);
}

describe('Graph2D', () => {

    let host: HTMLDivElement;
    let graph: Graph2D;
    let sampler: SamplerStub;

    function tick(): void {
        graph.renderer.emit('tick', {
            time: 0,
            deltaTime: 16,
        });
    }

    beforeEach(() => {
        polyfillPath2D();
        mockCanvasContext();

        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
            width: WIDTH,
            height: HEIGHT,
            left: 0,
            top: 0,
            right: WIDTH,
            bottom: HEIGHT,
            x: 0,
            y: 0,
            toJSON: () => ({}),
        }));

        host = document.createElement('div');
        document.body.appendChild(host);

        sampler = createSampler();
        graph = createGraph2D(host, {
            sample: sampler.sample,
            theme: DEFAULT_GRAPH_THEME,
        });

        graph.setExpressions([{
            id: 'a',
            expression: EXPRESSION,
            color: '#ff0000',
            visible: true,
        }]);
    });

    afterEach(() => {
        graph.destroy();
        host.remove();
        vi.restoreAllMocks();
    });

    describe('Repaint', () => {

        // A `cachePath: false` path never goes `$dirty`, so the curve freezes mid-pan without this.
        test('Should invalidate the scene after re-sampling into the buffers', () => {
            tick();
            graph.scene.render();

            expect(graph.scene.needsRender).toBe(false);

            graph.setParams(new Map([['a', 2]]));
            tick();

            expect(graph.scene.needsRender).toBe(true);
        });

        test('Should re-sample once per tick rather than per navigator event', () => {
            tick();

            const before = sampler.viewports.length;

            graph.navigator.panBy(10, 0);
            graph.navigator.panBy(10, 0);
            graph.navigator.zoomBy(1.2, [400, 300]);

            expect(sampler.viewports).toHaveLength(before);

            tick();

            expect(sampler.viewports).toHaveLength(before + 1);
        });

    });

    describe('View', () => {

        test('Should map both axes at the same units per pixel', () => {
            tick();

            const viewport = graph.getViewport();

            expect((viewport.xMax - viewport.xMin) / viewport.width).toBeCloseTo((viewport.yMax - viewport.yMin) / viewport.height, 12);
        });

        test('Should hold the square aspect through a zoom', () => {
            graph.navigator.zoomBy(4, [123, 456]);
            tick();

            const viewport = graph.getViewport();

            expect((viewport.xMax - viewport.xMin) / viewport.width).toBeCloseTo((viewport.yMax - viewport.yMin) / viewport.height, 12);
        });

        test('Should keep the y window ascending rather than mirroring the plot', () => {
            tick();

            const before = graph.getViewport();

            graph.navigator.panBy(0, 50);
            tick();

            const after = graph.getViewport();

            expect(before.yMax).toBeGreaterThan(before.yMin);
            expect(after.yMax).toBeGreaterThan(after.yMin);
            expect(after.yMin).toBeGreaterThan(before.yMin);
        });

        // Rebuilding the base from the derived domain composes the transform twice and the view runs away.
        test('Should pan by a constant data distance per constant pixel delta', () => {
            tick();

            const start = graph.getViewport().xMin;

            graph.navigator.panBy(-100, 0);
            tick();

            const first = graph.getViewport().xMin;

            graph.navigator.panBy(-100, 0);
            tick();

            const second = graph.getViewport().xMin;

            expect(second - first).toBeCloseTo(first - start, 9);
        });

        test('Should frame the configured extent on the shorter axis', () => {
            tick();

            const viewport = graph.getViewport();

            expect(viewport.yMin).toBeCloseTo(-10, 9);
            expect(viewport.yMax).toBeCloseTo(10, 9);
        });

        test('Should restore the default window on reset', () => {
            graph.navigator.zoomBy(8, [10, 10]);
            graph.navigator.panBy(250, -75);
            tick();

            graph.resetView();
            tick();

            const viewport = graph.getViewport();

            expect(viewport.xMin).toBeCloseTo(-viewport.xMax, 9);
            expect(viewport.yMin).toBeCloseTo(-10, 9);
        });

        test('Should stop zooming in once the window reaches the float64 floor', () => {
            for (let i = 0; i < 40; i++) {
                graph.navigator.zoomBy(1e3, [400, 300]);
                tick();
            }

            const viewport = graph.getViewport();

            expect(viewport.xMax - viewport.xMin).toBeGreaterThan(0);
            expect(Number.isFinite(viewport.xMin)).toBe(true);
        });

    });

    describe('Topology', () => {

        test('Should hold the element count constant across a zoom sweep', () => {
            tick();

            const before = countElements(graph.scene);

            for (let i = 0; i < 12; i++) {
                graph.navigator.zoomBy(0.5, [400, 300]);
                tick();
            }

            expect(countElements(graph.scene)).toBe(before);
        });

        test('Should add one element per expression, not one per branch', () => {
            const before = countElements(graph.scene);

            graph.setExpressions([
                {
                    id: 'a',
                    expression: EXPRESSION,
                    color: '#ff0000',
                    visible: true,
                },
                {
                    id: 'b',
                    expression: EXPRESSION,
                    color: '#00ff00',
                    visible: true,
                },
            ]);

            expect(countElements(graph.scene)).toBe(before + 1);
        });

        test('Should drop the elements of expressions that leave the list', () => {
            const before = countElements(graph.scene);

            graph.setExpressions([]);

            expect(countElements(graph.scene)).toBe(before - 1);
        });

    });

    describe('Sampling', () => {

        test('Should pass the visible window to the sampler', () => {
            tick();

            const viewport = sampler.viewports[sampler.viewports.length - 1];

            expect(viewport.width).toBe(WIDTH);
            expect(viewport.height).toBe(HEIGHT);
            expect(viewport.xMax).toBeGreaterThan(viewport.xMin);
        });

        test('Should skip an expression that is hidden or failed to compile', () => {
            graph.setExpressions([{
                id: 'a',
                expression: EXPRESSION,
                color: '#ff0000',
                visible: false,
            }]);

            tick();

            expect(sampler.viewports).toHaveLength(0);
        });

    });

});
