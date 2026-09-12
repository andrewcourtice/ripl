import {
    RIPL_CHART,
} from './injection';

import type {
    RiplAnyChart,
} from './injection';

import {
    BASE_CHART_OPTION_KEYS,
} from './props';

import {
    hasWindow,
} from '@ripl/dom';

import type {
    Disposable,
} from '@ripl/utilities';

import type {
    Context,
} from '@ripl/core';

import {
    collectChangedProps,
    createProps,
    readBoundProps,
    RIPL_CONTEXT,
    useExposedInstance,
    useForwardedEvents,
} from '@ripl/vue';

import type {
    RiplWritable,
} from '@ripl/vue';

import {
    defineComponent,
    h,
    inject,
    markRaw,
    onMounted,
    onUnmounted,
    provide,
    shallowRef,
    watch,
} from 'vue';

/**
 * Chart options whose names Vue reserves, mapped to the prop name that stands in for them.
 *
 * `key` is the one that bites: Vue consumes it as the vnode key, so a `key` prop never reaches the
 * component at all and the option would silently arrive unset.
 */
const PROP_ALIASES: Record<string, string> = {
    key: 'keyBy',
};

/** Fills the component's root, so the chart inherits whatever size the consumer gives that root. */
const HOST_STYLE = {
    width: '100%',
    height: '100%',
} as const;

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

/**
 * Builds a declarative component for a Ripl chart.
 *
 * Props are the chart's options: each one maps to a top-level option, an unbound prop is never
 * written so the chart's own defaults survive, and a changed prop is pushed through `update()`
 * rather than rebuilding the chart.
 *
 * The component binds to an enclosing `<ripl-context>` when there is one, and otherwise renders and
 * owns its own host element — a chart builds its own scene and renderer either way, so it is a peer
 * of `<ripl-context>` rather than something that sits inside a `<ripl-scene>`.
 *
 * @param definition - How to construct the chart and which options it accepts.
 * @returns A component to register globally or import directly.
 * @example
 * const RiplBarChart = defineRiplChart({
 *     name: 'RiplBarChart',
 *     optionKeys: CHART_OPTION_KEYS.bar,
 *     create: (target, options) => createBarChart(target, options as BarChartOptions),
 * });
 */
export function defineRiplChart(definition: RiplChartDefinition) {
    const optionKeys = [
        ...BASE_CHART_OPTION_KEYS,
        ...definition.optionKeys,
    ];

    const propKeys = optionKeys.map(key => PROP_ALIASES[key] ?? key);
    const aliased = optionKeys.filter(key => key in PROP_ALIASES);

    /** Renames the aliased props back to the option names the chart actually reads. */
    const toOptions = (props: RiplWritable): RiplWritable => {
        const output = {
            ...props,
        };

        aliased.forEach(key => {
            const alias = PROP_ALIASES[key];

            if (alias in output) {
                output[key] = output[alias];
                delete output[alias];
            }
        });

        return output;
    };

    return defineComponent({
        name: definition.name,
        props: createProps(propKeys),
        emits: definition.events as string[],
        setup(props, { slots, emit }) {
            const context = inject(RIPL_CONTEXT, undefined);
            const chart = shallowRef<RiplAnyChart>();
            const root = shallowRef<HTMLElement>();
            const raw = props as RiplWritable;
            const applied = readBoundProps(raw, propKeys);

            // A chart destroys its context along with its scene, so it may only do that when it
            // made the context itself; an enclosing context component owns and destroys its own.
            const owned = !context?.value;

            let host: HTMLElement | undefined;
            let repaint: Disposable | undefined;

            // A chart renders itself on construction, but its surface is still detached at that
            // point and therefore 0x0 — scales collapse and the first frame never recovers. Hold
            // the first paint until the surface has a size, which is what `resize` announces.
            const options = {
                ...toOptions(applied),
                autoRender: false,
            };

            if (context?.value) {
                chart.value = markRaw(definition.create(context.value, options));
            } else if (hasWindow) {
                host = document.createElement('div');
                Object.assign(host.style, HOST_STYLE);

                chart.value = markRaw(definition.create(host, options));
            }

            provide(RIPL_CHART, chart);

            if (chart.value) {
                useExposedInstance(chart.value);
            }

            useForwardedEvents(() => chart.value, emit);

            watch(() => collectChangedProps(raw, propKeys, applied), changed => {
                if (changed) {
                    chart.value?.update(toOptions(changed));
                }
            });

            onMounted(() => {
                const active = chart.value;

                if (host && root.value) {
                    root.value.appendChild(host);
                }

                if (!active || applied.autoRender === false) {
                    return;
                }

                repaint = active.context.once('resize', () => {
                    // Hand rendering back to the chart now that it has a surface to render onto.
                    (active as unknown as RiplWritable).autoRender = true;
                    void active.render();
                });
            });

            onUnmounted(() => {
                const active = chart.value;

                repaint?.dispose();
                chart.value = undefined;

                if (!active) {
                    return;
                }

                if (owned) {
                    active.destroy();
                    return;
                }

                // `destroy` would take the context with it, and that one is not this chart's.
                active.renderer.destroy();
                active.scene.destroy(false);
            });

            // The host is appended into this root on mount, so slot content sits beside the chart's
            // surface rather than inside the element the context clears.
            return () => owned
                ? h('div', {
                    ref: root,
                }, slots.default?.())
                : slots.default?.() ?? null;
        },
    });
}
