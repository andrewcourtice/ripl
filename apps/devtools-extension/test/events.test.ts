import {
    describe,
    expect,
    test,
} from 'vitest';

import {
    createDevtoolsStore,
    EVENT_LOG_LIMIT,
} from '../src/panel/composables/use-devtools-store';

import type {
    DevtoolsStore,
    RecordedEvent,
} from '../src/panel/composables/use-devtools-store';

import {
    findNearestEvent,
    formatOffset,
    getTimeOrigin,
    getTimeSpan,
} from '../src/panel/composables/use-event-log';

import type {
    ContextInfo,
    ExtensionMessage,
    SerializedEvent,
    SerializedEventSource,
} from '@ripl/devtools';

const CONTEXT_ID = 'context-1';

function createEvent(sequence: number, overrides: Partial<SerializedEvent> = {}): SerializedEvent {
    return {
        sequence,
        type: 'click',
        timestamp: 1000 + sequence,
        source: 'element',
        bubbled: true,
        data: [],
        ...overrides,
    };
}

function createRecorded(sequence: number, timestamp: number, source: SerializedEventSource = 'element'): RecordedEvent {
    return {
        ...createEvent(sequence, {
            timestamp,
            source,
        }),
        contextId: CONTEXT_ID,
    };
}

function createContextInfo(overrides: Partial<ContextInfo> = {}): ContextInfo {
    return {
        contextId: CONTEXT_ID,
        label: 'Canvas',
        contextType: 'canvas',
        width: 800,
        height: 600,
        hasScene: true,
        hasRenderer: false,
        capabilities: ['events'],
        ...overrides,
    };
}

function createStore(): {
    store: DevtoolsStore;
    sent: ExtensionMessage[];
} {
    const sent: ExtensionMessage[] = [];
    const store = createDevtoolsStore(message => sent.push(message));

    store.handleMessage({
        kind: 'context:added',
        context: createContextInfo(),
    });

    return {
        store,
        sent,
    };
}

describe('Devtools events', () => {

    describe('Store ingestion', () => {

        test('Should append a batch in emission order', () => {
            const { store } = createStore();

            store.handleMessage({
                kind: 'events:batch',
                contextId: CONTEXT_ID,
                dropped: 0,
                events: [createEvent(1), createEvent(2)],
            });

            expect(store.events.value.map(event => event.sequence)).toEqual([1, 2]);
            expect(store.events.value.every(event => event.contextId === CONTEXT_ID)).toBe(true);
        });

        test('Should carry the page-side drop count through to the panel', () => {
            const { store } = createStore();

            store.handleMessage({
                kind: 'events:batch',
                contextId: CONTEXT_ID,
                dropped: 7,
                events: [createEvent(1)],
            });

            expect(store.eventsDropped.value).toBe(7);
        });

        test('Should evict the oldest events once the panel log is full', () => {
            const { store } = createStore();

            const overflow = 3;

            store.handleMessage({
                kind: 'events:batch',
                contextId: CONTEXT_ID,
                dropped: 0,
                events: Array.from({
                    length: EVENT_LOG_LIMIT + overflow,
                }, (unused, index) => createEvent(index + 1)),
            });

            expect(store.events.value.length).toBe(EVENT_LOG_LIMIT);
            expect(store.events.value[0].sequence).toBe(overflow + 1);
            expect(store.eventsDropped.value).toBe(overflow);
        });

        test('Should discard recorded events on bridge:bye', () => {
            const { store } = createStore();

            store.handleMessage({
                kind: 'events:batch',
                contextId: CONTEXT_ID,
                dropped: 2,
                events: [createEvent(1)],
            });
            store.handleMessage({
                kind: 'bridge:bye',
            });

            expect(store.events.value).toEqual([]);
            expect(store.eventsDropped.value).toBe(0);
            expect(store.recording.value).toBe(false);
        });

    });

    describe('Outbound recording control', () => {

        test('Should start recording with the default filter and drop anything previously recorded', () => {
            const { store, sent } = createStore();

            store.handleMessage({
                kind: 'events:batch',
                contextId: CONTEXT_ID,
                dropped: 0,
                events: [createEvent(1)],
            });

            store.startEvents(CONTEXT_ID);

            const start = sent.find(message => message.kind === 'events:start');

            expect(start).toEqual({
                kind: 'events:start',
                contextId: CONTEXT_ID,
                excluded: ['render', 'tick', 'updated'],
            });
            expect(store.events.value).toEqual([]);
            expect(store.recording.value).toBe(true);
        });

        test('Should stop recording', () => {
            const { store, sent } = createStore();

            store.startEvents(CONTEXT_ID);
            store.stopEvents(CONTEXT_ID);

            expect(sent).toContainEqual({
                kind: 'events:stop',
                contextId: CONTEXT_ID,
            });
            expect(store.recording.value).toBe(false);
        });

        // The page applies the filter, so a change has to reach it rather than only the display.
        test('Should push a replacement filter to the page', () => {
            const { store, sent } = createStore();

            store.setExcludedEvents(CONTEXT_ID, ['tick']);

            expect(sent).toContainEqual({
                kind: 'events:set-filter',
                contextId: CONTEXT_ID,
                excluded: ['tick'],
            });
            expect(store.excludedEvents.value).toEqual(['tick']);
        });

        test('Should select and clear an event', () => {
            const { store } = createStore();

            store.handleMessage({
                kind: 'events:batch',
                contextId: CONTEXT_ID,
                dropped: 0,
                events: [createEvent(1)],
            });

            store.selectEvent(store.events.value[0]);
            expect(store.selectedEvent.value?.sequence).toBe(1);

            store.clearEvents();
            expect(store.selectedEvent.value).toBe(null);
            expect(store.events.value).toEqual([]);
        });

    });

    describe('Time model', () => {

        // Timestamps come from the inspected page's time origin, so only their differences mean anything.
        test('Should measure every offset against the first recorded event', () => {
            const events = [
                createRecorded(1, 5000),
                createRecorded(2, 5250),
            ];

            expect(getTimeOrigin(events)).toBe(5000);
            expect(getTimeSpan(events)).toEqual([0, 250]);
        });

        test('Should give an empty or single-event log a drawable span', () => {
            expect(getTimeSpan([])).toEqual([0, 1]);
            expect(getTimeSpan([createRecorded(1, 5000)])).toEqual([0, 1]);
        });

        test('Should format offsets in milliseconds and seconds', () => {
            expect(formatOffset(4.21)).toBe('+4.2ms');
            expect(formatOffset(320.4)).toBe('+320ms');
            expect(formatOffset(1500)).toBe('+1.50s');
        });

        test('Should find the event nearest an offset', () => {
            const events = [
                createRecorded(1, 1000),
                createRecorded(2, 1100),
                createRecorded(3, 1400),
            ];

            expect(findNearestEvent(events, 90)?.sequence).toBe(2);
            expect(findNearestEvent(events, 500)?.sequence).toBe(3);
        });

        test('Should restrict the nearest search to a lane', () => {
            const events = [
                createRecorded(1, 1000, 'element'),
                createRecorded(2, 1100, 'context'),
            ];

            expect(findNearestEvent(events, 100, 'element')?.sequence).toBe(1);
            expect(findNearestEvent(events, 0, 'context')?.sequence).toBe(2);
            expect(findNearestEvent(events, 0, 'renderer')).toBeUndefined();
        });

    });

});
