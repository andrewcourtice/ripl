import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    createContext,
    createCube,
} from '../src';

import type {
    CanvasContext3D,
} from '../src';

import {
    createScene,
} from '@ripl/core';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

polyfillPath2D();

describe('Shape3D', () => {

    let host: HTMLDivElement;

    beforeEach(() => {
        mockCanvasContext();
        host = document.createElement('div');
        document.body.appendChild(host);

        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
            left: 0,
            top: 0,
            right: 400,
            bottom: 300,
            width: 400,
            height: 300,
            x: 0,
            y: 0,
            toJSON: () => ({}),
        }) as DOMRect);
    });

    afterEach(() => {
        host.remove();
        vi.restoreAllMocks();
    });

    function createFixture() {
        const context = createContext(host) as CanvasContext3D;

        context.setCamera([0, 0, 5], [0, 0, 0], [0, 1, 0]);

        return context;
    }

    describe('Fill parsing', () => {

        // 3D-1: `parseColor` returns undefined for anything but hex/rgb/hsl, and the unguarded
        // `triangulateFacesFlat` then threw out of the whole render pass.
        test('Should render a shape whose fill is a named colour', () => {
            const context = createFixture();
            const scene = createScene(context, {
                children: [
                    createCube({
                        size: 1,
                        fill: 'red',
                    }),
                ],
            });

            expect(() => scene.render()).not.toThrow();
            expect(context.faceBuffer).toHaveLength(6);
        });

        test('Should degrade an unparseable fill to the raw style string', () => {
            const context = createFixture();
            const scene = createScene(context, {
                children: [
                    createCube({
                        size: 1,
                        fill: 'red',
                    }),
                ],
            });

            scene.render();

            expect(context.faceBuffer[0].fillColor).toBe('red');
        });

        test('Should render a shape whose fill is a gradient', () => {
            const context = createFixture();
            const scene = createScene(context, {
                children: [
                    createCube({
                        size: 1,
                        fill: 'linear-gradient(#ff0000, #0000ff)',
                    }),
                ],
            });

            expect(() => scene.render()).not.toThrow();
            expect(context.faceBuffer).toHaveLength(6);
        });

        test('Should still shade a parseable fill', () => {
            const context = createFixture();
            const scene = createScene(context, {
                children: [
                    createCube({
                        size: 1,
                        fill: '#ff0000',
                    }),
                ],
            });

            scene.render();

            expect(context.faceBuffer[0].fillColor).toMatch(/^rgba\(/);
        });

    });

    describe('Face shading', () => {

        // 3D-3: a declared `face.normal` is model-space and was never multiplied by the model
        // matrix, so CPU shading froze under rotation while the GPU shader kept transforming it.
        test('Should re-shade declared face normals under rotation', () => {
            const context = createFixture();
            const cube = createCube({
                size: 1,
                fill: '#ff0000',
            });

            const scene = createScene(context, {
                children: [cube],
            });

            scene.render();

            const before = context.faceBuffer.map(face => face.fillColor).sort();

            cube.rotationY = Math.PI / 4;
            scene.render();

            const after = context.faceBuffer.map(face => face.fillColor).sort();

            expect(after).not.toEqual(before);
        });

        test('Should leave shading unchanged when the shape does not rotate', () => {
            const context = createFixture();
            const cube = createCube({
                size: 1,
                fill: '#ff0000',
            });

            const scene = createScene(context, {
                children: [cube],
            });

            scene.render();

            const before = context.faceBuffer.map(face => face.fillColor).sort();

            cube.x = 0.5;
            scene.render();

            expect(context.faceBuffer.map(face => face.fillColor).sort()).toEqual(before);
        });

    });

    describe('Geometry transitions', () => {

        function projectedSpan(context: CanvasContext3D): number {
            const xs = context.faceBuffer.flatMap(face => face.points.map(point => point[0]));

            return Math.max(...xs) - Math.min(...xs);
        }

        // 3D-4: the interpolate tick writes `state[key]` directly, bypassing the `setStateValue`
        // override that is the face cache's only invalidation path.
        test('Should grow the rendered mesh as a size transition ticks', () => {
            const context = createFixture();
            const cube = createCube({
                size: 1,
                fill: '#ff0000',
            });

            const scene = createScene(context, {
                children: [cube],
            });

            scene.render();

            const before = projectedSpan(context);

            const tick = cube.interpolate({
                size: 3,
            });

            tick(1);
            scene.render();

            expect(projectedSpan(context)).toBeGreaterThan(before * 2);
        });

        // A completed transition leaves `state.size === 3`, so the setter short-circuits and cannot
        // recover the stale cache. Only a cube authored at 3 gives an independent reference span.
        test('Should match a natively sized shape after a completed size transition', () => {
            const grown = createFixture();
            const cube = createCube({
                size: 1,
                fill: '#ff0000',
            });

            const grownScene = createScene(grown, {
                children: [cube],
            });

            // Warm the face cache at the start value; a cold cache hides the defect entirely.
            grownScene.render();

            cube.interpolate({
                size: 3,
            })(1);

            grownScene.render();

            const reference = createFixture();
            const referenceScene = createScene(reference, {
                children: [
                    createCube({
                        size: 3,
                        fill: '#ff0000',
                    }),
                ],
            });

            referenceScene.render();

            expect(projectedSpan(grown)).toBeCloseTo(projectedSpan(reference));
        });

        test('Should refresh the bounding box after a size transition', () => {
            const context = createFixture();
            const cube = createCube({
                size: 1,
                fill: '#ff0000',
            });

            const scene = createScene(context, {
                children: [cube],
            });

            scene.render();

            const before = cube.getBoundingBox().width;

            cube.interpolate({
                size: 3,
            })(1);

            scene.render();

            expect(cube.getBoundingBox().width).toBeGreaterThan(before * 2);
        });

    });

});
