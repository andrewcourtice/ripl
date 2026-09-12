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
    scaleBand,
    scaleContinuous,
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

/** One month's revenue. */
export interface BarChartDatum {
    /** The month the figure is for. */
    month: string;
    /** Revenue for the month. */
    value: number;
}

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

const MARGIN = {
    top: 28,
    right: 20,
    bottom: 32,
    left: 56,
};

const TICK_COUNT = 5;
const BAR_RADIUS = [4, 4, 0, 0];
const BAR_COLOR = '#3a86ff';
const SELECTED_COLOR = '#ff006e';
const HOVER_COLOR = '#5c9cff';
const TEXT_COLOR = '#8b93a1';
const GRID_COLOR = 'rgba(140, 150, 165, 0.35)';
const AXIS_COLOR = 'rgba(140, 150, 165, 0.55)';
const AXIS_FONT = '11px sans-serif';
const VALUE_FONT = '600 11px sans-serif';

const COMPACT_CURRENCY = {
    style: 'currency',
    currency: 'USD',
    currencyDisplay: 'narrowSymbol',
    notation: 'compact',
    maximumFractionDigits: 1,
} as const;

const STYLE = {
    width: '100%',
    height: '100%',
};

const compact = new Intl.NumberFormat(undefined, COMPACT_CURRENCY);

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

    // Measured on ready as well as on resize: React commits the host before the context is built,
    // so the surface can already have its size and the resize that would announce one never fires.
    const onReady = useCallback((value: Context) => {
        setContext(value);
        measure(value);
    }, [measure]);

    const onResize = useCallback(() => measure(context), [context, measure]);

    const plot = useMemo(() => ({
        x: MARGIN.left,
        y: MARGIN.top,
        width: Math.max(0, size.width - MARGIN.left - MARGIN.right),
        height: Math.max(0, size.height - MARGIN.top - MARGIN.bottom),
    }), [size]);

    const layout = useMemo(() => {
        if (plot.width <= 0 || plot.height <= 0) {
            return undefined;
        }

        const max = Math.max(...props.data.map(datum => datum.value), 1);

        const valueScale = scaleContinuous([0, max], [plot.y + plot.height, plot.y], {
            padToTicks: TICK_COUNT,
        });

        const categoryScale = scaleBand(props.data.map(datum => datum.month), [plot.x, plot.x + plot.width], {
            innerPadding: 0.28,
            outerPadding: 0.14,
        });

        const baseline = valueScale(0);

        return {
            baseline,
            ticks: valueScale.ticks(TICK_COUNT).map(value => ({
                value,
                y: valueScale(value),
            })),
            bars: props.data.map(datum => ({
                key: datum.month,
                value: datum.value,
                x: categoryScale(datum.month),
                width: categoryScale.bandwidth,
                y: valueScale(datum.value),
                height: Math.max(0, baseline - valueScale(datum.value)),
            })),
        };
    }, [props.data, plot]);

    const phases = useMemo(() => {
        if (!props.animate || !layout) {
            return {};
        }

        return {
            barEnter: (element: unknown, index: number, length: number) => ({
                duration: 1000,
                delay: (index / length) * 400,
                ease: easeOutCubic,
                state: {
                    y: layout.baseline,
                    height: 0,
                },
            }),
            barUpdate: {
                duration: 1000,
                ease: easeOutCubic,
            },
            barLeave: {
                duration: 450,
                ease: easeOutCubic,
                state: {
                    y: layout.baseline,
                    height: 0,
                    opacity: 0,
                },
            },
            fade: {
                duration: 500,
                ease: easeOutCubic,
                state: {
                    opacity: 0,
                },
            },
            slide: {
                duration: 500,
                ease: easeOutCubic,
            },
        };
    }, [props.animate, layout]);

    const fillFor = (month: string) => {
        if (month === props.selected) {
            return SELECTED_COLOR;
        }

        return month === hovered ? HOVER_COLOR : BAR_COLOR;
    };

    const grid = layout?.ticks.flatMap(tick => [
        createElement(RiplLine, {
            key: `grid:${tick.value}`,
            x1: plot.x,
            x2: plot.x + plot.width,
            y1: tick.y,
            y2: tick.y,
            stroke: tick.value === 0 ? AXIS_COLOR : GRID_COLOR,
            lineWidth: 1,
        }),
        createElement(RiplText, {
            key: `tick:${tick.value}`,
            x: plot.x - 10,
            y: tick.y,
            content: compact.format(tick.value),
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
        fill: fillFor(bar.key),
        onClick: () => props.onSelect(bar.key),
        onMouseenter: () => setHovered(bar.key),
        onMouseleave: () => setHovered(undefined),
    })) ?? [];

    const labels = layout?.bars.flatMap(bar => [
        createElement(RiplText, {
            key: `value:${bar.key}`,
            x: bar.x + bar.width / 2,
            y: bar.y - 8,
            content: compact.format(bar.value),
            textAlign: 'center',
            textBaseline: 'bottom',
            font: VALUE_FONT,
            fill: TEXT_COLOR,
        }),
        createElement(RiplText, {
            key: `month:${bar.key}`,
            x: bar.x + bar.width / 2,
            y: layout.baseline + 16,
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
                update: phases.slide,
            }, grid),
            createElement(RiplTransition, {
                enter: phases.barEnter,
                update: phases.barUpdate,
                leave: phases.barLeave,
            }, bars),
            createElement(RiplTransition, {
                enter: phases.fade,
                update: phases.slide,
                leave: phases.fade,
            }, labels))));
}
