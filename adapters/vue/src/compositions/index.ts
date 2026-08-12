import {
    RIPL_CONTEXT,
    RIPL_ELEMENT,
    RIPL_RENDERER,
    RIPL_SCENE,
} from '../core/injection';

import type {
    Context,
    Element,
    Renderer,
    Scene,
} from '@ripl/web';

import {
    inject,
    shallowRef,
} from 'vue';

import type {
    ShallowRef,
} from 'vue';

/** Shared empty ref, returned when a composition is used outside its provider. */
const EMPTY: ShallowRef<undefined> = shallowRef();

/**
 * Returns the rendering context provided by the nearest context component.
 *
 * The context is created during that component's `setup()`, so this already resolves in a
 * descendant's own `setup()` — no watching required. It is `undefined` only outside a context
 * component, or during server rendering.
 *
 * @returns The context, or `undefined` when there is none.
 * @example
 * const context = useRiplContext();
 *
 * function exportPNG() {
 *     return context.value?.export().toURL();
 * }
 */
export function useRiplContext(): ShallowRef<Context | undefined> {
    return inject(RIPL_CONTEXT, EMPTY);
}

/**
 * Returns the scene provided by the nearest scene component.
 *
 * @returns The scene, or `undefined` when no scene component encloses the caller.
 * @example
 * const scene = useRiplScene();
 *
 * const hit = () => scene.value?.query('.segment');
 */
export function useRiplScene(): ShallowRef<Scene | undefined> {
    return inject(RIPL_SCENE, EMPTY);
}

/**
 * Returns the renderer provided by the nearest renderer component.
 *
 * @returns The renderer, or `undefined` when no renderer component encloses the caller.
 * @example
 * const renderer = useRiplRenderer();
 *
 * const pulse = (element: Element) => renderer.value?.transition(element, {
 *     duration: 300,
 *     state: { opacity: 0.5 },
 * });
 */
export function useRiplRenderer(): ShallowRef<Renderer | undefined> {
    return inject(RIPL_RENDERER, EMPTY);
}

/**
 * Returns the nearest enclosing element, group or scene.
 *
 * Use this from a component nested inside a `<ripl-group>` to reach the group it belongs to, for
 * imperative work the declarative surface does not cover.
 *
 * @returns The element, or `undefined` outside any element component.
 */
export function useRiplElement(): ShallowRef<Element | undefined> {
    return inject(RIPL_ELEMENT, EMPTY);
}
