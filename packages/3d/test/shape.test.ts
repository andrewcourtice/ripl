import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    mockHostSize,
    mockPaintLog,
} from './paint-log';

import type {
    PaintLogStub,
    PaintRecord,
} from './paint-log';

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
    createContext as createCanvasContext,
} from '@ripl/canvas';

import {
    polyfillPath2D,
} from '@ripl/test-utils';

polyfillPath2D();

describe('Shape3D', () => {

    let host: HTMLDivElement;
    let paint: PaintLogStub;

    beforeEach(() => {
        paint = mockPaintLog();
        host = document.createElement('div');
        document.body.appendChild(host);

        mockHostSize(400, 300);
    });

    afterEach(() => {
        host.remove();
        vi.restoreAllMocks();
    });

    function createFixture(): CanvasContext3D {
        const context = createContext(host);

        context.setCamera([0, 0, 5], [0, 0, 0], [0, 1, 0]);

        return context;
    }

    function faceFills(): PaintRecord[] {
        return paint.records.filter(record => record.op === 'face-fill');
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
            expect(faceFills()).toHaveLength(6);
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

            expect(faceFills()[0].fillStyle).toBe('red');
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
            expect(faceFills()).toHaveLength(6);
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

            expect(faceFills()[0].fillStyle).toMatch(/^rgba\(/);
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

            const before = faceFills().map(record => record.fillStyle).sort();

            paint.records.length = 0;
            cube.rotationY = Math.PI / 4;
            scene.render();

            expect(faceFills().map(record => record.fillStyle).sort()).not.toEqual(before);
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

            const before = faceFills().map(record => record.fillStyle).sort();

            paint.records.length = 0;
            cube.x = 0.5;
            scene.render();

            expect(faceFills().map(record => record.fillStyle).sort()).toEqual(before);
        });

    });

    describe('Mesh submission', () => {

        // 3D-14: `submitMesh` is a no-op on a CPU context, but the interleaved mesh was still
        // built and thrown away — 29 KB of vertices per sphere per frame, immediately garbage.
        test('Should not build a GPU mesh on a CPU context', () => {
            const context = createFixture();
            const submitMesh = vi.spyOn(context, 'submitMesh');

            createScene(context, {
                children: [
                    createCube({
                        size: 1,
                        fill: '#ff0000',
                    }),
                ],
            }).render();

            expect(submitMesh).not.toHaveBeenCalled();
        });

    });

    describe('Context requirements', () => {

        // 3D-20: `Shape3D.render` cast the context and called `submitMesh`, so a 3D element in a
        // plain 2D scene died on `ctx.submitMesh is not a function`.
        test('Should reject a plain 2D context with a diagnostic error', () => {
            const canvasHost = document.createElement('div');

            document.body.appendChild(canvasHost);

            const scene = createScene(createCanvasContext(canvasHost), {
                children: [
                    createCube({
                        size: 1,
                        fill: '#ff0000',
                    }),
                ],
            });

            expect(() => scene.render()).toThrow(/Shape3D needs a Context3D/);

            canvasHost.remove();
        });

    });

    describe('Picking depth', () => {

        // 3D-11: painting sorts per face but `_depth` was the shape's mean, so a shape whose
        // nearest face was in front of another could still lose the hit test to it.
        test('Should rank a shape by its nearest face, not its mean depth', () => {
            const context = createFixture();

            const slab = createCube({
                size: 4,
                rotationX: 1.2,
                fill: '#ff0000',
            });

            const chip = createCube({
                size: 0.2,
                z: 1.6,
                fill: '#00ff00',
            });

            createScene(context, {
                children: [slab, chip],
            }).render();

            expect(slab.zIndex).toBeGreaterThan(chip.zIndex);
        });

    });

    describe('Geometry transitions', () => {

        function paintedSpan(): number {
            const xs = faceFills().flatMap(record => record.points.map(point => point[0]));

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

            const before = paintedSpan();

            paint.records.length = 0;
            cube.interpolate({
                size: 3,
            })(1);
            scene.render();

            expect(paintedSpan()).toBeGreaterThan(before * 2);
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

            paint.records.length = 0;
            cube.interpolate({
                size: 3,
            })(1);
            grownScene.render();

            const grownSpan = paintedSpan();

            paint.records.length = 0;

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

            expect(grownSpan).toBeCloseTo(paintedSpan());
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
