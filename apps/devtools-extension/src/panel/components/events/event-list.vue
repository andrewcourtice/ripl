<template>
    <div class="event-list">
        <div class="event-list__header">
            <span class="event-list__cell event-list__cell--type">Event</span>
            <span class="event-list__cell event-list__cell--time">Time</span>
            <span class="event-list__cell event-list__cell--element">Element</span>
        </div>
        <div ref="viewport" class="event-list__rows" @scroll.passive="virtualList.onScroll">
            <div :style="{ height: `${virtualList.range.value.topPad}px` }"></div>
            <div
                v-for="event of visibleEvents"
                :key="`${event.contextId}:${event.sequence}`"
                class="event-list__row"
                :class="{ 'event-list__row--selected': isSelected(event) }"
                @click="store.selectEvent(event)"
            >
                <span class="event-list__cell event-list__cell--type">
                    <span class="event-list__source" :data-source="event.source"></span>{{ event.type }}
                </span>
                <span class="event-list__cell event-list__cell--time">{{ formatOffset(event.timestamp - origin) }}</span>
                <span class="event-list__cell event-list__cell--element">{{ getElementLabel(event) }}</span>
            </div>
            <div :style="{ height: `${virtualList.range.value.bottomPad}px` }"></div>
        </div>
    </div>
</template>

<script setup lang="ts">
import {
    useDevtoolsStore,
} from '../../composables/use-devtools-store';

import type {
    RecordedEvent,
} from '../../composables/use-devtools-store';

import {
    formatOffset,
    getTimeOrigin,
} from '../../composables/use-event-log';

import {
    useVirtualList,
} from '../../composables/use-virtual-list';

import {
    computed,
    ref,
} from 'vue';

// Must match the rendered `.event-list__row` height (--ripl-row-height in theme.css).
const ROW_HEIGHT = 22;

const store = useDevtoolsStore();

const viewport = ref<HTMLElement | null>(null);
const events = computed(() => store.visibleEvents.value);
// Offsets stay measured against the whole recording, so scrubbing never renumbers the rows.
const origin = computed(() => getTimeOrigin(store.events.value));
const rowCount = computed(() => events.value.length);
const virtualList = useVirtualList(viewport, rowCount, ROW_HEIGHT);

const visibleEvents = computed(() => {
    const {
        start,
        end,
    } = virtualList.range.value;

    return events.value.slice(start, end);
});

function isSelected(event: RecordedEvent): boolean {
    const selected = store.selectedEvent.value;

    return !!selected && selected.contextId === event.contextId && selected.sequence === event.sequence;
}

function getElementLabel(event: RecordedEvent): string {
    if (!event.elementType) {
        return '—';
    }

    const classes = event.elementClasses?.length
        ? `.${event.elementClasses.join('.')}`
        : '';

    return `${event.elementType}${classes}`;
}
</script>

<style scoped>
.event-list {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
}

.event-list__header {
    flex: none;
    display: flex;
    height: var(--ripl-row-height);
    align-items: center;
    padding: 0 var(--ripl-section-pad-x);
    border-bottom: 1px solid var(--ripl-border-soft);
    font-size: 10px;
    font-weight: 600;
    color: var(--ripl-text-dim);
    text-transform: uppercase;
    letter-spacing: 0.06em;
}

.event-list__rows {
    flex: 1;
    min-height: 0;
    overflow: auto;
}

.event-list__row {
    display: flex;
    align-items: center;
    height: var(--ripl-row-height);
    padding: 0 var(--ripl-section-pad-x);
    font-size: 11px;
    white-space: nowrap;
    cursor: default;
}

.event-list__row:hover {
    background: var(--ripl-hover);
}

.event-list__row--selected,
.event-list__row--selected:hover {
    background: var(--ripl-selected);
}

.event-list__cell {
    overflow: hidden;
    text-overflow: ellipsis;
}

.event-list__cell--type {
    flex: 0 0 34%;
    display: flex;
    align-items: center;
    gap: var(--ripl-space-2);
    font-family: ui-monospace, Menlo, Consolas, monospace;
}

.event-list__cell--time {
    flex: 0 0 22%;
    font-family: ui-monospace, Menlo, Consolas, monospace;
    color: var(--ripl-text-dim);
}

.event-list__cell--element {
    flex: 1;
    min-width: 0;
    font-family: ui-monospace, Menlo, Consolas, monospace;
    color: var(--ripl-tag);
}

.event-list__source {
    flex: none;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--ripl-text-dim);
}

.event-list__source[data-source='element'] {
    background: var(--ripl-accent);
}

.event-list__source[data-source='context'] {
    background: var(--ripl-attr-name);
}

.event-list__source[data-source='renderer'] {
    background: var(--ripl-attr-value);
}
</style>
