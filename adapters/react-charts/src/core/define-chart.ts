import {
    RIPL_CHART,
} from './contexts';

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
    RIPL_CONTEXT,
    useForwardedEvents,
    useRiplResource,
} from '@ripl/react';

import type {
    RiplHostProps,
} from '@ripl/react';

import type {
    RiplWritable,
} from '@ripl/adapters';

import {
    createElement,
    forwardRef,
    useContext,
    useImperativeHandle,
    useLayoutEffect,
    useRef,
} from 'react';

import type {
    CSSProperties,
    PropsWithChildren,
    ReactNode,
} from 'react';

/** Fills the component's root, so the chart inherits whatever size the consumer gives that root. */
const HOST_STYLE: CSSProperties = {
    width: '100%',
    height: '100%',
};

/**
 * Builds a declarative component for a Ripl chart.
 *
 * Props are the chart's options: each one maps to a top-level option, an unbound prop is never
 * written so the chart's own defaults survive, and a changed prop is pushed through `update()`
 * rather than rebuilding the chart.
 *
 * The component binds to an enclosing `<RiplContext>` when there is one, and otherwise renders and
 * owns its own host element — a chart builds its own scene and renderer either way, so it is a peer
 * of `<RiplContext>` rather than something that sits inside a `<RiplScene>`.
 *
 * @param definition - How to construct the chart and which options it accepts.
 * @returns A component to import and render.
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

    const component = forwardRef<RiplAnyChart, PropsWithChildren<RiplWritable & RiplHostProps>>((props, ref) => {
        const context = useContext(RIPL_CONTEXT);
        const host = useRef<HTMLDivElement>(null);
        const controller = useRef<RiplChartController>(undefined);

        // A chart destroys its context along with its scene, so it may only do that when it made
        // the context itself; an enclosing context component owns and destroys its own.
        const owned = !context;

        const chart = useRiplResource<RiplAnyChart>(() => {
            const target = context ?? (hasWindow ? host.current : null);

            if (!target) {
                return undefined;
            }

            const built = createChartController({
                definition: resolved,
                target,
                owned,
                props,
            });

            controller.current = built;
            built.attach();

            return {
                value: built.chart,
                destroy: () => {
                    controller.current = undefined;
                    built.destroy();
                },
            };
        }, [context, owned]);

        useImperativeHandle(ref, () => chart as RiplAnyChart, [chart]);
        useForwardedEvents(chart, props);

        useLayoutEffect(() => {
            const active = controller.current;
            const changed = active?.collect(props);

            if (active && changed) {
                active.update(changed);
            }
        });

        const provided = createElement(RIPL_CHART.Provider, {
            value: chart,
        }, props.children as ReactNode);

        // The chart's surface is mounted into the host, so children sit beside it rather than
        // inside the element the context clears.
        return owned
            ? createElement('div', {
                className: props.className as string | undefined,
                style: props.style as CSSProperties | undefined,
            }, createElement('div', {
                ref: host,
                style: HOST_STYLE,
            }), provided)
            : provided;
    });

    component.displayName = definition.name;

    return component;
}
