<template>
    <div class="elements-pane">
        <div class="elements-pane__toolbar">
            <button
                class="elements-pane__button"
                type="button"
                title="Expand all"
                aria-label="Expand all"
                @click="tree.expandAll"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                    <path d="M16 3h3a2 2 0 0 1 2 2v3" />
                    <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
                    <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
                </svg>
            </button>
            <button
                class="elements-pane__button"
                type="button"
                title="Collapse all"
                aria-label="Collapse all"
                @click="tree.collapseAll"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M3 8h3a2 2 0 0 0 2-2V3" />
                    <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
                    <path d="M3 16h3a2 2 0 0 1 2 2v3" />
                    <path d="M21 16h-3a2 2 0 0 0-2 2v3" />
                </svg>
            </button>
            <FilterBar
                v-model:query="tree.filter.value.query"
                v-model:type="tree.filter.value.type"
                :types="tree.availableTypes.value"
                placeholder="Filter elements"
            />
        </div>
        <TreeView />
    </div>
</template>

<script setup lang="ts">
import TreeView from './tree-view.vue';

import FilterBar from '../filter-bar.vue';

import {
    useDevtoolsStore,
} from '../../composables/use-devtools-store';

import {
    useTree,
} from '../../composables/use-tree';

const tree = useTree(useDevtoolsStore());
</script>

<style scoped>
.elements-pane {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
}

.elements-pane__toolbar {
    flex: none;
    display: flex;
    align-items: center;
    gap: var(--ripl-space-1);
    padding: var(--ripl-space-1) var(--ripl-space-1);
    border-bottom: 1px solid var(--ripl-border-soft);
}

.elements-pane__button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 0;
    border: none;
    border-radius: 4px;
    background: transparent;
    color: var(--ripl-text-dim);
    cursor: pointer;
}

.elements-pane__button:hover {
    background: var(--ripl-hover);
    color: var(--ripl-text);
}

.elements-pane__button svg {
    width: 13px;
    height: 13px;
}
</style>
