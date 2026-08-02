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
} from '../../src';

import {
    createContext,
} from '@ripl/canvas';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

polyfillPath2D();

// 90deg ramps left-to-right, so the call reads as (left, midY, right, midY) of the resolved box.
const GRADIENT = 'linear-gradient(90deg, #ff0000, #0000ff)';

describe('Group paint', () => {

    let el: HTMLDivElement;
    let canvasStub: ReturnType<typeof mockCanvasContext>;

    beforeEach(() => {
        canvasStub = mockCanvasContext();
        el = document.createElement('div');
        document.body.appendChild(el);
    });

    afterEach(() => {
        el.remove();
        vi.restoreAllMocks();
    });

    function createGradientScene() {
        const context = createContext(el);

        const group = createGroup({
            fill: GRADIENT,
            children: [
                createRect({
                    x: 0,
                    y: 0,
                    width: 40,
                    height: 50,
                }),
                createRect({
                    x: 60,
                    y: 0,
                    width: 40,
                    height: 50,
                }),
            ],
        });

        // Seeded through the constructor: a later `add` defers the graph rebuild to an animation frame.
        const scene = createScene(context, {
            children: [
                // Drawn first, so it is the current render element when the group opens its boundary.
                createRect({
                    fill: '#ff0000',
                    x: 0,
                    y: 0,
                    width: 10,
                    height: 10,
                }),
                group,
            ],
        });

        return {
            context,
            scene,
        };
    }

    // Regression: the group used to resolve against whichever leaf happened to be rendered last.
    test('Should resolve a group gradient against the group box, not the previous leaf', () => {
        const { scene } = createGradientScene();

        scene.render();

        expect(canvasStub.createLinearGradient).toHaveBeenCalledTimes(1);
        expect(canvasStub.createLinearGradient).toHaveBeenCalledWith(0, 25, 100, 25);
    });

    test('Should make the group the current render element for the duration of its boundary', () => {
        const context = createContext(el);
        const group = createGroup();

        context.pushGroup(group);

        expect(context.currentRenderElement).toBe(group);
    });

    test('Should restore the previous render element when the group boundary closes', () => {
        const context = createContext(el);
        const leaf = createRect({
            x: 0,
            y: 0,
            width: 10,
            height: 10,
        });

        context.currentRenderElement = leaf;
        context.pushGroup(createGroup());
        context.popGroup();

        expect(context.currentRenderElement).toBe(leaf);
    });

    // Groups are abstract, so recording one would put a non-drawable element into the hit-test set.
    test('Should not record the group as a rendered element', () => {
        const context = createContext(el);
        const group = createGroup();

        context.markRenderStart();
        context.pushGroup(group);
        context.popGroup();
        context.markRenderEnd();

        expect(context.renderedElements).not.toContain(group);
    });

});
