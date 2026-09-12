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

import type {
    Group,
} from '@ripl/web';

import {
    RiplCircle,
    RiplContext,
    RiplGroup,
    RiplRenderer,
    RiplScene,
    useRiplContext,
    useRiplRenderer,
    useRiplScene,
} from '@ripl/react';

import {
    render,
} from '@testing-library/react';

import {
    createElement,
} from 'react';

/** Reads the ids of a group's children in paint order. */
function childIds(group: Group | undefined): string[] {
    return (group?.children ?? []).map(element => element.id);
}

describe('@ripl/react', () => {

    beforeEach(() => {
        mockCanvasContext();
        polyfillPath2D();
    });

    afterEach(() => vi.restoreAllMocks());

    describe('Context tier', () => {

        test('Should create a context and paint elements declared directly under it', () => {
            const captured: (ReturnType<typeof useRiplContext>)[] = [];

            const Probe = () => {
                captured.push(useRiplContext());
                return null;
            };

            const view = render(createElement(RiplContext, null,
                createElement(RiplCircle, {
                    id: 'a',
                    cx: 5,
                    cy: 5,
                    radius: 10,
                }),
                createElement(Probe)));

            expect(captured.at(-1)?.type).toBe('canvas');
            expect(view.container.querySelector('canvas')).not.toBeNull();

            view.unmount();
        });

    });

    describe('Scene and renderer tiers', () => {

        test('Should expose the scene and renderer to descendants', () => {
            let scene: ReturnType<typeof useRiplScene>;
            let renderer: ReturnType<typeof useRiplRenderer>;

            const Probe = () => {
                scene = useRiplScene();
                renderer = useRiplRenderer();
                return null;
            };

            const view = render(createElement(RiplContext, null,
                createElement(RiplScene, null,
                    createElement(RiplRenderer, null, createElement(Probe)))));

            expect(scene!).toBeDefined();
            expect(renderer!).toBeDefined();

            view.unmount();
        });

    });

    describe('Graph structure', () => {

        test('Should paint elements in declaration order', () => {
            let scene: ReturnType<typeof useRiplScene>;

            const Probe = () => {
                scene = useRiplScene();
                return null;
            };

            const view = render(createElement(RiplContext, null,
                createElement(RiplScene, null,
                    createElement(Probe),
                    createElement(RiplCircle, {
                        id: 'a',
                        cx: 1,
                        cy: 1,
                        radius: 1,
                    }),
                    createElement(RiplCircle, {
                        id: 'b',
                        cx: 2,
                        cy: 2,
                        radius: 1,
                    }),
                    createElement(RiplCircle, {
                        id: 'c',
                        cx: 3,
                        cy: 3,
                        radius: 1,
                    }))));

            expect(childIds(scene!)).toEqual(['a', 'b', 'c']);

            view.unmount();
        });

        test('Should nest a group and parent its children to it', () => {
            let scene: ReturnType<typeof useRiplScene>;

            const Probe = () => {
                scene = useRiplScene();
                return null;
            };

            const view = render(createElement(RiplContext, null,
                createElement(RiplScene, null,
                    createElement(Probe),
                    createElement(RiplGroup, {
                        id: 'group',
                    }, createElement(RiplCircle, {
                        id: 'inner',
                        cx: 1,
                        cy: 1,
                        radius: 1,
                    })))));

            const group = scene?.getElementById<Group>('group');

            expect(childIds(scene!)).toEqual(['group']);
            expect(childIds(group)).toEqual(['inner']);

            view.unmount();
        });

    });

});
