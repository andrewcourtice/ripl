import type {
    RecordedEvent,
} from './use-devtools-store';

import type {
    SerializedEventSource,
} from '@ripl/devtools';

/** The time window a timeline currently shows, in milliseconds relative to the first recorded event. */
export interface EventWindow {
    /** The start of the visible window. */
    start: number;
    /** The end of the visible window. */
    end: number;
}

/** A horizontal band of the timeline, holding every event from one kind of bus. */
export interface EventLane {
    /** The bus kind the lane holds. */
    source: SerializedEventSource;
    /** The lane's display name. */
    label: string;
}

/** The timeline's lanes, top to bottom. */
export const EVENT_LANES: EventLane[] = [
    {
        source: 'element',
        label: 'Element',
    },
    {
        source: 'context',
        label: 'Context',
    },
    {
        source: 'renderer',
        label: 'Renderer',
    },
];

/**
 * Returns the timestamp every other time in the log is measured against. Event timestamps come
 * from the inspected page's own time origin, so they are only meaningful relative to each other.
 *
 * @param events - The recorded events, oldest first.
 * @returns The first event's timestamp, or `0` when nothing has been recorded.
 */
export function getTimeOrigin(events: RecordedEvent[]): number {
    return events.length ? events[0].timestamp : 0;
}

/**
 * Returns the full time span covered by the log, in milliseconds relative to its origin. The span
 * is never zero-width, so a log holding a single event still maps onto a drawable range.
 *
 * @param events - The recorded events, oldest first.
 * @returns The `[start, end]` span.
 */
export function getTimeSpan(events: RecordedEvent[]): [number, number] {
    if (!events.length) {
        return [0, 1];
    }

    const origin = getTimeOrigin(events);
    const end = events[events.length - 1].timestamp - origin;

    return [0, end > 0 ? end : 1];
}

/**
 * Formats a millisecond offset for display against the log's origin.
 *
 * @param offset - The offset from the log's origin, in milliseconds.
 * @returns The formatted offset (e.g. `+1.24s`, `+320ms`).
 */
export function formatOffset(offset: number): string {
    return offset >= 1000
        ? `+${(offset / 1000).toFixed(2)}s`
        : `+${offset.toFixed(offset < 10 ? 1 : 0)}ms`;
}

/**
 * Finds the event closest in time to a given offset, optionally restricted to one lane. Used to
 * turn a click on the timeline into a selection.
 *
 * @param events - The recorded events, oldest first.
 * @param offset - The offset from the log's origin, in milliseconds.
 * @param source - The lane to restrict the search to, or `undefined` to search every lane.
 * @returns The nearest event, or `undefined` when the log holds no candidate.
 */
export function findNearestEvent(events: RecordedEvent[], offset: number, source?: SerializedEventSource): RecordedEvent | undefined {
    const origin = getTimeOrigin(events);
    const candidates = source ? events.filter(event => event.source === source) : events;

    return candidates.reduce<RecordedEvent | undefined>((nearest, event) => {
        if (!nearest) {
            return event;
        }

        const distance = Math.abs(event.timestamp - origin - offset);
        const nearestDistance = Math.abs(nearest.timestamp - origin - offset);

        return distance < nearestDistance ? event : nearest;
    }, undefined);
}
