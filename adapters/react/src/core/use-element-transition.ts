import {
    RIPL_RENDERER,
    RIPL_TRANSITION,
    RIPL_TREE,
} from './contexts';

import {
    CLASS_KEY,
} from './props';

import {
    createElementTransition,
} from '@ripl/adapters';

import type {
    RiplElementTransition,
    RiplFieldWriters,
    RiplTransitionScope,
    RiplTree,
} from '@ripl/adapters';

import type {
    Element,
} from '@ripl/web';

import {
    useContext,
    useRef,
} from 'react';

/** What a cached transition was built for, so it can be rebuilt when any of it changes. */
interface RiplTransitionCache {
    element: Element;
    tree: RiplTree | undefined;
    scope: RiplTransitionScope | undefined;
    value: RiplElementTransition;
}

/**
 * Resolves the transition phases in scope and applies them across one element's lifecycle.
 *
 * Cached against the element rather than memoised, because the appliers hold the element's looping
 * transition: handing back a fresh set would strand a loop that nothing could then abort.
 *
 * @param element - The element the phases apply to.
 * @param writers - Write overrides for fields an element exposes through a method rather than a setter.
 * @returns The enter, update and leave appliers.
 */
export function useElementTransition(element: Element, writers?: RiplFieldWriters): RiplElementTransition {
    const tree = useContext(RIPL_TREE);
    const scope = useContext(RIPL_TRANSITION);
    const renderer = useContext(RIPL_RENDERER);
    const rendererRef = useRef(renderer);
    const cache = useRef<RiplTransitionCache>(undefined);

    rendererRef.current = renderer;

    if (cache.current?.element !== element || cache.current.tree !== tree || cache.current.scope !== scope) {
        cache.current = {
            element,
            tree,
            scope,
            value: createElementTransition({
                tree,
                scope,
                writers,
                classKey: CLASS_KEY,
                getRenderer: () => rendererRef.current,
            }),
        };
    }

    return cache.current.value;
}
