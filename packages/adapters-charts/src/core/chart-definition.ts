import type {
    RiplWritable,
} from '@ripl/adapters';

import type {
    BaseChartOptions,
    Chart,
} from '@ripl/charts';

import type {
    Context,
    EventMap,
} from '@ripl/core';

import {
    BASE_CHART_OPTION_KEYS,
} from './constants';

/**
 * Any chart, whatever its option and event types.
 *
 * `EventBus` holds its listeners in a `Map` keyed by the event map, which makes two charts with
 * different event maps mutually unassignable however narrow the base — so nothing is a real
 * supertype of every chart, and {@link chartFactory} bridges the gap with a single cast.
 */
export type RiplAnyChart = Chart<BaseChartOptions, EventMap>;

/** Describes one chart to wrap as a component. */
export interface RiplChartDefinition {
    /** The component's name, e.g. `RiplBarChart`. */
    name: string;
    /** The chart's own option names, on top of the options every chart accepts. */
    optionKeys: readonly string[];
    /** The events the chart emits, read from the class's own `$events` declaration. */
    events: readonly string[];
    /** Constructs the underlying chart from the target and the options bound on the component. */
    create(target: Context | HTMLElement, options: RiplWritable): RiplAnyChart;
}

/** A chart definition with its prop names and option renaming resolved. */
export interface RiplResolvedChartDefinition extends RiplChartDefinition {
    /** Every prop name the component declares, with reserved option names aliased. */
    propKeys: string[];
    /** Renames the aliased props back to the option names the chart actually reads. */
    toOptions(props: RiplWritable): RiplWritable;
}

/**
 * Chart options whose names a UI framework reserves, mapped to the prop name that stands in for
 * them.
 *
 * `key` is the one that bites, and it bites identically in every framework worth adapting: both
 * Vue and React consume a `key` prop as the element key, so it never reaches the component at all
 * and the option would silently arrive unset.
 */
export const CHART_PROP_ALIASES: Record<string, string> = {
    key: 'keyBy',
};

/**
 * Adapts a typed chart factory to {@link RiplChartDefinition}'s untyped `create` hook.
 *
 * The cast is unavoidable rather than accidental: no type is a supertype of every chart, because
 * each carries its own event map into an invariant position. Confining it here keeps it out of
 * every chart definition.
 *
 * @typeParam TOptions - The chart's own options type.
 * @param create - The chart's factory function.
 * @returns A `create` hook that constructs the chart from a loose option bag.
 */
export function chartFactory<TOptions>(create: (target: Context | HTMLElement, options: TOptions) => unknown) {
    return (target: Context | HTMLElement, options: RiplWritable) => create(target, options as TOptions) as RiplAnyChart;
}

/**
 * Resolves a chart definition's prop names once, when the component is defined.
 *
 * @param definition - How to construct the chart and which options it accepts.
 * @returns The definition, with its prop names and option renaming resolved.
 * @example
 * const resolved = resolveChartDefinition({
 *     name: 'RiplBarChart',
 *     optionKeys: CHART_OPTION_KEYS.bar,
 *     events: BarChart.prototype.$events as string[],
 *     create: chartFactory<BarChartOptions>(createBarChart),
 * });
 */
export function resolveChartDefinition(definition: RiplChartDefinition): RiplResolvedChartDefinition {
    const optionKeys = [
        ...BASE_CHART_OPTION_KEYS,
        ...definition.optionKeys,
    ];

    const propKeys = optionKeys.map(key => CHART_PROP_ALIASES[key] ?? key);
    const aliased = optionKeys.filter(key => key in CHART_PROP_ALIASES);

    const toOptions = (props: RiplWritable): RiplWritable => {
        const output = {
            ...props,
        };

        aliased.forEach(key => {
            const alias = CHART_PROP_ALIASES[key];

            if (alias in output) {
                output[key] = output[alias];
                delete output[alias];
            }
        });

        return output;
    };

    return {
        ...definition,
        propKeys,
        toOptions,
    };
}
