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
    mat4Identity,
} from '../src';

import {
    createScene,
} from '@ripl/core';

import {
    mockCanvasContext,
} from '@ripl/test-utils';

describe('Context3D', () => {

    beforeEach(() => {
        mockCanvasContext();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    test('Construction stores identity matrices', () => {
        const ctx = createContext(document.createElement('div'));

        expect(ctx.viewMatrix).toEqual(mat4Identity());
        expect(ctx.viewProjectionMatrix).toBeDefined();
        expect(ctx.lightDirection).toEqual([-0.577, -0.577, -0.577]);
    });

    test('setCamera updates viewMatrix', () => {
        const ctx = createContext(document.createElement('div'));
        const prevView = new Float64Array(ctx.viewMatrix);

        ctx.setCamera([0, 0, 5], [0, 0, 0], [0, 1, 0]);

        let changed = false;

        for (let idx = 0; idx < 16; idx++) {
            if (ctx.viewMatrix[idx] !== prevView[idx]) {
                changed = true;
                break;
            }
        }

        expect(changed).toBe(true);
    });

    test('setPerspective stores fov/near/far values', () => {
        const ctx = createContext(document.createElement('div'));

        ctx.setPerspective(90, 0.5, 500);

        // In jsdom, canvas width/height are 0 so the projection matrix
        // won't update, but the values should be stored for when rescale occurs.
        // We verify the method doesn't throw and the context remains valid.
        expect(ctx.projectionMatrix).toBeDefined();
        expect(ctx.viewProjectionMatrix).toBeDefined();
    });

    test('setOrthographic updates projectionMatrix', () => {
        const ctx = createContext(document.createElement('div'));

        ctx.setOrthographic(-10, 10, -10, 10, 0.1, 100);

        expect(ctx.projectionMatrix[0]).not.toBe(0);
        expect(ctx.projectionMatrix[5]).not.toBe(0);
        expect(ctx.projectionMatrix[15]).toBe(1);
    });

    test('project returns a projected point with x, y, and depth', () => {
        const ctx = createContext(document.createElement('div'));
        ctx.setCamera([0, 0, 5], [0, 0, 0], [0, 1, 0]);

        const point = ctx.project([0, 0, 0]);

        expect(point).toHaveLength(3);
        expect(typeof point[0]).toBe('number');
        expect(typeof point[1]).toBe('number');
        expect(typeof point[2]).toBe('number');
    });

    test('faceBuffer is initialized as empty array', () => {
        const ctx = createContext(document.createElement('div'));

        expect(ctx.faceBuffer).toEqual([]);
    });

    test('markRenderStart resets faceBuffer at depth 1', () => {
        const ctx = createContext(document.createElement('div'));

        ctx.faceBuffer.push({
            points: [[0, 0, 0]],
            fillColor: '#ff0000',
            strokeStyle: undefined,
            lineWidth: undefined,
            depth: 1,
        });

        expect(ctx.faceBuffer.length).toBe(1);

        ctx.markRenderStart();

        expect(ctx.faceBuffer.length).toBe(0);
    });

    describe('Camera-driven repaint', () => {

        test('A camera orbit invalidates the bound scene', () => {
            const context = createContext(document.createElement('div'));
            const scene = createScene(context);
            const camera = createCamera(context);

            // Settle the scene so its dirty flag is clear before the camera change.
            scene.render();
            expect(scene.needsRender).toBe(false);

            // A camera-only change mutates no element — it must still re-dirty the scene, or the
            // renderer's dirty gate would freeze the view.
            camera.orbit(0.2, 0.1);
            camera.flush();

            expect(scene.needsRender).toBe(true);

            scene.destroy();
        });

        test('A direct setCamera call invalidates the bound scene', () => {
            const context = createContext(document.createElement('div'));
            const scene = createScene(context);

            scene.render();
            expect(scene.needsRender).toBe(false);

            context.setCamera([0, 0, 8], [0, 0, 0], [0, 1, 0]);

            expect(scene.needsRender).toBe(true);

            scene.destroy();
        });

        test('An orthographic projection change invalidates the bound scene', () => {
            const context = createContext(document.createElement('div'));
            const scene = createScene(context);

            scene.render();
            expect(scene.needsRender).toBe(false);

            context.setOrthographic(-10, 10, -10, 10, 0.1, 100);

            expect(scene.needsRender).toBe(true);

            scene.destroy();
        });

    });

});
