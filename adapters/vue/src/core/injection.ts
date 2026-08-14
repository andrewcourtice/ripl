import type {
    RiplTransitionScope,
} from './transition';

import type {
    RiplTree,
} from './tree';

import type {
    Context,
    Element,
    Group,
    Renderer,
    Scene,
} from '@ripl/web';

import type {
    InjectionKey,
    ShallowRef,
} from 'vue';

// Registry symbols, not module-local ones: the IIFE bundles inline their workspace dependencies, so
// a page loading two Ripl adapters as script tags would otherwise hold two sets of unequal keys.
/** Injection key for the {@link RiplTree} owned by the enclosing context component. */
export const RIPL_TREE: InjectionKey<RiplTree> = Symbol.for('ripl.vue.tree');

/** Injection key for the rendering context the subtree draws to. */
export const RIPL_CONTEXT: InjectionKey<ShallowRef<Context | undefined>> = Symbol.for('ripl.vue.context');

/** Injection key for the scene the subtree belongs to, if one was declared. */
export const RIPL_SCENE: InjectionKey<ShallowRef<Scene | undefined>> = Symbol.for('ripl.vue.scene');

/** Injection key for the renderer driving the subtree, if one was declared. */
export const RIPL_RENDERER: InjectionKey<ShallowRef<Renderer | undefined>> = Symbol.for('ripl.vue.renderer');

/** Injection key for the group new elements attach themselves to. */
export const RIPL_PARENT: InjectionKey<ShallowRef<Group | undefined>> = Symbol.for('ripl.vue.parent');

/** Injection key for the nearest enclosing element or group. */
export const RIPL_ELEMENT: InjectionKey<ShallowRef<Element | undefined>> = Symbol.for('ripl.vue.element');

/** Injection key for the transition phases applied to descendant elements. */
export const RIPL_TRANSITION: InjectionKey<RiplTransitionScope> = Symbol.for('ripl.vue.transition');
