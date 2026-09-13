import type {
    RiplTransitionScope,
    RiplTree,
} from '@ripl/adapters';

import type {
    Context,
    Element,
    Group,
    Renderer,
    Scene,
} from '@ripl/web';

import {
    createContext,
} from 'react';

import type {
    Context as ReactContext,
} from 'react';

/** The registry holding every Ripl React context, keyed by name. */
type RiplContextRegistry = Record<string, unknown>;

// Registry-keyed, not module-local: the IIFE bundles inline their workspace dependencies, so a page
// loading two Ripl adapters as script tags would otherwise hold two sets of unequal contexts and
// every provider would miss the consumers of the other copy.
const REGISTRY = ((globalThis as Record<PropertyKey, unknown>)[Symbol.for('ripl.react.contexts')] ??= {}) as RiplContextRegistry;

function registerContext<TValue>(name: string): ReactContext<TValue | undefined> {
    return (REGISTRY[name] ??= createContext<TValue | undefined>(undefined)) as ReactContext<TValue | undefined>;
}

/** Context carrying the {@link RiplTree} owned by the enclosing context component. */
export const RIPL_TREE: ReactContext<RiplTree | undefined> = registerContext<RiplTree>('ripl.react.tree');

/** Context carrying the rendering context the subtree draws to. */
export const RIPL_CONTEXT: ReactContext<Context | undefined> = registerContext<Context>('ripl.react.context');

/** Context carrying the scene the subtree belongs to, if one was declared. */
export const RIPL_SCENE: ReactContext<Scene | undefined> = registerContext<Scene>('ripl.react.scene');

/** Context carrying the renderer driving the subtree, if one was declared. */
export const RIPL_RENDERER: ReactContext<Renderer | undefined> = registerContext<Renderer>('ripl.react.renderer');

/** Context carrying the group new elements attach themselves to. */
export const RIPL_PARENT: ReactContext<Group | undefined> = registerContext<Group>('ripl.react.parent');

/** Context carrying the nearest enclosing element or group. */
export const RIPL_ELEMENT: ReactContext<Element | undefined> = registerContext<Element>('ripl.react.element');

/** Context carrying the transition phases applied to descendant elements. */
export const RIPL_TRANSITION: ReactContext<RiplTransitionScope | undefined> = registerContext<RiplTransitionScope>('ripl.react.transition');
