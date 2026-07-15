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
} from '@ripl/test-utils';

/** Waits for the scene's debounced (rAF) rebuffer to run. */
function nextFrame() {
    return new Promise(resolve => requestAnimationFrame(resolve));
}

describe('Scene instruction stream', () => {

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

    test('emits push/draw/pop bracketing a group', async () => {
        const rect = createRect({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });
        const group = createGroup({ children: [rect] });
        const scene = createScene(el);

        scene.add(group);
        await nextFrame();

        expect(scene.instructions.map(i => i.type)).toEqual(['push', 'draw', 'pop']);
        expect(scene.instructions[0].element).toBe(group);
        expect(scene.instructions[1].element).toBe(rect);
        expect(scene.instructions[2].element).toBe(group);

        scene.destroy();
    });

    test('leaves outside groups render as bare draw instructions', async () => {
        const rect = createRect({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });
        const scene = createScene(el);

        scene.add(rect);
        await nextFrame();

        expect(scene.instructions.map(i => i.type)).toEqual(['draw']);
        expect(scene.buffer).toEqual([rect]);

        scene.destroy();
    });

    test('nested groups nest their push/pop pairs', async () => {
        const rect = createRect({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });
        const inner = createGroup({ children: [rect] });
        const outer = createGroup({ children: [inner] });
        const scene = createScene(el);

        scene.add(outer);
        await nextFrame();

        expect(scene.instructions.map(i => i.type)).toEqual(['push', 'push', 'draw', 'pop', 'pop']);
        expect(scene.instructions[0].element).toBe(outer);
        expect(scene.instructions[1].element).toBe(inner);

        scene.destroy();
    });

    test('applies stacking-context ordering: a child cannot escape its group past a sibling group', async () => {
        // groupLow sits below groupHigh, but its child has a very high local z-index. Under
        // global additive z-index the child would paint on top; under stacking-context
        // semantics it stays trapped within its (lower) group.
        const childHigh = createRect({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
            zIndex: 100,
        });
        const childLow = createRect({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
            zIndex: 0,
        });

        const groupLow = createGroup({
            children: [childHigh],
            zIndex: 0,
        });
        const groupHigh = createGroup({
            children: [childLow],
            zIndex: 10,
        });

        const scene = createScene(el);
        scene.add([groupLow, groupHigh]);
        await nextFrame();

        // Paint order of leaves: the deep high-z child (trapped in the low group) first,
        // then the low-z child in the high group last (on top).
        expect(scene.buffer).toEqual([childHigh, childLow]);

        scene.destroy();
    });

    test('sorts direct children of a group by z-index, stably', async () => {
        const a = createRect({
            id: 'a',
            x: 0,
            y: 0,
            width: 10,
            height: 10,
            zIndex: 1,
        });
        const b = createRect({
            id: 'b',
            x: 0,
            y: 0,
            width: 10,
            height: 10,
            zIndex: 1,
        });
        const c = createRect({
            id: 'c',
            x: 0,
            y: 0,
            width: 10,
            height: 10,
            zIndex: 0,
        });

        const group = createGroup({ children: [a, b, c] });
        const scene = createScene(el);
        scene.add(group);
        await nextFrame();

        // c (z 0) first, then a and b (both z 1) in insertion order.
        expect(scene.buffer).toEqual([c, a, b]);

        scene.destroy();
    });

});
