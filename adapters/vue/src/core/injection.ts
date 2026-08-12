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

/** Injection key for the {@link RiplTree} owned by the enclosing context component. */
export const RIPL_TREE: InjectionKey<RiplTree> = Symbol('ripl.tree');

/** Injection key for the rendering context the subtree draws to. */
export const RIPL_CONTEXT: InjectionKey<ShallowRef<Context | undefined>> = Symbol('ripl.context');

/** Injection key for the scene the subtree belongs to, if one was declared. */
export const RIPL_SCENE: InjectionKey<ShallowRef<Scene | undefined>> = Symbol('ripl.scene');

/** Injection key for the renderer driving the subtree, if one was declared. */
export const RIPL_RENDERER: InjectionKey<ShallowRef<Renderer | undefined>> = Symbol('ripl.renderer');

/** Injection key for the group new elements attach themselves to. */
export const RIPL_PARENT: InjectionKey<ShallowRef<Group | undefined>> = Symbol('ripl.parent');

/** Injection key for the nearest enclosing element or group. */
export const RIPL_ELEMENT: InjectionKey<ShallowRef<Element | undefined>> = Symbol('ripl.element');

/** Injection key for the transition phases applied to descendant elements. */
export const RIPL_TRANSITION: InjectionKey<RiplTransitionScope> = Symbol('ripl.transition');
