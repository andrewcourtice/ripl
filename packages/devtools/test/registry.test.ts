import {
    afterEach,
    beforeEach,
    describe,
    expect,
    test,
    vi,
} from 'vitest';

import {
    findElement,
    getBindingByContext,
    getBindingById,
    getBindings,
    registerBinding,
    unregisterBinding,
} from '../src/registry';

import type {
    DevtoolsBinding,
} from '../src/registry';

import {
    createRect,
    createScene,
    factory,
} from '@ripl/core';

import type {
    Context,
} from '@ripl/core';

import {
    createContext,
} from '@ripl/canvas';

import {
    mockCanvasContext,
    polyfillPath2D,
} from '@ripl/test-utils';

polyfillPath2D();

function createFakeBinding(id: string): DevtoolsBinding {
    return {
        id,
        label: id,
        context: {} as unknown as Context,
    };
}

describe('Registry', () => {

    afterEach(() => {
        getBindings().forEach(unregisterBinding);
    });

    test('Should register and retrieve a binding by id', () => {
        const binding = createFakeBinding('binding-a');

        registerBinding(binding);

        expect(getBindingById('binding-a')).toBe(binding);
        expect(getBindings()).toContain(binding);
    });

    test('Should retrieve a binding by context identity', () => {
        const bindingA = createFakeBinding('binding-a');
        const bindingB = createFakeBinding('binding-b');

        registerBinding(bindingA);
        registerBinding(bindingB);

        expect(getBindingByContext(bindingA.context)).toBe(bindingA);
        expect(getBindingByContext(bindingB.context)).toBe(bindingB);
        expect(getBindingByContext({} as unknown as Context)).toBeUndefined();
    });

    test('Should unregister a binding', () => {
        const binding = createFakeBinding('binding-a');

        registerBinding(binding);
        unregisterBinding(binding);

        expect(getBindingById('binding-a')).toBeUndefined();
        expect(getBindings()).toEqual([]);
    });

    describe('findElement', () => {

        let el: HTMLDivElement;

        beforeEach(() => {
            mockCanvasContext();
            factory.set({
                createContext,
            });
            el = document.createElement('div');
            document.body.appendChild(el);
        });

        afterEach(() => {
            el.remove();
            factory.set({
                createContext: undefined,
            });
            vi.restoreAllMocks();
        });

        test('Should find elements by id, including the scene root', () => {
            const scene = createScene(el);

            const rect = createRect({
                x: 0,
                y: 0,
                width: 10,
                height: 10,
            });

            scene.add(rect);

            const binding: DevtoolsBinding = {
                scene,
                id: 'binding-a',
                label: 'binding-a',
                context: scene.context,
            };

            expect(findElement(binding, rect.id)).toBe(rect);
            expect(findElement(binding, scene.id)).toBe(scene);
            expect(findElement(binding, 'missing')).toBeUndefined();

            scene.destroy();
        });

        test('Should return undefined when the binding has no scene', () => {
            const binding = createFakeBinding('binding-a');

            expect(findElement(binding, 'anything')).toBeUndefined();
        });

    });

});
