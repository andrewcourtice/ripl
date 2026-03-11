import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    createCamera,
    createContext,
} from '../src';

import type {
    Context3D,
} from '../src';

import type {
    Scene,
} from '@ripl/core';

import {
    mockCanvasContext,
} from '@ripl/test-utils';

function createMockScene(): Scene {
    const ctx = createContext(document.createElement('div'));

    return {
        context: ctx,
    } as unknown as Scene;
}

describe('Camera', () => {

    beforeEach(() => {
        mockCanvasContext();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('Construction with defaults', () => {
        const scene = createMockScene();
        const camera = createCamera(scene);

        expect(camera.position).toEqual([0, 0, 5]);
        expect(camera.target).toEqual([0, 0, 0]);
        expect(camera.up).toEqual([0, 1, 0]);
        expect(camera.fov).toBe(60);
        expect(camera.near).toBe(0.1);
        expect(camera.far).toBe(1000);
        expect(camera.projection).toBe('perspective');
    });

    test('Construction with custom options', () => {
        const scene = createMockScene();
        const camera = createCamera(scene, {
            position: [1, 2, 3],
            target: [4, 5, 6],
            fov: 90,
        });

        expect(camera.position).toEqual([1, 2, 3]);
        expect(camera.target).toEqual([4, 5, 6]);
        expect(camera.fov).toBe(90);
    });

    test('orbit changes position but not target', () => {
        const scene = createMockScene();
        const camera = createCamera(scene);
        const originalTarget = [...camera.target];

        camera.orbit(0.1, 0);
        camera.flush();

        expect(camera.target).toEqual(originalTarget);
        // Position should have changed
        expect(camera.position[0]).not.toBeCloseTo(0, 2);
    });

    test('pan shifts both position and target', () => {
        const scene = createMockScene();
        const camera = createCamera(scene, {
            position: [0, 0, 5],
            target: [0, 0, 0],
        });

        const origPos = [...camera.position];
        const origTarget = [...camera.target];

        camera.pan(1, 0);
        camera.flush();

        // Both should have shifted
        expect(camera.position[0]).not.toBeCloseTo(origPos[0], 2);
        expect(camera.target[0]).not.toBeCloseTo(origTarget[0], 2);
    });

    test('zoom moves position along eye-target vector', () => {
        const scene = createMockScene();
        const camera = createCamera(scene, {
            position: [0, 0, 10],
            target: [0, 0, 0],
        });

        camera.zoom(2);
        camera.flush();

        // Position z should be closer to target (smaller)
        expect(camera.position[2]).toBeCloseTo(8, 1);
    });

    test('lookAt updates target', () => {
        const scene = createMockScene();
        const camera = createCamera(scene);

        camera.lookAt([5, 5, 5]);
        camera.flush();

        expect(camera.target).toEqual([5, 5, 5]);
    });

    test('Reactive batching: multiple changes produce single flush', async () => {
        const scene = createMockScene();
        const ctx = scene.context as Context3D;
        const camera = createCamera(scene);

        const setCameraSpy = vi.spyOn(ctx, 'setCamera');

        // Reset spy after initial construction flush
        setCameraSpy.mockClear();

        // Multiple property changes in same synchronous block
        camera.position = [1, 2, 3];
        camera.target = [4, 5, 6];
        camera.fov = 90;

        // Not flushed yet synchronously
        expect(setCameraSpy).not.toHaveBeenCalled();

        // Wait for microtask
        await Promise.resolve();

        // Should have been called exactly once
        expect(setCameraSpy).toHaveBeenCalledTimes(1);
    });

});
