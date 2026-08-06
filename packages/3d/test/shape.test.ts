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
    factory,
} from '@ripl/core';

import type {
    ContextPath,
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

        type Polygon = [number, number][];

        function isPointInPolygon(polygon: Polygon, x: number, y: number): boolean {
            let inside = false;
            let previous = polygon.length - 1;

            for (let idx = 0; idx < polygon.length; idx++) {
                const [xi, yi] = polygon[idx];
                const [xj, yj] = polygon[previous];

                if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) {
                    inside = !inside;
                }

                previous = idx;
            }

            return inside;
        }

        // jsdom's Path2D records nothing, so the traced faces are captured and tested here instead.
        function mockPolygonHitTesting(context: CanvasContext3D) {
            const traces = new WeakMap<ContextPath, Polygon[]>();
            const createPath = context.createPath.bind(context);

            const spy = vi.spyOn(context, 'createPath').mockImplementation(id => {
                const path = createPath(id);
                const polygons: Polygon[] = [];

                traces.set(path, polygons);

                path.moveTo = (px, py) => {
                    polygons.push([[px, py]]);
                };

                path.lineTo = (px, py) => {
                    polygons[polygons.length - 1].push([px, py]);
                };

                return path;
            });

            vi.spyOn(context, 'isPointInPath').mockImplementation((path, px, py) => {
                return (traces.get(path) ?? []).some(polygon => isPointInPolygon(polygon, px, py));
            });

            vi.spyOn(context, 'isPointInStroke').mockImplementation(() => false);

            return spy;
        }

        function firstFaceCentroid(): [number, number] {
            const { points } = faceFills()[0];

            return [
                points.reduce((total, point) => total + point[0], 0) / points.length,
                points.reduce((total, point) => total + point[1], 0) / points.length,
            ];
        }

        function hitPathCalls(spy: ReturnType<typeof mockPolygonHitTesting>, id: string): number {
            return spy.mock.calls.filter(([pathId]) => pathId === `${id}:hit`).length;
        }

        // The trace cost ~5 native calls per face per frame and was thrown away whenever, as here,
        // nothing hit-tested the shape.
        test('Should not build a hit path while rendering', () => {
            const context = createFixture();
            const cube = createCube({
                size: 1,
                fill: '#ff0000',
            });

            const createPath = vi.spyOn(context, 'createPath');

            createScene(context, {
                children: [cube],
            }).render();

            expect(createPath).not.toHaveBeenCalledWith(`${cube.id}:hit`);
        });

        test('Should hit a point inside a projected face', () => {
            const context = createFixture();
            const cube = createCube({
                size: 1,
                fill: '#ff0000',
            });

            mockPolygonHitTesting(context);
            createScene(context, {
                children: [cube],
            }).render();

            const [x, y] = firstFaceCentroid();

            expect(cube.intersectsWith(x, y)).toBe(true);
        });

        test('Should miss a point outside every projected face', () => {
            const context = createFixture();
            const cube = createCube({
                size: 1,
                fill: '#ff0000',
            });

            mockPolygonHitTesting(context);
            createScene(context, {
                children: [cube],
            }).render();

            expect(cube.intersectsWith(-1000, -1000)).toBe(false);
        });

        test('Should hit a point inside a projected face under a pointer test', () => {
            const context = createFixture();
            const cube = createCube({
                size: 1,
                fill: '#ff0000',
            });

            mockPolygonHitTesting(context);
            createScene(context, {
                children: [cube],
            }).render();

            const [x, y] = firstFaceCentroid();

            expect(cube.intersectsWith(x, y, { isPointer: true })).toBe(true);
        });

        test('Should miss a point outside every projected face under a pointer test', () => {
            const context = createFixture();
            const cube = createCube({
                size: 1,
                fill: '#ff0000',
            });

            mockPolygonHitTesting(context);
            createScene(context, {
                children: [cube],
            }).render();

            expect(cube.intersectsWith(-1000, -1000, { isPointer: true })).toBe(false);
        });

        test('Should build the hit path once however many times a frame is tested', () => {
            const context = createFixture();
            const cube = createCube({
                size: 1,
                fill: '#ff0000',
            });

            const createPath = mockPolygonHitTesting(context);

            createScene(context, {
                children: [cube],
            }).render();

            const [x, y] = firstFaceCentroid();

            cube.intersectsWith(x, y);
            cube.intersectsWith(x, y);
            cube.intersectsWith(-1000, -1000, { isPointer: true });
            cube.intersectsWith(x, y, { isPointer: true });

            expect(hitPathCalls(createPath, cube.id)).toBe(1);
        });

        // The pointer pipeline mapped logical onto surface before hit testing, but a 3D hit path is
        // traced from `project`, which is already logical — so on retina every hit missed by the ratio.
        test('Should hit a projected face at the logical pointer position on a device-scaled surface', () => {
            factory.set({
                devicePixelRatio: 2,
            });

            const context = createFixture();
            const cube = createCube({
                size: 1,
                fill: '#ff0000',
            });

            const clicked = vi.fn();

            cube.on('click', clicked);
            mockPolygonHitTesting(context);

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

        test('Should rebuild the hit path after the next render', () => {
            const context = createFixture();
            const cube = createCube({
                size: 1,
                fill: '#ff0000',
            });

            const createPath = mockPolygonHitTesting(context);
            const scene = createScene(context, {
                children: [cube],
            });

            scene.render();

            const [x, y] = firstFaceCentroid();

            expect(cube.intersectsWith(x, y)).toBe(true);

            context.setCamera([50, 0, 5], [50, 0, 0], [0, 1, 0]);
            scene.render();

            expect(cube.intersectsWith(x, y)).toBe(false);
            expect(hitPathCalls(createPath, cube.id)).toBe(2);
        });

        // `Element.intersectsWith` ignores `options`, so a fallback under `isPointer` would make a
        // shape opted out of pointer events more hittable, not less.
        test('Should refuse a pointer test on a shape with pointerEvents none', () => {
            const context = createFixture();
            const cube = createCube({
                size: 1,
                fill: '#ff0000',
                pointerEvents: 'none',
            });

            mockPolygonHitTesting(context);
            createScene(context, {
                children: [cube],
            }).render();

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

            mockPolygonHitTesting(context);
            createScene(context, {
                children: [cube],
            });

            expect(cube.intersectsWith(200, 150)).toBe(false);
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
