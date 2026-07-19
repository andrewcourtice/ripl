<script setup lang="ts">
import ContextSection from './context-section.vue';
import EventsSection from './events-section.vue';
import PropertyGrid from './property-grid.vue';

import {
    useDevtoolsStore,
} from '../../composables/use-devtools-store';

import {
    computed,
} from 'vue';

const store = useDevtoolsStore();

const activeContext = computed(() => {
    const selection = store.selection.value;

    if (selection) {
        return store.contexts.get(selection.contextId);
    }

    const first = store.contexts.values().next();

    return first.done ? undefined : first.value;
});
</script>

<template>
    <div class="properties-panel">
        <ContextSection v-if="activeContext" :context="activeContext" />
        <section class="properties-panel__section properties-panel__section--grow">
            <h3 class="properties-panel__heading">Properties</h3>
            <PropertyGrid v-if="store.selection.value" />
            <div v-else class="properties-panel__empty">Select an element</div>
        </section>
        <EventsSection v-if="store.selection.value" />
    </div>
</template>

<style scoped>
.properties-panel {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    border-left: 1px solid var(--ripl-border);
    background: var(--ripl-bg);
    overflow: hidden;
}

.properties-panel__section {
    display: flex;
    flex-direction: column;
    min-height: 0;
    border-bottom: 1px solid var(--ripl-border-soft);
}

.properties-panel__section--grow {
    flex: 1;
}

.properties-panel__heading {
    flex: none;
    margin: 0;
    padding: 5px 8px;
    font-size: 11px;
    font-weight: 600;
    color: var(--ripl-text-dim);
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

.properties-panel__empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--ripl-text-dim);
    font-size: 11px;
    padding: 16px;
}
</style>
