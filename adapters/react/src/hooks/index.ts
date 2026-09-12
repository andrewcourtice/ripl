import {
    RIPL_CONTEXT,
    RIPL_ELEMENT,
    RIPL_RENDERER,
    RIPL_SCENE,
} from '../core/contexts';

import type {
    Context,
    Element,
    Renderer,
    Scene,
} from '@ripl/web';

import {
    useContext,
} from 'react';

/**
 * Returns the rendering context provided by the nearest context component.
 *
 * The context is built in that component's layout effect and published through state, so a
 * descendant always renders after it exists. It is `undefined` only outside a context component, or
 * during server rendering.
 *
 * @returns The context, or `undefined` when there is none.
 * @example
 * const context = useRiplContext();
 *
 * const exportPNG = () => context?.export().toURL();
 */
export function useRiplContext(): Context | undefined {
    return useContext(RIPL_CONTEXT);
}

/**
 * Returns the scene provided by the nearest scene component.
 *
 * @returns The scene, or `undefined` when no scene component encloses the caller.
 * @example
 * const scene = useRiplScene();
 *
 * const hit = () => scene?.query('.segment');
 */
export function useRiplScene(): Scene | undefined {
    return useContext(RIPL_SCENE);
}

/**
 * Returns the renderer provided by the nearest renderer component.
 *
 * @returns The renderer, or `undefined` when no renderer component encloses the caller.
 * @example
 * const renderer = useRiplRenderer();
 *
 * const pulse = (element: Element) => renderer?.transition(element, {
 *     duration: 300,
 *     state: { opacity: 0.5 },
 * });
 */
export function useRiplRenderer(): Renderer | undefined {
    return useContext(RIPL_RENDERER);
}

/**
 * Returns the nearest enclosing element, group or scene.
 *
 * Use this from a component nested inside a `<RiplGroup>` to reach the group it belongs to, for
 * imperative work the declarative surface does not cover.
 *
 * @returns The element, or `undefined` outside any element component.
 */
export function useRiplElement(): Element | undefined {
    return useContext(RIPL_ELEMENT);
}
