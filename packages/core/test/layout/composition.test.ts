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

// jsdom has no Path2D, so shapes cannot actually paint; these tests assert layout state,
// buffer membership, and render scheduling rather than pixels, mirroring scene.test.ts.
function mockRender(elements: Element[]) {
    elements.forEach(element => vi.spyOn(element, 'render').mockImplementation(() => undefined));
}

function rects(count: number, size = 20) {
    return Array.from({ length: count }, () => createRect({
        x: 0,
        y: 0,
        width: size,
        height: size,
    }));
}

function nextFrame() {
    return new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
}

// A layout's own reflow frame reschedules the scene's coalesced frame, so allow a couple of
// frames for the scene to settle (rebuffer + render).
async function settle() {
    await nextFrame();
    await nextFrame();
    await nextFrame();
}

describe('Group / Layout composition', () => {

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

    describe('Standalone', () => {

        test('Layout.render lays out children synchronously (no scene)', () => {
            const context = createContext(el);
            const children = rects(3);

            mockRender(children);

            const flex = createFlex({
                x: 0,
                y: 0,
                gap: 10,
                children,
            });

            flex.render(context);

            expect(children.map(child => child.layoutX)).toEqual([0, 30, 60]);
        });

        test('Group.render paints children in z-index order', () => {
            const context = createContext(el);
            const front = createRect({
                x: 0,
                y: 0,
                width: 10,
                height: 10,
                zIndex: 10,
            });
            const back = createRect({
                x: 0,
                y: 0,
                width: 10,
                height: 10,
                zIndex: 0,
            });
            // front is added first, but has the higher z-index
            const group = createGroup({ children: [front, back] });

            const frontSpy = vi.spyOn(front, 'render').mockImplementation(() => undefined);
            const backSpy = vi.spyOn(back, 'render').mockImplementation(() => undefined);

            group.render(context);

            expect(backSpy.mock.invocationCallOrder[0]).toBeLessThan(frontSpy.mock.invocationCallOrder[0]);
        });

    });

    describe('Scene', () => {

        test('adding a child to a layout rebuffers before rendering (no stale buffer)', async () => {
            const scene = createScene(el);
            const renderSpy = vi.spyOn(scene, 'render').mockImplementation(() => undefined);
            const flex = createFlex({
                x: 0,
                y: 0,
                gap: 10,
                children: rects(2),
            });

            scene.add(flex);
            await settle();
            renderSpy.mockClear();

            const late = createRect({
                x: 0,
                y: 0,
                width: 20,
                height: 20,
            });

            flex.add(late);
            await settle();

            expect(scene.buffer).toContain(late);
            expect(renderSpy).toHaveBeenCalled();

            scene.destroy();
        });

        test('nested layouts reflowing in one burst coalesce to a single render', async () => {
            const scene = createScene(el);
            const renderSpy = vi.spyOn(scene, 'render').mockImplementation(() => undefined);
            const innerA = createFlex({
                x: 0,
                y: 0,
                gap: 4,
                children: rects(2),
            });
            const innerB = createFlex({
                x: 0,
                y: 0,
                gap: 4,
                children: rects(2),
            });
            const outer = createFlex({
                x: 0,
                y: 0,
                gap: 10,
                children: [innerA, innerB],
            });

            scene.add(outer);
            await settle();
            renderSpy.mockClear();

            outer.gap = 20;
            innerA.gap = 8;
            innerB.gap = 8;
            await settle();

            expect(renderSpy).toHaveBeenCalledTimes(1);

            scene.destroy();
        });

    });

    describe('Scene + Renderer', () => {

        test('layout reflow does not force an extra scene render while the loop runs', async () => {
            const scene = createScene(el);
            const children = rects(3);

            mockRender(children);

            const renderer = createRenderer(scene, { autoStop: false });
            const flex = createFlex({
                x: 0,
                y: 0,
                gap: 10,
                children,
            });

            scene.add(flex);
            await nextFrame();

            expect(renderer.isRunning).toBe(true);

            const renderSpy = vi.spyOn(scene, 'render').mockImplementation(() => undefined);

            flex.gap = 24;
            await nextFrame();

            expect(renderSpy).not.toHaveBeenCalled();

            renderer.destroy();
            scene.destroy();
        });

    });

    describe('Render efficiency', () => {

        test('a position-only reflow repaints without rebuffering or a graph event', async () => {
            const scene = createScene(el);
            vi.spyOn(scene, 'render').mockImplementation(() => undefined);
            const flex = createFlex({
                x: 0,
                y: 0,
                gap: 10,
                children: rects(3),
            });

            scene.add(flex);
            await settle();

            const bufferBefore = scene.buffer;
            const graphSpy = vi.fn();
            const repaintSpy = vi.fn();
            scene.on('graph', graphSpy);
            scene.on('repaint', repaintSpy);

            flex.gap = 24; // position-only change: relayout -> repaint, no structural change
            await settle();

            expect(repaintSpy).toHaveBeenCalled();
            expect(graphSpy).not.toHaveBeenCalled();
            expect(scene.buffer).toBe(bufferBefore); // same identity => buffer was not rebuilt

            scene.destroy();
        });

        test('reflow measures each child exactly once (no double getBoundingBox)', () => {
            const children = rects(3);
            const spies = children.map(child => vi.spyOn(child, 'getBoundingBox'));

            const flex = createFlex({
                x: 0,
                y: 0,
                gap: 10,
                children,
            });

            flex.reflow();

            spies.forEach(spy => expect(spy).toHaveBeenCalledTimes(1));
        });

    });

});
