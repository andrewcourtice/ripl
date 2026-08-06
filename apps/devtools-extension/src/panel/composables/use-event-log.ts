import type {
    RecordedEvent,
} from './use-devtools-store';

import type {
    SerializedEventSource,
} from '@ripl/devtools';

import {
    numberClamp,
} from '@ripl/utilities';

/**
 * The timeline's scrub window, as fractions of the whole recording. `{ start: 0, end: 1 }` selects
 * everything. Fractions rather than timestamps so the window survives new events arriving.
 */
export interface EventWindow {
    /** The window's start edge, `0` being the first recorded event. */
    start: number;
    /** The window's end edge, `1` being the most recent recorded event. */
    end: number;
}

/** The narrowest the scrub window may become, as a fraction of the recording. */
export const MIN_EVENT_WINDOW = 0.02;

/** The scrub window covering the whole recording. */
export const FULL_EVENT_WINDOW: EventWindow = {
    start: 0,
    end: 1,
};

/** Which part of the scrub window a drag is manipulating. */
export type EventWindowDrag = 'move' | 'resize-start' | 'resize-end';

/**
 * Applies a drag delta to a window, in the same three modes the chart overview strip uses.
 * `move` preserves the window's width and parks it against an edge; the resize modes hold the
 * opposite edge and clamp against {@link MIN_EVENT_WINDOW}. The delta is measured from the
 * gesture's origin rather than the previous move, so a drag cannot accumulate rounding drift.
 *
 * @param window - The window as it was when the drag started.
 * @param mode - Which part of the window is being dragged.
 * @param delta - Distance dragged since the gesture started, as a fraction of the timeline width.
 * @returns The updated window.
 */
export function dragEventWindow(window: EventWindow, mode: EventWindowDrag, delta: number): EventWindow {
    if (mode === 'move') {
        const width = window.end - window.start;
        const start = numberClamp(window.start + delta, 0, 1 - width);

        return {
            start,
            end: start + width,
        };
    }

    if (mode === 'resize-start') {
        return {
            start: numberClamp(window.start + delta, 0, window.end - MIN_EVENT_WINDOW),
            end: window.end,
        };
    }

    return {
        start: window.start,
        end: numberClamp(window.end + delta, window.start + MIN_EVENT_WINDOW, 1),
    };
}

/**
 * Converts a window into the millisecond offsets it covers, relative to the log's origin.
 *
 * @param events - The recorded events, oldest first.
 * @param window - The window to convert.
 * @returns The `[from, to]` offsets, in milliseconds from the log's origin.
 */
export function getWindowSpan(events: RecordedEvent[], window: EventWindow): [number, number] {
    const [start, end] = getTimeSpan(events);
    const span = end - start;

    return [start + span * window.start, start + span * window.end];
}

/**
 * Filters events down to those inside a window. The bounds are inclusive, so an event sitting
 * exactly on an edge belongs to the window.
 *
 * @param events - The recorded events, oldest first.
 * @param window - The window to filter by.
 * @returns The events inside the window.
 */
export function filterEventsByWindow(events: RecordedEvent[], window: EventWindow): RecordedEvent[] {
    if (window.start <= 0 && window.end >= 1) {
        return events;
    }

    const origin = getTimeOrigin(events);
    const [from, to] = getWindowSpan(events, window);

    return events.filter(event => {
        const offset = event.timestamp - origin;

        return offset >= from && offset <= to;
    });
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
