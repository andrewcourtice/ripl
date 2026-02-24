import {
    afterAll,
    beforeAll,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    Context3D,
    createCamera,
} from '../src';

import type {
    Scene,
} from '@ripl/core';

function mockCanvasContext() {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const noop = () => {};
    const original = HTMLCanvasElement.prototype.getContext;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (HTMLCanvasElement.prototype as any).getContext = function () {
        return {
            save: noop,
            restore: noop,
            clearRect: noop,
            fillRect: noop,
            beginPath: noop,
            closePath: noop,
            moveTo: noop,
            lineTo: noop,
            fill: noop,
            stroke: noop,
            arc: noop,
            rect: noop,
            setLineDash: noop,
            getLineDash: () => [],
            setTransform: noop,
            resetTransform: noop,
            scale: noop,
            translate: noop,
            rotate: noop,
            transform: noop,
            clip: noop,
            createLinearGradient: () => ({
                addColorStop: noop,
            }),
            createRadialGradient: () => ({
                addColorStop: noop,
            }),
            measureText: () => ({
                width: 0,
            }),
            fillStyle: '#000000',
            strokeStyle: '#000000',
            filter: 'none',
            direction: 'ltr',
            font: '10px sans-serif',
            fontKerning: 'auto',
            globalAlpha: 1,
            globalCompositeOperation: 'source-over',
            lineCap: 'butt',
            lineDashOffset: 0,
            lineJoin: 'miter',
            lineWidth: 1,
            miterLimit: 10,
            shadowBlur: 0,
            shadowColor: 'rgba(0, 0, 0, 0)',
            shadowOffsetX: 0,
            shadowOffsetY: 0,
            textAlign: 'start',
            textBaseline: 'alphabetic',
            canvas: this,
        };
    };

    return () => {
        HTMLCanvasElement.prototype.getContext = original;
    };
}

function createMockScene(): Scene {
    const ctx = new Context3D(document.createElement('div'));

    return {
        context: ctx,
    } as unknown as Scene;
}

describe('Camera', () => {

    let restoreMock: () => void;

    beforeAll(() => {
        restoreMock = mockCanvasContext();
    });

    afterAll(() => {
        restoreMock();
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
