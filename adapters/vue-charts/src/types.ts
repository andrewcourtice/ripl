import type {
    Event,
} from '@ripl/core';

/**
 * A forwarded chart event listener. Receives the event's payload directly, with the underlying
 * {@link Event} — carrying `target`, `timestamp` and `stopPropagation` — as a second argument.
 *
 * @typeParam TPayload - The payload the event carries.
 */
export type RiplChartListener<TPayload> = (payload: TPayload, event: Event<TPayload>) => void;

/**
 * The listener props a chart component accepts, derived from the events the chart declares.
 *
 * @typeParam TEventMap - The chart's event map, e.g. `BarChartEventMap`.
 */
export type RiplChartListeners<TEventMap> = {
    [TKey in keyof TEventMap as `on${Capitalize<string & TKey>}`]?: RiplChartListener<TEventMap[TKey]>;
};
