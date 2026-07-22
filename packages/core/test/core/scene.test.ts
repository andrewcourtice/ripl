import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    createGroup,
    createRect,
    createScene,
    factory,
} from '../../src';

import {
    createContext,
} from '@ripl/canvas';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

polyfillPath2D();

describe('Scene', () => {

    let el: HTMLDivElement;

    beforeEach(() => {
        mockCanvasContext();
        factory.set({ createContext });
        el = document.createElement('div');
        document.body.appendChild(el);
    });

    afterEach(() => {
        el.remove();
        factory.set({ createContext: undefined });
        vi.restoreAllMocks();
    });

    test('Should create from an HTMLElement', () => {
        const scene = createScene(el);

        expect(scene).toBeDefined();
        expect(scene.context).toBeDefined();

        scene.destroy();
    });

    test('Should expose width and height from context', () => {
        const scene = createScene(el);

        expect(typeof scene.width).toBe('number');
        expect(typeof scene.height).toBe('number');

        scene.destroy();
    });

    test('Should throw without factory.createContext or Context', () => {
        factory.set({ createContext: undefined });
        expect(() => createScene(el)).toThrow();
    });

    test('Should initialise with empty buffer', () => {
        const scene = createScene(el);

        expect(scene.buffer).toEqual([]);

        scene.destroy();
    });

    test('Should flatten graph into buffer when children added', async () => {
        const scene = createScene(el);

        const rect1 = createRect({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });

        const rect2 = createRect({
            x: 20,
            y: 20,
            width: 10,
            height: 10,
        });

        scene.add([rect1, rect2]);

        // Buffer updates via requestAnimationFrame
        await new Promise(resolve => requestAnimationFrame(resolve));

        expect(scene.buffer).toContain(rect1);
        expect(scene.buffer).toContain(rect2);
        expect(scene.buffer.length).toBe(2);

        scene.destroy();
    });

    test('Should flatten nested groups into buffer', async () => {
        const scene = createScene(el);

        const rect = createRect({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });

        const group = createGroup({
            children: [rect],
        });

        scene.add(group);

        await new Promise(resolve => requestAnimationFrame(resolve));

        expect(scene.buffer).toContain(rect);
        expect(scene.buffer).not.toContain(group);

        scene.destroy();
    });

    test('Should sort buffer by zIndex', async () => {
        const scene = createScene(el);

        const rect1 = createRect({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
            zIndex: 2,
        });

        const rect2 = createRect({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
            zIndex: 1,
        });

        scene.add([rect1, rect2]);

        await new Promise(resolve => requestAnimationFrame(resolve));

        expect(scene.buffer[0]).toBe(rect2);
        expect(scene.buffer[1]).toBe(rect1);

        scene.destroy();
    });

    test('Should re-render on context resize when renderOnResize is enabled', async () => {
        const scene = createScene(el);

        scene.add(createRect({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        }));

        await new Promise(resolve => requestAnimationFrame(resolve));

        const renderSpy = vi.spyOn(scene, 'render').mockImplementation(() => {});

        scene.context.emit('resize', null);

        expect(renderSpy).toHaveBeenCalledOnce();

        scene.destroy();
    });

    test('Should destroy context on scene destroy', () => {
        const scene = createScene(el);
        const destroySpy = vi.spyOn(scene.context, 'destroy');

        scene.destroy(true);

        expect(destroySpy).toHaveBeenCalledOnce();
    });

    test('Should support children in constructor options', async () => {
        const rect = createRect({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });

        const scene = createScene(el, {
            children: [rect],
        });

        await new Promise(resolve => requestAnimationFrame(resolve));

        expect(scene.buffer).toContain(rect);

        scene.destroy();
    });

    test('Should cache the buffer array between graph rebuilds', async () => {
        const scene = createScene(el);

        scene.add(createRect({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        }));

        await new Promise(resolve => requestAnimationFrame(resolve));

        const buffer = scene.buffer;

        expect(scene.buffer).toBe(buffer);

        scene.add(createRect({
            x: 20,
            y: 20,
            width: 10,
            height: 10,
        }));

        await new Promise(resolve => requestAnimationFrame(resolve));

        expect(scene.buffer).not.toBe(buffer);
        expect(scene.buffer.length).toBe(2);

        scene.destroy();
    });

    describe('needsRender lifecycle', () => {

        test('Should start dirty and be consumed by render', () => {
            const scene = createScene(el);

            expect(scene.needsRender).toBe(true);

            scene.render();

            expect(scene.needsRender).toBe(false);

            scene.destroy();
        });

        test('Should be set by invalidate', () => {
            const scene = createScene(el);

            scene.render();
            expect(scene.needsRender).toBe(false);

            scene.invalidate();
            expect(scene.needsRender).toBe(true);

            scene.destroy();
        });

        test('Should be set by graph changes', () => {
            const scene = createScene(el);

            scene.render();
            expect(scene.needsRender).toBe(false);

            scene.add(createRect({
                x: 0,
                y: 0,
                width: 10,
                height: 10,
            }));

            expect(scene.needsRender).toBe(true);

            scene.destroy();
        });

        test('Should be set by a bubbled element state change', async () => {
            const scene = createScene(el);
            const rect = createRect({
                x: 0,
                y: 0,
                width: 10,
                height: 10,
            });

            scene.add(rect);

            await new Promise(resolve => requestAnimationFrame(resolve));

            scene.render();
            expect(scene.needsRender).toBe(false);

            rect.opacity = 0.5;

            expect(scene.needsRender).toBe(true);

            scene.destroy();
        });

        test('Should be set by a z-index change', async () => {
            const scene = createScene(el);
            const rect = createRect({
                x: 0,
                y: 0,
                width: 10,
                height: 10,
            });

            scene.add(rect);

            await new Promise(resolve => requestAnimationFrame(resolve));

            scene.render();
            expect(scene.needsRender).toBe(false);

            rect.zIndex = 3;

            expect(scene.needsRender).toBe(true);

            scene.destroy();
        });

        test('Should be set by a context resize', () => {
            const scene = createScene(el);

            scene.render();
            expect(scene.needsRender).toBe(false);

            scene.context.emit('resize', null);

            expect(scene.needsRender).toBe(true);

            scene.destroy();
        });

        test('Should be set by a context render event', () => {
            const scene = createScene(el);

            scene.render();
            expect(scene.needsRender).toBe(false);

            scene.context.emit('render', null);

            expect(scene.needsRender).toBe(true);

            scene.destroy();
        });

        test('Should be set by context.requestRender()', () => {
            const scene = createScene(el);

            scene.render();
            expect(scene.needsRender).toBe(false);

            scene.context.requestRender();

            expect(scene.needsRender).toBe(true);

            scene.destroy();
        });

        test('Should stay dirty after the frame-buffered graph rebuild', async () => {
            const scene = createScene(el);

            scene.add(createRect({
                x: 0,
                y: 0,
                width: 10,
                height: 10,
            }));

            // A paint may consume the flag before the rebuild frame lands...
            scene.render();
            expect(scene.needsRender).toBe(false);

            // ...but the rebuild re-invalidates so the new stream gets painted.
            await new Promise(resolve => requestAnimationFrame(resolve));

            expect(scene.needsRender).toBe(true);

            scene.destroy();
        });

    });

    test('Should clear $dirty and $touched on elements after render', async () => {
        const scene = createScene(el);
        const rect = createRect({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });

        scene.add(rect);

        await new Promise(resolve => requestAnimationFrame(resolve));

        rect.fill = '#ff0000';
        expect(rect.$dirty).toBe(true);
        expect(rect.$touched).toBe(true);

        scene.render();

        expect(rect.$dirty).toBe(false);
        expect(rect.$touched).toBe(false);

        scene.destroy();
    });

});
