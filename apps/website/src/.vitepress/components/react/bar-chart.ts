import {
    AXIS_COLOR,
    AXIS_DURATION,
    AXIS_FONT,
    BAR_RADIUS,
    createBarLayout,
    ENTER_DURATION,
    EXIT_DURATION,
    fillFor,
    GRID_COLOR,
    MONTH_LABEL_OFFSET,
    TEXT_COLOR,
    TICK_LABEL_OFFSET,
    UPDATE_DURATION,
    VALUE_FONT,
    VALUE_LABEL_OFFSET,
} from '../bar-chart-demo';

import type {
    BarChartDatum,
} from '../bar-chart-demo';

import {
    RiplContext,
    RiplLine,
    RiplRect,
    RiplRenderer,
    RiplScene,
    RiplText,
    RiplTransition,
} from '@ripl/react';

import {
    easeOutCubic,
} from '@ripl/web';

import type {
    Context,
} from '@ripl/web';

import {
    createElement,
    useCallback,
    useMemo,
    useState,
} from 'react';

import type {
    ReactElement,
} from 'react';

/** Props accepted by {@link BarChartDemo}. */
export interface BarChartDemoProps {
    /** The months to plot. */
    data: BarChartDatum[];
    /** Whether enter, update and leave animate. */
    animate: boolean;
    /** Called with the month of the bar that was clicked. */
    onSelect(month: string): void;
    /** The month currently selected, if any. */
    selected?: string;
}

const STYLE = {
    width: '100%',
    height: '100%',
};

/**
 * The React bar chart demo: a complete chart built from the element components alone, with no
 * `@ripl/charts` and no imperative scene or renderer.
 */
export function BarChartDemo(props: BarChartDemoProps): ReactElement {
    const [context, setContext] = useState<Context>();
    const [size, setSize] = useState({
        width: 0,
        height: 0,
    });

    const [hovered, setHovered] = useState<string>();

    const measure = useCallback((value: Context | undefined) => setSize({
        width: value?.width ?? 0,
        height: value?.height ?? 0,
    }), []);

    // Measured on ready too: the surface can already be sized, and then no resize ever announces it.
    const onReady = useCallback((value: Context) => {
        setContext(value);
        measure(value);
    }, [measure]);

    const onResize = useCallback(() => measure(context), [context, measure]);

    const layout = useMemo(() => createBarLayout(props.data, size), [props.data, size]);

    const phases = useMemo(() => {
        if (!props.animate || !layout) {
            return {};
        }

        return {
            barEnter: (element: unknown, index: number, length: number) => ({
                duration: ENTER_DURATION,
                delay: (index / length) * ENTER_DURATION,
                ease: easeOutCubic,
                state: {
                    y: layout.baseline,
                    height: 0,
                },
            }),
            barUpdate: {
                duration: UPDATE_DURATION,
                ease: easeOutCubic,
            },
            barLeave: {
                duration: EXIT_DURATION,
                ease: easeOutCubic,
                state: {
                    y: layout.baseline,
                    height: 0,
                    opacity: 0,
                },
            },
            labelEnter: {
                duration: ENTER_DURATION,
                ease: easeOutCubic,
                state: {
                    opacity: 0,
                },
            },
            labelLeave: {
                duration: EXIT_DURATION,
                ease: easeOutCubic,
                state: {
                    opacity: 0,
                },
            },
            axis: {
                duration: AXIS_DURATION,
                ease: easeOutCubic,
            },
        };
    }, [props.animate, layout]);

    const grid = layout?.ticks.flatMap(tick => [
        createElement(RiplLine, {
            key: `grid:${tick.value}`,
            x1: layout.plot.x,
            x2: layout.plot.x + layout.plot.width,
            y1: tick.y,
            y2: tick.y,
            stroke: tick.value === 0 ? AXIS_COLOR : GRID_COLOR,
            lineWidth: 1,
        }),
        createElement(RiplText, {
            key: `tick:${tick.value}`,
            x: layout.plot.x - TICK_LABEL_OFFSET,
            y: tick.y,
            content: tick.label,
            textAlign: 'right',
            textBaseline: 'middle',
            font: AXIS_FONT,
            fill: TEXT_COLOR,
        }),
    ]) ?? [];

    const bars = layout?.bars.map(bar => createElement(RiplRect, {
        key: bar.key,
        x: bar.x,
        y: bar.y,
        width: bar.width,
        height: bar.height,
        borderRadius: BAR_RADIUS,
        fill: fillFor(bar.key, hovered, props.selected),
        onClick: () => props.onSelect(bar.key),
        onMouseenter: () => setHovered(bar.key),
        onMouseleave: () => setHovered(undefined),
    })) ?? [];

    const labels = layout?.bars.flatMap(bar => [
        createElement(RiplText, {
            key: `value:${bar.key}`,
            x: bar.x + bar.width / 2,
            y: bar.y - VALUE_LABEL_OFFSET,
            content: bar.valueLabel,
            textAlign: 'center',
            textBaseline: 'bottom',
            font: VALUE_FONT,
            fill: TEXT_COLOR,
        }),
        createElement(RiplText, {
            key: `month:${bar.key}`,
            x: bar.x + bar.width / 2,
            y: layout.plot.y + layout.plot.height + MONTH_LABEL_OFFSET,
            content: bar.key,
            textAlign: 'center',
            textBaseline: 'top',
            font: AXIS_FONT,
            fill: TEXT_COLOR,
        }),
    ]) ?? [];

    return createElement(RiplContext, {
        style: STYLE,
        onReady,
        onResize,
    }, createElement(RiplScene, null,
        createElement(RiplRenderer, null,
            createElement(RiplTransition, {
                update: phases.axis,
            }, grid),
            createElement(RiplTransition, {
                enter: phases.barEnter,
                update: phases.barUpdate,
                leave: phases.barLeave,
            }, bars),
            createElement(RiplTransition, {
                enter: phases.labelEnter,
                update: phases.barUpdate,
                leave: phases.labelLeave,
            }, labels))));
}
