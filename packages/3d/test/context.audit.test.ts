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
    createCircle,
    createGroup,
    createScene,
} from '@ripl/core';

import {
    createContext as createCanvasContext,
    releaseCanvasPaintCache,
} from '@ripl/canvas';

import {
    polyfillPath2D,
} from '@ripl/test-utils';

polyfillPath2D();

/** Regression tests for the deferred face-draw findings of the rendering-context audit. */
describe('CanvasContext3D deferred face draw', () => {

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

    function faceStrokes(): PaintRecord[] {
        return paint.records.filter(record => record.op === 'face-stroke');
    }

    describe('Resolved drawing state', () => {

        // 3D-2: the flush runs inside `markRenderEnd`, after every element `restore()` and
        // `popGroup()`, so nothing the element or its groups applied was still in force.
        test('Should composite element opacity under group opacity at every face', () => {
            const context = createFixture();
            const scene = createScene(context, {
                children: [
                    createGroup({
                        opacity: 0.25,
                        children: [
                            createCube({
                                size: 1,
                                fill: '#ff0000',
                                opacity: 0.5,
                            }),
                        ],
                    }),
                ],
            });

            scene.render();

            const alphas = faceFills().map(record => record.globalAlpha);

            expect(alphas).toHaveLength(6);

            for (const alpha of alphas) {
                expect(alpha).toBeCloseTo(0.125);
            }
        });

        test('Should carry the element composite operation to every face', () => {
            const context = createFixture();
            const scene = createScene(context, {
                children: [
                    createCube({
                        size: 1,
                        fill: '#ff0000',
                        globalCompositeOperation: 'multiply',
                    }),
                ],
            });

            scene.render();

            for (const record of faceFills()) {
                expect(record.globalCompositeOperation).toBe('multiply');
            }
        });

        test('Should carry the element filter to every face', () => {
            const context = createFixture();
            const scene = createScene(context, {
                children: [
                    createCube({
                        size: 1,
                        fill: '#ff0000',
                        filter: 'blur(2px)',
                    }),
                ],
            });

            scene.render();

            for (const record of faceFills()) {
                expect(record.filter).toBe('blur(2px)');
            }
        });

        test('Should carry a group transform into the face draw', () => {
            const context = createFixture();
            const scene = createScene(context, {
                children: [
                    createGroup({
                        translateX: 100,
                        translateY: 50,
                        children: [
                            createCube({
                                size: 1,
                                fill: '#ff0000',
                            }),
                        ],
                    }),
                ],
            });

            scene.render();

            for (const record of faceFills()) {
                expect(record.matrix[4]).toBeCloseTo(100);
                expect(record.matrix[5]).toBeCloseTo(50);
            }
        });

        test('Should carry the element own transform into the face draw', () => {
            const context = createFixture();
            const scene = createScene(context, {
                children: [
                    createCube({
                        size: 1,
                        fill: '#ff0000',
                        translateX: 40,
                    }),
                ],
            });

            scene.render();

            for (const record of faceFills()) {
                expect(record.matrix[4]).toBeCloseTo(40);
            }
        });

        test('Should leave no transform in force for an untransformed shape', () => {
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

            for (const record of faceFills()) {
                expect(record.matrix).toEqual([1, 0, 0, 1, 0, 0]);
            }
        });

        test('Should leave no save outstanding after a frame', () => {
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
            scene.render();

            expect(paint.getSaveDepth()).toBe(0);
        });

    });

    describe('Stroke line width', () => {

        // 3D-8: the loop recorded `lineWidth` as applied even when `_drawFace` early-returned on a
        // face with no stroke, so the next stroked face at the same width saw a false cache hit.
        test('Should stroke at the element line width after an unstroked face at the same width', () => {
            const context = createFixture();
            const scene = createScene(context, {
                children: [
                    createCube({
                        size: 1,
                        z: -2,
                        fill: '#ff0000',
                        lineWidth: 8,
                    }),
                    createCube({
                        size: 1,
                        z: 2,
                        fill: '#00ff00',
                        stroke: '#000000',
                        lineWidth: 8,
                    }),
                ],
            });

            scene.render();

            const widths = faceStrokes().map(record => record.lineWidth);

            expect(widths).toHaveLength(6);

            for (const width of widths) {
                expect(width).toBe(8);
            }
        });

    });

    describe('Paint order', () => {

        // 3D-9: 2D shapes drew immediately while 3D faces flushed once at depth 0, so a 2D element
        // added after a 3D shape was always painted underneath it.
        test('Should paint a 2D element added after a 3D shape on top of it', () => {
            const context = createFixture();
            const scene = createScene(context, {
                children: [
                    createCube({
                        size: 1,
                        fill: '#ff0000',
                    }),
                    createCircle({
                        cx: 50,
                        cy: 50,
                        radius: 10,
                        fill: '#0000ff',
                    }),
                ],
            });

            scene.render();

            const ops = paint.records.map(record => record.op);

            expect(ops.lastIndexOf('face-fill')).toBeLessThan(ops.indexOf('path-fill'));
        });

        test('Should paint a 2D element added before a 3D shape beneath it', () => {
            const context = createFixture();
            const scene = createScene(context, {
                children: [
                    createCircle({
                        cx: 50,
                        cy: 50,
                        radius: 10,
                        fill: '#0000ff',
                    }),
                    createCube({
                        size: 1,
                        fill: '#ff0000',
                    }),
                ],
            });

            scene.render();

            const ops = paint.records.map(record => record.op);

            expect(ops.indexOf('path-fill')).toBeLessThan(ops.indexOf('face-fill'));
        });

        test('Should still depth-sort faces within one flush', () => {
            const context = createFixture();
            const scene = createScene(context, {
                children: [
                    createCube({
                        size: 1,
                        z: 2,
                        fill: '#ff0000',
                    }),
                    createCube({
                        size: 1,
                        z: -2,
                        fill: '#00ff00',
                    }),
                ],
            });

            scene.render();

            const isFarCube = (fill: string) => fill.startsWith('rgba(0,');
            const fills = faceFills().map(record => record.fillStyle);

            expect(fills).toHaveLength(12);

            // The far cube is authored second but back-to-front sorting must paint it first.
            expect(fills.slice(0, 6).every(isFarCube)).toBe(true);
            expect(fills.slice(6).some(isFarCube)).toBe(false);
        });

    });

    describe('Clip scoping', () => {

        function clipShape() {
            return createCircle({
                clip: true,
                cx: 200,
                cy: 150,
                radius: 80,
            });
        }

        function cube() {
            return createCube({
                size: 1,
                fill: '#ff0000',
            });
        }

        // 3D-13: `popGroup` unwinds a group-scoped clip before the flush, so identical markup
        // clipped or did not depending only on whether the clip sat inside a group.
        test('Should have a group clip in force when the group faces are painted', () => {
            const scene = createScene(createFixture(), {
                children: [
                    createGroup({
                        children: [
                            clipShape(),
                            cube(),
                        ],
                    }),
                ],
            });

            scene.render();

            expect(faceFills()).toHaveLength(6);

            for (const record of faceFills()) {
                expect(record.clips).toBe(1);
            }
        });

        test('Should have a root clip in force when the faces are painted', () => {
            const scene = createScene(createFixture(), {
                children: [
                    clipShape(),
                    cube(),
                ],
            });

            scene.render();

            for (const record of faceFills()) {
                expect(record.clips).toBe(1);
            }
        });

        test('Should not clip faces buffered before the clip was installed', () => {
            const scene = createScene(createFixture(), {
                children: [
                    cube(),
                    clipShape(),
                ],
            });

            scene.render();

            expect(faceFills()).toHaveLength(6);

            for (const record of faceFills()) {
                expect(record.clips).toBe(0);
            }
        });

    });

    describe('Gradient bounds', () => {

        // 3D-7: the override fed `getBoundingBox()` (the world box) to the gradient resolver, but a
        // canvas gradient resolves in user space where the CTM already carries those transforms —
        // so every group and element transform was counted twice.
        test('Should resolve a hosted 2D gradient the same way the 2D backend does', () => {
            const graph = () => createGroup({
                translateX: 100,
                translateY: 50,
                children: [
                    createCircle({
                        cx: 20,
                        cy: 20,
                        radius: 10,
                        fill: 'linear-gradient(#ff0000, #0000ff)',
                    }),
                ],
            });

            const threeScene = createScene(createFixture(), {
                children: [graph()],
            });

            threeScene.render();

            const deferred = paint.gradients.splice(0);

            const canvasHost = document.createElement('div');

            document.body.appendChild(canvasHost);

            // Both contexts share one stub, so the reference render would otherwise hit the first one's paint cache.
            releaseCanvasPaintCache(paint.stub);

            const referenceScene = createScene(createCanvasContext(canvasHost), {
                children: [graph()],
            });

            referenceScene.render();

            const immediate = paint.gradients.splice(0);

            canvasHost.remove();

            expect(deferred).toHaveLength(1);
            expect(deferred).toEqual(immediate);
        });

    });

    describe('Lighting', () => {

        function lightUnderCamera(mode: 'world' | 'camera', eye: [number, number, number]) {
            const context = createContext(host);

            context.lightMode = mode;
            context.lightDirection = [0, 0, -1];
            context.setCamera(eye, [0, 0, 0], [0, 1, 0]);

            return context.getLightDirectionForRender().map(value => Math.round(value * 1000) / 1000);
        }

        // 3D-5: both consumers dot this against a world-space normal, so transforming the light
        // into view space is what makes it follow the camera — the two modes were exchanged.
        test('Should keep a world-mode light fixed as the camera orbits', () => {
            expect(lightUnderCamera('world', [0, 0, 5])).toEqual([0, 0, -1]);
            expect(lightUnderCamera('world', [5, 0, 0])).toEqual([0, 0, -1]);
        });

        test('Should rotate a camera-mode light with the camera', () => {
            expect(lightUnderCamera('camera', [0, 0, 5])).toEqual([0, 0, -1]);
            expect(lightUnderCamera('camera', [5, 0, 0])).toEqual([-1, 0, 0]);
        });

        test('Should aim a camera-mode light along the view direction', () => {
            const context = createContext(host);

            context.lightMode = 'camera';
            context.lightDirection = [0, 0, -1];
            context.setCamera([0, 4, 0], [0, 0, 0], [0, 0, -1]);

            // The lamp points where the camera looks: down the -Y axis, from above.
            expect(context.getLightDirectionForRender()[1]).toBeCloseTo(-1);
        });

    });

    describe('Bounding box', () => {

        // 3D-6: `_getLocalBoundingBox` projects through the camera, but `Element.getBoundingBox`
        // caches against the element's own state version, which no camera move touches.
        test('Should shrink the bounding box when the camera pulls back', () => {
            const context = createFixture();
            const cube = createCube({
                size: 1,
                fill: '#ff0000',
            });

            const scene = createScene(context, {
                children: [cube],
            });

            scene.render();

            const near = cube.getBoundingBox().width;

            context.setCamera([0, 0, 40], [0, 0, 0], [0, 1, 0]);
            scene.render();

            expect(cube.getBoundingBox().width).toBeLessThan(near / 2);
        });

    });

    describe('Path caching', () => {

        // 3D-15: `CanvasContext.supportsPathCaching` is true because `createPath` is side-effect
        // free; the 3D context composes the same mixin but inherited the base `false`.
        test('Should support path caching for the 2D elements it hosts', () => {
            expect(createFixture().supportsPathCaching).toBe(true);
        });

    });

});
