import {
    createRiplTree as createTree,
} from '@ripl/adapters';

import type {
    RiplTree,
} from '@ripl/adapters';

import {
    markRaw,
} from 'vue';

/**
 * Creates a {@link RiplTree}, the per-context coordinator for a declarative Ripl graph.
 *
 * Marked raw because the context component hands it straight to `provide()`, and nothing about it
 * should ever be made reactive.
 */
export function createRiplTree(): RiplTree {
    return markRaw(createTree());
}
