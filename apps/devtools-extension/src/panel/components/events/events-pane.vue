<template>
    <div class="events-pane">
        <div v-if="!supported" class="events-pane__notice">
            <p class="events-pane__notice-title">Event recording unavailable</p>
            <p class="events-pane__notice-hint">
                This page runs a version of <code>@ripl/devtools</code> that predates the event stream. Update it to record events.
            </p>
        </div>
        <template v-else>
            <div class="events-pane__toolbar">
                <button
                    class="events-pane__button"
                    :class="{ 'events-pane__button--active': store.recording.value }"
                    type="button"
                    @click="toggleRecording"
                >{{ store.recording.value ? 'Recording' : 'Paused' }}</button>
                <button class="events-pane__button" type="button" @click="store.clearEvents">Clear</button>
                <span class="events-pane__count">
                    {{ store.events.value.length }} events
                    <template v-if="store.eventsDropped.value">· {{ store.eventsDropped.value }} dropped</template>
                </span>
                <span class="events-pane__filters">
                    <label v-for="type of FILTERABLE_TYPES" :key="type" class="events-pane__filter">
                        <input
                            type="checkbox"
                            :checked="!store.excludedEvents.value.includes(type)"
                            @change="toggleType(type, $event)"
                        >
                        <span>{{ type }}</span>
                    </label>
                </span>
            </div>
            <SplitPane
                class="events-pane__body"
                orientation="vertical"
                storage-key="ripl-devtools:events-split-ratio"
                :default-ratio="0.33"
            >
                <template #left>
                    <EventTimeline />
                </template>
                <template #right>
                    <SplitPane storage-key="ripl-devtools:events-detail-ratio" :default-ratio="0.66">
                        <template #left>
                            <EventList />
                        </template>
                        <template #right>
                            <EventDetails />
                        </template>
                    </SplitPane>
                </template>
            </SplitPane>
        </template>
    </div>
</template>

<script setup lang="ts">
import EventDetails from './event-details.vue';
import EventList from './event-list.vue';
import EventTimeline from './event-timeline.vue';

import SplitPane from '../split-pane.vue';

import {
    useDevtoolsStore,
} from '../../composables/use-devtools-store';

import {
    computed,
    onBeforeUnmount,
    onMounted,
} from 'vue';

import {
    DEFAULT_EVENT_FILTER,
} from '@ripl/devtools';

/** The high-frequency types the toolbar offers to switch back on. */
const FILTERABLE_TYPES = DEFAULT_EVENT_FILTER;

const store = useDevtoolsStore();

const recordedContext = computed(() => {
    const first = store.contexts.values().next();

    return first.done ? undefined : first.value;
});

const supported = computed(() => !!recordedContext.value?.capabilities?.includes('events'));

function withContext(action: (contextId: string) => void): void {
    const contextId = recordedContext.value?.contextId;

    if (contextId) {
        action(contextId);
    }
}

function toggleRecording(): void {
    withContext(contextId => {
        if (store.recording.value) {
            store.stopEvents(contextId);
        } else {
            store.startEvents(contextId);
        }
    });
}

function toggleType(type: string, event: Event): void {
    const included = (event.target as HTMLInputElement).checked;
    const excluded = store.excludedEvents.value.filter(item => item !== type);

    withContext(contextId => store.setExcludedEvents(contextId, included ? excluded : [...excluded, type]));
}

onMounted(() => {
    if (supported.value) {
        withContext(contextId => store.startEvents(contextId));
    }
});

onBeforeUnmount(() => withContext(contextId => store.stopEvents(contextId)));
</script>

<style scoped>
.events-pane {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
}

.events-pane__toolbar {
    flex: none;
    display: flex;
    align-items: center;
    gap: var(--ripl-space-2);
    padding: var(--ripl-space-1) var(--ripl-section-pad-x);
    border-bottom: 1px solid var(--ripl-border-soft);
    font-size: 11px;
}

.events-pane__button {
    padding: 1px 8px;
    border: 1px solid var(--ripl-border);
    border-radius: 4px;
    background: transparent;
    font-size: 11px;
    cursor: pointer;
}

.events-pane__button:hover {
    background: var(--ripl-hover);
}

.events-pane__button--active {
    border-color: var(--ripl-accent);
    color: var(--ripl-accent);
}

.events-pane__count {
    color: var(--ripl-text-dim);
}

.events-pane__filters {
    display: flex;
    align-items: center;
    gap: var(--ripl-space-2);
    margin-left: auto;
    color: var(--ripl-text-dim);
}

.events-pane__filter {
    display: flex;
    align-items: center;
    gap: var(--ripl-space-1);
    font-family: ui-monospace, Menlo, Consolas, monospace;
    cursor: pointer;
}

.events-pane__body {
    flex: 1;
    min-height: 0;
}

.events-pane__notice {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 16px;
    color: var(--ripl-text-dim);
    text-align: center;
}

.events-pane__notice-title {
    margin: 0;
    font-size: 13px;
    font-weight: 500;
}

.events-pane__notice-hint {
    margin: 0;
    font-size: 11px;
}
</style>
