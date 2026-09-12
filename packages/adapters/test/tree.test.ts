import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

import {
    createRiplTree,
    MARKER_TAG,
} from '@ripl/adapters';

import type {
    RiplTree,
} from '@ripl/adapters';

import {
    createCircle,
    createContext,
    createRenderer,
    createScene,
} from '@ripl/web';

import type {
    Element,
} from '@ripl/web';

/** Builds a tree bound to a real context, plus the hidden mirror root it observes. */
function createHarness() {
    const host = document.createElement('div');
    const graph = document.createElement('div');

    document.body.append(host, graph);

    const tree = createRiplTree();

    tree.context = createContext(host);
    tree.attach(graph);

    return {
        graph,
        tree,
        dispose: () => {
            tree.destroy();
            tree.context?.destroy();
            host.remove();
            graph.remove();
        },
    };
}

/** Appends a marker for an element to a mirror container, the way an element component does. */
function mark(tree: RiplTree, container: HTMLElement, element: Element) {
    const marker = document.createElement(MARKER_TAG);

    container.append(marker);
    tree.registerMarker(marker, element);

    return marker;
}

describe('@ripl/adapters tree', () => {

    beforeEach(() => {
        mockCanvasContext();
        polyfillPath2D();
    });

    afterEach(() => vi.restoreAllMocks());

    describe('Mirror sync', () => {

        // The mirror is what keeps paint order tracking the declaration when the framework cannot
        // supply it directly: effects that run children-first attach in the wrong order to begin
        // with, and a keyed reorder moves components without remounting them at all.
        test('Should replay the mirror order onto the group', async () => {
            const {
                graph,
                tree,
                dispose,
            } = createHarness();

            const ids = ['a', 'b', 'c'];

            const elements = ids.map(id => createCircle({
                id,
                cx: 0,
                cy: 0,
                radius: 1,
            }));

            const markers = elements.map(element => mark(tree, graph, element));

            // Attached back to front, as children-first effects would.
            elements.slice().reverse().forEach(element => tree.rootGroup.add(element));

            expect(tree.rootGroup.children.map(element => element.id)).toEqual(['c', 'b', 'a']);

            tree.invalidateContainer(graph);

            await vi.waitFor(() => expect(tree.rootGroup.children.map(element => element.id)).toEqual(ids));

            graph.prepend(markers[2]);
            tree.invalidateContainer(graph);

            await vi.waitFor(() => expect(tree.rootGroup.children.map(element => element.id)).toEqual([
                'c',
                'a',
                'b',
            ]));

            dispose();
        });

        test('Should leave the group alone when the order already matches', async () => {
            const {
                graph,
                tree,
                dispose,
            } = createHarness();

            const element = createCircle({
                id: 'a',
                cx: 0,
                cy: 0,
                radius: 1,
            });

            mark(tree, graph, element);
            tree.rootGroup.add(element);

            const set = vi.spyOn(tree.rootGroup, 'set');

            tree.invalidateContainer(graph);

            await vi.waitFor(() => expect(set).not.toHaveBeenCalled());

            dispose();
        });

    });

    describe('Paint tiers', () => {

        test('Should wake a stopped renderer and dirty the scene it drives', () => {
            const {
                tree,
                dispose,
            } = createHarness();

            const scene = createScene(tree.context!);
            const renderer = createRenderer(scene, {
                autoStart: false,
            });

            tree.scene = scene;
            tree.renderer = renderer;

            scene.$consumeRender();

            const start = vi.spyOn(renderer, 'start');

            tree.requestPaint();

            expect(start).toHaveBeenCalled();
            expect(scene.needsRender).toBe(true);

            renderer.destroy();
            scene.destroy(false);
            dispose();
        });

    });

    describe('Deferred work', () => {

        test('Should run an attach handler straight away once the host is attached', () => {
            const {
                tree,
                dispose,
            } = createHarness();

            const handler = vi.fn();

            tree.onAttached(handler);

            expect(handler).toHaveBeenCalled();

            dispose();
        });

        // Enters are queued so a staggered phase resolves against the whole set rather than the
        // siblings that happened to be registered first.
        test('Should hold queued enters until they are flushed', async () => {
            const {
                tree,
                dispose,
            } = createHarness();

            const order: number[] = [];

            tree.queueEnter(() => order.push(1));
            tree.queueEnter(() => order.push(2));

            expect(order).toEqual([]);

            tree.flushEnters();

            expect(order).toEqual([1, 2]);

            tree.queueEnter(() => order.push(3));

            await vi.waitFor(() => expect(order).toEqual([1, 2, 3]));

            dispose();
        });

    });

});
