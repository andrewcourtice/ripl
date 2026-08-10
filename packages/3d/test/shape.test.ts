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
    createPlane,
    createTorus,
} from '../src';

import type {
    CanvasContext3D,
} from '../src';

import {
    createGroup,
    createScene,
    factory,
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

    const nativeDevicePixelRatio = factory.devicePixelRatio;

    beforeEach(() => {
        paint = mockPaintLog();
        host = document.createElement('div');
        document.body.appendChild(host);

        mockHostSize(400, 300);
    });

    afterEach(() => {
        factory.set({
            devicePixelRatio: nativeDevicePixelRatio,
        });

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

        // 3D-1: the unguarded `triangulateFacesFlat` threw out of the whole render pass here.
        test('Should degrade an unparseable fill to the raw style string', () => {
            const context = createFixture();
            const scene = createScene(context, {
                children: [
                    createCube({
                        size: 1,
                        fill: 'currentColor',
                    }),
                ],
            });

            expect(() => scene.render()).not.toThrow();
            expect(faceFills()[0].fillStyle).toBe('currentColor');
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

    describe('Hit testing', () => {

        function firstFaceCentroid(): [number, number] {
            const { points } = faceFills()[0];

            return [
                points.reduce((total, point) => total + point[0], 0) / points.length,
                points.reduce((total, point) => total + point[1], 0) / points.length,
            ];
        }

        function renderCube(context: CanvasContext3D, options?: Parameters<typeof createCube>[0]) {
            const cube = createCube({
                size: 1,
                fill: '#ff0000',
                ...options,
            });

            createScene(context, {
                children: [cube],
            }).render();

            return cube;
        }

        // Hit testing costs nothing until something asks: the render only retains the world-space
        // vertices it already computed, and the ray is not built until a pointer position arrives.
        test('Should cast no ray while rendering', () => {
            const context = createFixture();
            const raycast = vi.spyOn(context, 'raycast');

            renderCube(context);

            expect(raycast).not.toHaveBeenCalled();
        });

        test('Should hit a point over the shape', () => {
            const context = createFixture();
            const cube = renderCube(context);
            const [x, y] = firstFaceCentroid();

            expect(cube.intersectsWith(x, y)).toBe(true);
        });

        test('Should miss a point clear of the shape', () => {
            const context = createFixture();
            const cube = renderCube(context);

            expect(cube.intersectsWith(-1000, -1000)).toBe(false);
        });

        test('Should hit a point over the shape under a pointer test', () => {
            const context = createFixture();
            const cube = renderCube(context);
            const [x, y] = firstFaceCentroid();

            expect(cube.intersectsWith(x, y, { isPointer: true })).toBe(true);
        });

        test('Should miss a point clear of the shape under a pointer test', () => {
            const context = createFixture();
            const cube = renderCube(context);

            expect(cube.intersectsWith(-1000, -1000, { isPointer: true })).toBe(false);
        });

        test('Should cast one ray however many times a frame is tested at the same point', () => {
            const context = createFixture();
            const cube = renderCube(context);
            const raycast = vi.spyOn(context, 'raycast');
            const [x, y] = firstFaceCentroid();

            cube.intersectsWith(x, y);
            cube.intersectsWith(x, y);
            cube.intersectsWith(x, y, { isPointer: true });
            cube.raycastDistance(x, y);

            expect(raycast).toHaveBeenCalledTimes(1);
        });

        // The pointer pipeline mapped logical onto surface before hit testing, but a 3D ray is cast
        // through `project`, which is already logical — so on retina every hit missed by the ratio.
        test('Should hit a projected face at the logical pointer position on a device-scaled surface', () => {
            factory.set({
                devicePixelRatio: 2,
            });

            const context = createFixture();
            const clicked = vi.fn();
            const cube = createCube({
                size: 1,
                fill: '#ff0000',
            });

            cube.on('click', clicked);

            createScene(context, {
                children: [cube],
            }).render();

            const [x, y] = firstFaceCentroid();

            context.element.dispatchEvent(new MouseEvent('click', {
                clientX: x,
                clientY: y,
            }));

            expect(clicked).toHaveBeenCalled();
        });

        test('Should re-cast against the new geometry after the next render', () => {
            const context = createFixture();
            const cube = createCube({
                size: 1,
                fill: '#ff0000',
            });
            const scene = createScene(context, {
                children: [cube],
            });

            scene.render();

            const [x, y] = firstFaceCentroid();

            expect(cube.intersectsWith(x, y)).toBe(true);

            context.setCamera([50, 0, 5], [50, 0, 0], [0, 1, 0]);
            scene.render();

            expect(cube.intersectsWith(x, y)).toBe(false);
        });

        // `Element.intersectsWith` ignores `options`, so a fallback under `isPointer` would make a
        // shape opted out of pointer events more hittable, not less.
        test('Should refuse a pointer test on a shape with pointerEvents none', () => {
            const context = createFixture();
            const cube = renderCube(context, {
                pointerEvents: 'none',
            });
            const [x, y] = firstFaceCentroid();

            expect(cube.intersectsWith(x, y, { isPointer: true })).toBe(false);
            expect(cube.intersectsWith(x, y)).toBe(true);
        });

        test('Should fall back to the bounding box before the shape has rendered', () => {
            const context = createFixture();
            const cube = createCube({
                size: 1,
                fill: '#ff0000',
            });

            createScene(context, {
                children: [cube],
            });

            expect(cube.intersectsWith(200, 150)).toBe(false);
        });

        /*
         * 3D-H1: the hit test flattened a shape to the union of its projected face outlines, which
         * reports a hit anywhere inside the silhouette — through the hole of a torus, between the
         * blades of a fan, across the bore of a casing.
         */
        test('Should miss the hole of a torus while hitting its ring', () => {
            const context = createContext(host);

            context.setCamera([0, 8, 0], [0, 0, 0], [0, 0, 1]);

            const torus = createTorus({
                radius: 2,
                tube: 0.4,
                radialSegments: 16,
                tubularSegments: 32,
                fill: '#ff0000',
            });

            createScene(context, {
                children: [torus],
            }).render();

            const centre = context.project([0, 0, 0]);
            const ring = context.project([2, 0, 0]);

            expect(torus.intersectsWith(centre[0], centre[1])).toBe(false);
            expect(torus.intersectsWith(ring[0], ring[1])).toBe(true);
        });

        // A culled face is not painted, so it must not be hit either — the pointer would otherwise
        // resolve to a side of the mesh that is not on screen.
        test('Should miss a single-sided plane seen from behind', () => {
            const context = createFixture();
            const plane = createPlane({
                width: 4,
                height: 4,
                rotationY: Math.PI,
                fill: '#ff0000',
                material: {
                    side: 'front',
                },
            });

            createScene(context, {
                children: [plane],
            }).render();

            expect(plane.intersectsWith(200, 150)).toBe(false);
        });

        test('Should hit a single-sided plane seen from the front', () => {
            const context = createFixture();
            const plane = createPlane({
                width: 4,
                height: 4,
                fill: '#ff0000',
                material: {
                    side: 'front',
                },
            });

            createScene(context, {
                children: [plane],
            }).render();

            expect(plane.intersectsWith(200, 150)).toBe(true);
        });

        // The painter applies the element's 2D world transform on top of the projection, and the
        // hit test never un-applied it — so a shape under a 2D group was hit where it was not drawn.
        test('Should hit a shape under a 2D group transform where it is painted', () => {
            const context = createFixture();
            const cube = createCube({
                size: 1,
                fill: '#ff0000',
            });

            createScene(context, {
                children: [
                    createGroup({
                        translateX: 60,
                        children: [cube],
                    }),
                ],
            }).render();

            // The recorded points are pre-CTM, so the shape is painted 60 logical pixels to the right.
            const [x, y] = firstFaceCentroid();

            expect(cube.intersectsWith(x + 60, y)).toBe(true);
            expect(cube.intersectsWith(x, y)).toBe(false);
        });

    });

});
