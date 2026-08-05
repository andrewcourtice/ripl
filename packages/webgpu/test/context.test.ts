import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    asMockTexture,
    createMockGPUCanvasContext,
    createMockGPUDevice,
    createMockPipelineState,
} from './mock-gpu';

import type {
    MockGPUCanvasContext,
    MockGPUDevice,
} from './mock-gpu';

import {
    WebGPUContext3D,
} from '../src/context';

import type {
    WebGPUContextOptions,
} from '../src/context';

import {
    createCircle,
    createScene,
    factory,
} from '@ripl/core';

import {
    createCube,
} from '@ripl/3d';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

polyfillPath2D();

interface Fixture {
    /** The mock device backing the context. */
    device: MockGPUDevice;
    /** The mock swap chain backing the context. */
    gpuContext: MockGPUCanvasContext;
    /** The context under test. */
    context: WebGPUContext3D;
}

describe('WebGPUContext3D', () => {

    let host: HTMLDivElement;

    beforeEach(() => {
        mockCanvasContext();

        host = document.createElement('div');
        document.body.appendChild(host);

        factory.set({
            devicePixelRatio: 1,
        });
    });

    afterEach(() => {
        host.remove();
        vi.restoreAllMocks();

        factory.set({
            devicePixelRatio: window.devicePixelRatio ?? 1,
        });
    });

    function sizeHost(width: number, height: number) {
        vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({
            left: 0,
            top: 0,
            right: width,
            bottom: height,
            width,
            height,
            x: 0,
            y: 0,
            toJSON: () => ({}),
        }) as DOMRect);
    }

    function createFixture(options?: WebGPUContextOptions): Fixture {
        const device = createMockGPUDevice();
        const canvas = document.createElement('canvas');
        const gpuContext = createMockGPUCanvasContext(canvas);

        gpuContext.configure({
            device: device.handle,
            format: 'bgra8unorm',
            alphaMode: 'premultiplied',
        });

        const context = new WebGPUContext3D(
            host,
            device.handle,
            gpuContext.handle,
            canvas,
            createMockPipelineState(device),
            options
        );

        context.setCamera([0, 0, 5], [0, 0, 0], [0, 1, 0]);

        return {
            device,
            gpuContext,
            context,
        };
    }

    describe('Surface sizing', () => {

        // WGPU-2: `scaleX`/`scaleY` derive from the factory while the backing store and the hit canvas derived from `window`, so overriding one scaled picking by the other.
        test('Should size the backing store from the factory device pixel ratio', () => {
            sizeHost(400, 300);
            factory.set({ devicePixelRatio: 2 });

            const { context } = createFixture();

            expect(context.element.width).toBe(800);
            expect(context.element.height).toBe(600);
        });

        test('Should map a logical point through the factory device pixel ratio', () => {
            sizeHost(400, 300);
            factory.set({ devicePixelRatio: 2 });

            const { context } = createFixture();

            expect(context.scaleX(200)).toBe(400);
        });

        test('Should keep the logical size independent of the device pixel ratio', () => {
            sizeHost(400, 300);
            factory.set({ devicePixelRatio: 2 });

            const { context } = createFixture();

            expect(context.width).toBe(400);
            expect(context.height).toBe(300);
        });

        // WGPU-7: a fresh canvas backing store is already 300x150, which the old backing-store
        // check read as "already correct", so the surface never initialised at all.
        test('Should size a context whose host is exactly the default canvas size', () => {
            sizeHost(300, 150);

            const { context } = createFixture();

            expect(context.width).toBe(300);
            expect(context.height).toBe(150);
        });

        test('Should create a depth texture for a host of the default canvas size', () => {
            sizeHost(300, 150);

            const { device } = createFixture();

            expect(device.liveTextures().length).toBeGreaterThan(0);
        });

    });

    describe('Render strategy', () => {

        // WGPU-4: the meta spread put the caller's entries after the hard-coded strategy, so a
        // supplied `renderStrategy: 'cpu'` routed every shape into the CPU painter this class
        // never draws — a blank canvas plus an unbounded face buffer.
        test('Should keep the GPU render strategy against a caller-supplied meta', () => {
            sizeHost(400, 300);

            const { context } = createFixture({
                meta: {
                    renderStrategy: 'cpu',
                },
            });

            expect(context.renderStrategy).toBe('gpu');
        });

        test('Should still accept unrelated caller meta entries', () => {
            sizeHost(400, 300);

            const { context } = createFixture({
                meta: {
                    renderStrategy: 'gpu',
                    label: 'chart',
                },
            });

            expect(context.meta.label).toBe('chart');
        });

        test('Should leave the face buffer empty when rendering a scene', () => {
            sizeHost(400, 300);

            const { context } = createFixture();

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

            expect(context.faceBuffer).toHaveLength(0);
        });

        test('Should encode a draw for a submitted mesh', () => {
            sizeHost(400, 300);

            const { device, context } = createFixture();

            createScene(context, {
                children: [
                    createCube({
                        size: 1,
                        fill: '#ff0000',
                    }),
                ],
            }).render();

            const pass = device.commandEncoders.at(-1)?.renderPasses[0];

            expect(pass?.drawIndexedCalls).toHaveLength(1);
        });

    });

    describe('Projection', () => {

        // WGPU-4 inherits 3D-10: `updateProjectionMatrix` unconditionally built a perspective
        // matrix, and `rescale` calls it on every size change.
        test('Should keep an orthographic projection across a resize', () => {
            sizeHost(400, 300);

            const { context } = createFixture();

            context.setOrthographic(-4, 4, -3, 3, 0.1, 100);

            sizeHost(800, 600);
            (context as unknown as { rescale(width: number, height: number): void }).rescale(800, 600);

            expect(context.projectionMode).toBe('orthographic');
            expect(context.projectionMatrix[15]).toBe(1);
            expect(context.projectionMatrix[11]).toBe(0);
        });

        test('Should return to perspective when the projection is set back', () => {
            sizeHost(400, 300);

            const { context } = createFixture();

            context.setOrthographic(-4, 4, -3, 3, 0.1, 100);
            context.setPerspective(60, 0.1, 1000);

            expect(context.projectionMode).toBe('perspective');
            expect(context.projectionMatrix[11]).toBe(-1);
        });

    });

    describe('Clear colour', () => {

        // WGPU-8: the surface is configured `alphaMode: 'premultiplied'`, so a straight colour
        // with a channel above its alpha is out of gamut and implementation-defined.
        test('Should premultiply the clear colour by its alpha', () => {
            sizeHost(400, 300);

            const { device, context } = createFixture({
                clearColor: [1, 0, 0, 0.5],
            });

            createScene(context, {
                children: [
                    createCube({
                        size: 1,
                        fill: '#ff0000',
                    }),
                ],
            }).render();

            const descriptor = device.commandEncoders.at(-1)?.renderPasses[0].descriptor;
            const attachment = [...descriptor!.colorAttachments][0]!;

            expect(attachment.clearValue).toEqual({
                r: 0.5,
                g: 0,
                b: 0,
                a: 0.5,
            });
        });

        test('Should leave a fully opaque clear colour untouched', () => {
            sizeHost(400, 300);

            const { device, context } = createFixture({
                clearColor: [0.25, 0.5, 0.75, 1],
            });

            createScene(context, {
                children: [
                    createCube({
                        size: 1,
                        fill: '#ff0000',
                    }),
                ],
            }).render();

            const descriptor = device.commandEncoders.at(-1)?.renderPasses[0].descriptor;
            const attachment = [...descriptor!.colorAttachments][0]!;

            expect(attachment.clearValue).toEqual({
                r: 0.25,
                g: 0.5,
                b: 0.75,
                a: 1,
            });
        });

    });

    describe('Texture lifecycle', () => {

        function renderFrames(context: WebGPUContext3D, count: number) {
            const scene = createScene(context, {
                children: [
                    createCube({
                        size: 1,
                        fill: '#ff0000',
                    }),
                ],
            });

            for (let frame = 0; frame < count; frame++) {
                scene.render();
            }
        }

        // WGPU-6: views are immutable, so building two per frame is pure garbage.
        test('Should reuse the depth texture view across frames', () => {
            sizeHost(400, 300);

            const { device, context } = createFixture();
            const depthTexture = device.textures.find(texture => texture.format === 'depth24plus')!;

            renderFrames(context, 5);

            expect(depthTexture.views).toHaveLength(1);
        });

        test('Should reuse the MSAA texture view across frames', () => {
            sizeHost(400, 300);

            const { device, context } = createFixture();
            const msaaTexture = device.textures.find(texture => texture.format === 'bgra8unorm')!;

            renderFrames(context, 5);

            expect(msaaTexture.views).toHaveLength(1);
        });

        test('Should destroy every texture it allocated', () => {
            sizeHost(400, 300);

            const { device, context } = createFixture();

            renderFrames(context, 2);
            context.destroy();

            expect(device.liveTextures()).toHaveLength(0);
        });

        test('Should unconfigure the swap chain on destroy', () => {
            sizeHost(400, 300);

            const { gpuContext, context } = createFixture();

            context.destroy();

            expect(gpuContext.configured).toBe(false);
        });

        // WGPU-6: a resize delivered after teardown would otherwise allocate textures nothing frees.
        test('Should allocate nothing when resized after destroy', () => {
            sizeHost(400, 300);

            const { device, context } = createFixture();

            context.destroy();

            const textureCount = device.textures.length;

            sizeHost(800, 600);
            (context as unknown as { rescale(width: number, height: number): void }).rescale(800, 600);

            expect(device.textures).toHaveLength(textureCount);
        });

        test('Should acquire the swap chain texture once per frame', () => {
            sizeHost(400, 300);

            const { gpuContext, context } = createFixture();

            renderFrames(context, 3);

            expect(gpuContext.getCurrentTextureCount).toBe(3);
        });

        test('Should replace the depth texture on a resize', () => {
            sizeHost(400, 300);

            const { device, context } = createFixture();
            const original = device.textures.find(texture => texture.format === 'depth24plus')!;

            sizeHost(800, 600);
            (context as unknown as { rescale(width: number, height: number): void }).rescale(800, 600);

            expect(original.destroyed).toBe(true);
            expect(asMockTexture(device.liveTextures()[0] as unknown as GPUTexture).width).toBe(800);
        });

    });

    describe('Unsupported 2D operations', () => {

        // WGPU-3: `createPath` returns a real `CanvasPath` while every paint op is a base no-op, so
        // 2D elements traced a path, painted nothing, and stayed hit-testable with no diagnostic.
        test('Should warn once when a 2D element is rendered', () => {
            sizeHost(400, 300);

            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const { context } = createFixture();

            createScene(context, {
                children: [
                    createCircle({
                        cx: 50,
                        cy: 50,
                        radius: 10,
                        fill: '#0000ff',
                    }),
                ],
            }).render();

            expect(warn).toHaveBeenCalledTimes(1);
            expect(warn.mock.calls[0][0]).toContain('cannot draw 2D elements');
        });

        test('Should not warn again on later frames', () => {
            sizeHost(400, 300);

            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const { context } = createFixture();

            const scene = createScene(context, {
                children: [
                    createCircle({
                        cx: 50,
                        cy: 50,
                        radius: 10,
                        fill: '#0000ff',
                    }),
                ],
            });

            scene.render();
            scene.render();
            scene.render();

            expect(warn).toHaveBeenCalledTimes(1);
        });

        test('Should not warn for a scene of only 3D shapes', () => {
            sizeHost(400, 300);

            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const { context } = createFixture();

            createScene(context, {
                children: [
                    createCube({
                        size: 1,
                        fill: '#ff0000',
                    }),
                ],
            }).render();

            expect(warn).not.toHaveBeenCalled();
        });

    });

});
