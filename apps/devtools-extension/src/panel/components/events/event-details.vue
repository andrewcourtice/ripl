<template>
    <div class="event-details">
        <template v-if="event">
            <section class="event-details__section">
                <h3 class="event-details__heading">Event</h3>
                <div class="event-details__rows">
                    <div class="event-details__row">
                        <span class="event-details__label">Type</span>
                        <span class="event-details__value">{{ event.type }}</span>
                    </div>
                    <div class="event-details__row">
                        <span class="event-details__label">Source</span>
                        <span class="event-details__value">{{ event.source }}</span>
                    </div>
                    <div class="event-details__row">
                        <span class="event-details__label">Time</span>
                        <span class="event-details__value">{{ formatOffset(event.timestamp - origin) }}</span>
                    </div>
                    <div class="event-details__row">
                        <span class="event-details__label">Bubbled</span>
                        <span class="event-details__value">{{ event.bubbled ? 'yes' : 'no' }}</span>
                    </div>
                </div>
            </section>
            <section v-if="event.elementId" class="event-details__section">
                <h3 class="event-details__heading">Target</h3>
                <div class="event-details__rows">
                    <div class="event-details__row">
                        <span class="event-details__label">Type</span>
                        <span class="event-details__value">{{ event.elementType }}</span>
                    </div>
                    <div v-if="event.elementClasses?.length" class="event-details__row">
                        <span class="event-details__label">Class</span>
                        <span class="event-details__value">{{ event.elementClasses.join(' ') }}</span>
                    </div>
                    <button class="event-details__reveal" type="button" @click="revealElement">Show in Elements</button>
                </div>
            </section>
            <section class="event-details__section event-details__section--grow">
                <h3 class="event-details__heading">Payload</h3>
                <div class="event-details__payload">
                    <PropertyRow v-for="property of event.data" :key="property.key" :property="property" />
                    <div v-if="!event.data.length" class="event-details__empty">No payload</div>
                </div>
            </section>
        </template>
        <div v-else class="event-details__empty event-details__empty--fill">Select an event</div>
    </div>
</template>

<script setup lang="ts">
import PropertyRow from '../properties/property-row.vue';

import {
    useDevtoolsStore,
} from '../../composables/use-devtools-store';

import {
    formatOffset,
    getTimeOrigin,
} from '../../composables/use-event-log';

import {
    useTabs,
} from '../../composables/use-tabs';

import {
    computed,
} from 'vue';

const store = useDevtoolsStore();

const {
    activeTab,
} = useTabs();

const event = computed(() => store.selectedEvent.value);
const origin = computed(() => getTimeOrigin(store.events.value));

function revealElement(): void {
    const selected = event.value;

    if (selected?.elementId) {
        store.selectElement(selected.contextId, selected.elementId);
        activeTab.value = 'elements';
    }
}
</script>

<style scoped>
.event-details {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    border-left: 1px solid var(--ripl-border);
    background: var(--ripl-bg);
    overflow: hidden;
    user-select: text;
}

.event-details__section {
    display: flex;
    flex-direction: column;
    min-height: 0;
    border-bottom: 1px solid var(--ripl-border-soft);
}

.event-details__section--grow {
    flex: 1;
}

.event-details__heading {
    flex: none;
    margin: 0;
    padding: var(--ripl-section-pad-y) var(--ripl-section-pad-x);
    font-size: 11px;
    font-weight: 600;
    color: var(--ripl-text-dim);
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

.event-details__rows {
    padding: 0 var(--ripl-section-pad-x) var(--ripl-space-3);
}

.event-details__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--ripl-space-2);
    min-height: var(--ripl-row-height);
    font-size: 11px;
}

.event-details__label {
    color: var(--ripl-text-dim);
}

.event-details__value {
    font-family: ui-monospace, Menlo, Consolas, monospace;
}

.event-details__reveal {
    margin-top: var(--ripl-space-1);
    padding: 2px 8px;
    border: 1px solid var(--ripl-border);
    border-radius: 4px;
    background: transparent;
    font-size: 11px;
    cursor: pointer;
}

.event-details__reveal:hover {
    background: var(--ripl-hover);
}

.event-details__payload {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: var(--ripl-space-1) 0 var(--ripl-space-2);
}

.event-details__empty {
    padding: 12px 8px;
    color: var(--ripl-text-dim);
    font-size: 11px;
    text-align: center;
}

.event-details__empty--fill {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
