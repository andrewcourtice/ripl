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
} from '@ripl/test-utils';

import {
    createContext,
    createRenderer,
    createScene,
    factory,
} from '@ripl/web';

describe('@ripl/web', () => {

    test('registers the canvas context factory for the browser', () => {
        expect(typeof factory.createContext).toBe('function');
    });

    test('re-exports the core and canvas entry points', () => {
        expect(typeof createScene).toBe('function');
        expect(typeof createRenderer).toBe('function');
        expect(typeof createContext).toBe('function');
    });

    describe('with a mocked canvas', () => {

        beforeEach(() => mockCanvasContext());
        afterEach(() => vi.restoreAllMocks());

        test('creates a canvas-backed scene from a DOM element', () => {
            const scene = createScene(document.createElement('div'));

            expect(scene).toBeDefined();
            expect(scene.context.type).toBe('canvas');
        });

        test('creates a renderer for the scene', () => {
            const scene = createScene(document.createElement('div'));
            const renderer = createRenderer(scene);

            expect(renderer).toBeDefined();
            expect(typeof renderer.start).toBe('function');
        });

    });

});
