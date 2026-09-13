import {
    RIPL_CHART,
} from './injection';

import {
    createChartController,
    resolveChartDefinition,
} from '@ripl/adapters-charts';

import type {
    RiplAnyChart,
    RiplChartController,
    RiplChartDefinition,
} from '@ripl/adapters-charts';

import {
    hasWindow,
} from '@ripl/dom';

import {
    createProps,
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

/** Fills the component's root, so the chart inherits whatever size the consumer gives that root. */
const HOST_STYLE = {
    width: '100%',
    height: '100%',
} as const;

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
 *     events: BarChart.prototype.$events as string[],
 *     create: chartFactory<BarChartOptions>(createBarChart),
 * });
 */
export function defineRiplChart(definition: RiplChartDefinition) {
    const resolved = resolveChartDefinition(definition);

    return defineComponent({
        name: definition.name,
        props: createProps(resolved.propKeys),
        emits: definition.events as string[],
        setup(props, { slots, emit }) {
            const context = inject(RIPL_CONTEXT, undefined);
            const chart = shallowRef<RiplAnyChart>();
            const root = shallowRef<HTMLElement>();
            const raw = props as RiplWritable;

            // A chart destroys its context along with its scene, so it may only do that when it
            // made the context itself; an enclosing context component owns and destroys its own.
            const owned = !context?.value;

            let host: HTMLElement | undefined;
            let controller: RiplChartController | undefined;

            if (!context?.value && hasWindow) {
                host = document.createElement('div');
                Object.assign(host.style, HOST_STYLE);
            }

            const target = context?.value ?? host;

            if (target) {
                controller = createChartController({
                    definition: resolved,
                    target,
                    owned,
                    props: raw,
                });

                chart.value = markRaw(controller.chart);
            }

            provide(RIPL_CHART, chart);

            if (chart.value) {
                useExposedInstance(chart.value);
            }

            useForwardedEvents(() => chart.value, emit);

            watch(() => controller?.collect(raw), changed => {
                if (changed) {
                    controller?.update(changed);
                }
            });

            onMounted(() => {
                if (host && root.value) {
                    root.value.appendChild(host);
                }

                controller?.attach();
            });

            onUnmounted(() => {
                chart.value = undefined;
                controller?.destroy();
                controller = undefined;
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
