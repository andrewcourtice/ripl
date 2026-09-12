import {
    RIPL_RENDERER,
    RIPL_TRANSITION,
    RIPL_TREE,
} from './injection';

import {
    createElementTransition,
} from '@ripl/adapters';

import type {
    RiplElementTransition,
    RiplFieldWriters,
} from '@ripl/adapters';

import {
    inject,
} from 'vue';

/**
 * Resolves the transition phases in scope and applies them across an element's lifecycle.
 *
 * Must be called from a component's `setup()`, and the returned appliers take their element per
 * call, so an element can be constructed after the phases are resolved.
 *
 * @param writers - Write overrides for fields an element exposes through a method rather than a setter.
 * @returns The enter, update and leave appliers.
 */
export function useElementTransition(writers?: RiplFieldWriters): RiplElementTransition {
    const tree = inject(RIPL_TREE, undefined);
    const scope = inject(RIPL_TRANSITION, undefined);
    const renderer = inject(RIPL_RENDERER, undefined);

    return createElementTransition({
        tree,
        scope,
        writers,
        getRenderer: () => renderer?.value,
    });
}
