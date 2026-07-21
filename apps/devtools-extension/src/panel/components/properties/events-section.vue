<template>
    <section class="events-section">
        <h3 class="events-section__heading">Events</h3>
        <ul class="events-section__list">
            <li v-for="event of events" :key="event.type" class="events-section__item">
                <span
                    class="events-section__dot"
                    :class="{ 'events-section__dot--active': event.hasListeners }"
                ></span>
                <span class="events-section__type">{{ event.type }}</span>
            </li>
        </ul>
    </section>
</template>

<script setup lang="ts">
import {
    useDevtoolsStore,
} from '../../composables/use-devtools-store';

import {
    computed,
} from 'vue';

const store = useDevtoolsStore();

// The events a selected element can emit are reported by the bridge from the
// element's own `$events`, so custom EventBus subclasses surface their events too.
const events = computed(() => store.selectedDetail.value?.events ?? []);
</script>

<style scoped>
.events-section {
    flex: none;
    max-height: 32%;
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.events-section__heading {
    flex: none;
    margin: 0;
    padding: var(--ripl-section-pad-y) var(--ripl-section-pad-x);
    font-size: 11px;
    font-weight: 600;
    color: var(--ripl-text-dim);
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

.events-section__list {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    margin: 0;
    padding: 0 var(--ripl-section-pad-x) var(--ripl-space-3);
    list-style: none;
    columns: 2;
    column-gap: var(--ripl-space-2);
}

.events-section__item {
    display: flex;
    align-items: center;
    gap: var(--ripl-space-2);
    height: var(--ripl-row-height);
    break-inside: avoid;
}

.events-section__dot {
    flex: none;
    width: 7px;
    height: 7px;
    border: 1px solid var(--ripl-text-dim);
    border-radius: 50%;
}

.events-section__dot--active {
    border-color: var(--ripl-accent);
    background: var(--ripl-accent);
}

.events-section__type {
    font-size: 11px;
    font-family: ui-monospace, Menlo, Consolas, monospace;
    color: var(--ripl-text);
}
</style>
