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

/**
 * A chart's options as component props, with any option whose name Vue reserves renamed.
 *
 * Only `key` is affected: Vue consumes a `key` attribute as the vnode key, so the option is bound
 * as `keyBy` instead.
 *
 * @typeParam TOptions - The chart's options interface, e.g. `BarChartOptions`.
 */
export type RiplChartProps<TOptions> = Omit<TOptions, 'key'> & {
    [TKey in keyof TOptions as TKey extends 'key' ? 'keyBy' : never]: TOptions[TKey];
};
