import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    createFlex,
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
} from '@ripl/test-utils';

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

    test('Should emit resize event when context resizes', () => {
        const scene = createScene(el);

        const resizeSpy = vi.fn();
        scene.on('resize', resizeSpy);

        scene.context.emit('resize', null);

        expect(resizeSpy).toHaveBeenCalledOnce();

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

    describe('layouts', () => {

        // A layout's own reflow frame reschedules the scene's coalesced (re)buffer frame, so allow
        // a few frames to settle — mirrors composition.test.ts.
        async function settle() {
            for (let i = 0; i < 3; i++) {
                await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
            }
        }

        test('collects layouts (outermost-first) and keeps buffer as z-sorted leaves', async () => {
            const scene = createScene(el, { renderOnUpdate: false });

            const inner = createFlex({
                x: 0,
                y: 0,
                gap: 4,
                children: [createRect({
                    x: 0,
                    y: 0,
                    width: 10,
                    height: 10,
                })],
            });
            const outer = createFlex({
                x: 0,
                y: 0,
                gap: 10,
                children: [inner],
            });

            scene.add(outer);
            await settle();

            // outermost-first
            expect(scene.layouts).toEqual([outer, inner]);
            // buffer holds only the leaf rect (no groups/layouts)
            expect(scene.layouts.every(layout => !scene.buffer.includes(layout))).toBe(true);
            expect(scene.buffer).toHaveLength(1);

            scene.destroy();
        });

        test('reflow() reflows every layout and is idempotent (no redundant updated events)', async () => {
            const scene = createScene(el, { renderOnUpdate: false });
            const flex = createFlex({
                x: 0,
                y: 0,
                gap: 10,
                children: [
                    createRect({
                        x: 0,
                        y: 0,
                        width: 20,
                        height: 20,
                    }),
                    createRect({
                        x: 0,
                        y: 0,
                        width: 20,
                        height: 20,
                    }),
                ],
            });

            scene.add(flex);
            await settle();

            const reflowSpy = vi.spyOn(flex, 'reflow');
            scene.reflow();
            expect(reflowSpy).toHaveBeenCalledTimes(1);

            // A second reflow with nothing changed must not emit further updates.
            const updatedSpy = vi.fn();
            scene.on('updated', updatedSpy);
            scene.reflow();
            expect(updatedSpy).not.toHaveBeenCalled();

            scene.destroy();
        });

    });

});
