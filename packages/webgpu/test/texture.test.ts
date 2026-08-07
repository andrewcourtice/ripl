import {
    beforeEach,
    describe,
    expect,
    test,
} from 'vitest';

import {
    createMockGPUDevice,
    createMockPipelineState,
} from './mock-gpu';

import type {
    MockGPUDevice,
} from './mock-gpu';

import {
    TextureManager,
} from '../src/texture';

import {
    createTexture,
} from '@ripl/3d';

import type {
    Texture,
} from '@ripl/3d';

import {
    polyfillImageData,
} from '@ripl/test-utils';

polyfillImageData();

function createImage(size = 2): Texture {
    return createTexture(new ImageData(new Uint8ClampedArray(size * size * 4), size, size));
}

describe('TextureManager', () => {

    let device: MockGPUDevice;
    let manager: TextureManager;

    beforeEach(() => {
        device = createMockGPUDevice();
        manager = new TextureManager(device.handle, createMockPipelineState(device).textureBindGroupLayout);
    });

    describe('The untextured fallback', () => {

        // Every draw binds group 2 whether it is textured or not, so the pipeline layout is constant
        // and the backend stays on a single pipeline.
        test('Should hand out a bind group for an untextured mesh', () => {
            expect(manager.getBindGroup(undefined)).toBeDefined();
        });

        test('Should allocate the fallback once and reuse it', () => {
            const first = manager.getBindGroup(undefined);
            const second = manager.getBindGroup(undefined);

            expect(second).toBe(first);
            expect(device.queue.writeTextureCalls).toHaveLength(1);
        });

        test('Should write a single opaque white texel', () => {
            manager.getBindGroup(undefined);

            const [call] = device.queue.writeTextureCalls;

            expect(call.byteLength).toBe(4);
            expect(call.size).toEqual([1, 1]);
        });

        test('Should fall back for a texture whose image has not loaded', () => {
            // A canvas element defaults to 300x150, so the fixture has to be sized to nothing.
            const canvas = document.createElement('canvas');

            canvas.width = 0;
            canvas.height = 0;

            expect(manager.getBindGroup(createTexture(canvas))).toBe(manager.getBindGroup(undefined));
            expect(device.queue.copyExternalImageCalls).toHaveLength(0);
        });

    });

    describe('Uploading', () => {

        test('Should upload a texture once and reuse the bind group', () => {
            const texture = createImage();
            const first = manager.getBindGroup(texture);
            const second = manager.getBindGroup(texture);

            expect(second).toBe(first);
            expect(device.queue.copyExternalImageCalls).toHaveLength(1);
        });

        test('Should upload at the image dimensions', () => {
            manager.getBindGroup(createImage(4));

            expect(device.queue.copyExternalImageCalls[0].size).toEqual([4, 4]);
        });

        test('Should re-upload after the texture is invalidated', () => {
            const texture = createImage();

            manager.getBindGroup(texture);
            texture.invalidate();
            manager.getBindGroup(texture);

            expect(device.queue.copyExternalImageCalls).toHaveLength(2);
        });

        test('Should release the superseded GPU texture on re-upload', () => {
            const texture = createImage();

            manager.getBindGroup(texture);

            const uploaded = device.textures.at(-1)!;

            texture.invalidate();
            manager.getBindGroup(texture);

            expect(uploaded.destroyed).toBe(true);
        });

        test('Should keep separate entries per texture', () => {
            expect(manager.getBindGroup(createImage())).not.toBe(manager.getBindGroup(createImage()));
            expect(device.queue.copyExternalImageCalls).toHaveLength(2);
        });

        test('Should flip the upload when the texture asks for it', () => {
            const texture = createImage();

            texture.flipY = true;
            manager.getBindGroup(texture);

            expect(device.queue.copyExternalImageCalls[0].flipY).toBe(true);
        });

    });

    describe('Sampling state', () => {

        test('Should map each wrap mode to its GPU address mode', () => {
            const texture = createImage();

            texture.wrapS = 'clamp';
            texture.wrapT = 'mirror';
            manager.getBindGroup(texture);

            const descriptor = device.samplerDescriptors.at(-1)!;

            expect(descriptor.addressModeU).toBe('clamp-to-edge');
            expect(descriptor.addressModeV).toBe('mirror-repeat');
        });

        test('Should map each filter to its GPU filter mode', () => {
            const texture = createImage();

            texture.magFilter = 'nearest';
            texture.minFilter = 'nearest';
            manager.getBindGroup(texture);

            const descriptor = device.samplerDescriptors.at(-1)!;

            expect(descriptor.magFilter).toBe('nearest');
            expect(descriptor.minFilter).toBe('nearest');
        });

    });

    describe('Lifecycle', () => {

        test('Should release every uploaded texture on destroy', () => {
            manager.getBindGroup(createImage());
            manager.getBindGroup(createImage());
            manager.getBindGroup(undefined);
            manager.destroy();

            expect(device.textures.every(texture => texture.destroyed)).toBe(true);
        });

        test('Should refuse to bind after being destroyed', () => {
            manager.destroy();

            expect(() => manager.getBindGroup(undefined)).toThrow(/destroyed/);
        });

    });

});
