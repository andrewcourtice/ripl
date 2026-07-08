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
    createRect,
    createRenderer,
    createScene,
    Element,
    factory,
} from '../../src';

import {
    createContext,
} from '@ripl/canvas';

import {
    mockCanvasContext,
} from '@ripl/test-utils';

// Auto-reflow: while the renderer runs, it calls scene.reflow() each tick so animated layouts
// reposition without the consumer calling reflow() manually. Fake timers drive rAF + performance.now
// deterministically.

function noopRender(elements: Element[]) {
    elements.forEach(element => vi.spyOn(element, 'render').mockImplementation(() => undefined));
}

describe('Renderer auto-reflow', () => {

    let el: HTMLDivElement;

    beforeEach(() => {
        vi.useFakeTimers();
        mockCanvasContext();
        factory.set({ createContext });
        el = document.createElement('div');
        document.body.appendChild(el);
    });

    afterEach(() => {
        el.remove();
        factory.set({ createContext: undefined });
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    test('animating a child size auto-repositions siblings (no manual reflow)', async () => {
        const scene = createScene(el);
        const a = createRect({
            x: 0,
            y: 0,
            width: 20,
            height: 20,
        });
        const b = createRect({
            x: 0,
            y: 0,
            width: 20,
            height: 20,
        });
        noopRender([a, b]);

        const renderer = createRenderer(scene, { autoStop: false });
        const flex = createFlex({
            x: 0,
            y: 0,
            gap: 0,
            children: [a, b],
        });

        scene.add(flex);
        await vi.advanceTimersByTimeAsync(50); // settle initial layout

        expect(b.layoutX).toBe(20); // a (20 wide) then b

        // Grow a to 40 — b must follow to x=40 automatically, no manual reflow().
        renderer.transition(a, {
            duration: 100,
            state: { width: 40 },
        });
        await vi.advanceTimersByTimeAsync(200);

        expect(a.width).toBe(40);
        expect(b.layoutX).toBe(40);

        renderer.destroy();
        scene.destroy();
    });

    test('nested layouts reposition correctly in one settle when a deep child animates', async () => {
        const scene = createScene(el);
        const leaf = createRect({
            x: 0,
            y: 0,
            width: 20,
            height: 20,
        });
        const sibling = createRect({
            x: 0,
            y: 0,
            width: 20,
            height: 20,
        });
        noopRender([leaf, sibling]);

        const renderer = createRenderer(scene, { autoStop: false });
        const inner = createFlex({
            x: 0,
            y: 0,
            gap: 0,
            children: [leaf, sibling],
        });
        const outer = createFlex({
            x: 100,
            y: 0,
            gap: 0,
            children: [inner],
        });

        scene.add(outer);
        await vi.advanceTimersByTimeAsync(50);

        expect(sibling.layoutX).toBe(120); // outer.x(100) + leaf(20)

        renderer.transition(leaf, {
            duration: 100,
            state: { width: 40 },
        });
        await vi.advanceTimersByTimeAsync(200);

        expect(leaf.width).toBe(40);
        expect(sibling.layoutX).toBe(140); // outer.x(100) + leaf(40)

        renderer.destroy();
        scene.destroy();
    });

    test('autoReflow:false leaves layouts unreflowed during animation', async () => {
        const scene = createScene(el);
        const a = createRect({
            x: 0,
            y: 0,
            width: 20,
            height: 20,
        });
        const b = createRect({
            x: 0,
            y: 0,
            width: 20,
            height: 20,
        });
        noopRender([a, b]);

        const renderer = createRenderer(scene, {
            autoStop: false,
            autoReflow: false,
        });
        const flex = createFlex({
            x: 0,
            y: 0,
            gap: 0,
            children: [a, b],
        });

        scene.add(flex);
        await vi.advanceTimersByTimeAsync(50);

        expect(b.layoutX).toBe(20);

        renderer.transition(a, {
            duration: 100,
            state: { width: 40 },
        });
        await vi.advanceTimersByTimeAsync(200);

        expect(a.width).toBe(40);
        expect(b.layoutX).toBe(20); // not auto-reflowed; stays at old position

        renderer.destroy();
        scene.destroy();
    });

});
