/**
 * Base class for cartesian (axis-based) charts.
 *
 * Centralises the construction and orchestration of the components that every cartesian chart
 * (bar, line, area, scatter, trend, stock, gantt, realtime) previously wired up by hand: x/y
 * axes, grid, crosshair, tooltip, legend and the chart title. Subclasses build their own scales
 * and series, but obtain a correctly-sized plot area from the shared layout pass so titles,
 * legends and axes never overlap or clip the plotting region.
 */

import {
    BaseChartOptions,
    Chart,
} from './chart';

import {
    ChartArea,
    ChartLayout,
} from './layout';

import {
    ANIMATION_REFERENCE,
} from './animation';

import type {
    ChartAxisInput,
    ChartCrosshairInput,
    ChartGridInput,
    ChartLegendInput,
    ChartTooltipInput,
    CrosshairAxis,
} from './options';

import {
    normalizeAxis,
    normalizeAxisItem,
    normalizeCrosshair,
    normalizeGrid,
    normalizeTooltip,
    normalizeYAxisItem,
    resolveFormatLabel,
} from './options';

import {
    ChartXAxis,
    ChartXAxisAlignment,
    ChartYAxis,
    ChartYAxisAlignment,
} from '../components/axis';

import {
    Grid,
} from '../components/grid';

import {
    Crosshair,
} from '../components/crosshair';

import {
    Tooltip,
} from '../components/tooltip';

import {
    LegendItem,
} from '../components/legend';

import {
    Box,
    Context,
    EventMap,
    Scale,
    scaleContinuous,
} from '@ripl/core';

/** Options shared by all cartesian charts. */
export interface CartesianChartOptions<TData = unknown> extends BaseChartOptions {
    axis?: ChartAxisInput<TData>;
    grid?: ChartGridInput;
    tooltip?: ChartTooltipInput;
    legend?: ChartLegendInput;
    crosshair?: ChartCrosshairInput;
}

/** Declares which optional cartesian components a chart wants constructed. */
export interface CartesianSetup {
    xAxisAlignment?: ChartXAxisAlignment;
    yAxisAlignment?: ChartYAxisAlignment;
    grid?: { horizontal?: boolean;
        vertical?: boolean; };
    crosshair?: boolean;
    crosshairAxisDefault?: CrosshairAxis;
}

/** Base class providing shared cartesian component lifecycle and layout. */
export abstract class CartesianChart<
    TOptions extends CartesianChartOptions<TData>,
    TData = unknown,
    TEventMap extends EventMap = EventMap
> extends Chart<TOptions, TEventMap> {

    protected xAxis!: ChartXAxis;
    protected yAxis!: ChartYAxis;
    protected tooltip?: Tooltip;
    protected grid?: Grid;
    protected crosshair?: Crosshair;

    /**
     * Builds the cartesian components from the chart options. Call this from a subclass
     * constructor (after `super(...)`) and before `init()`.
     */
    protected setupCartesian(setup: CartesianSetup = {}) {
        const axisOpts = normalizeAxis(this.options.axis);
        const xAxis = normalizeAxisItem(axisOpts.x);
        const yAxis = normalizeYAxisItem(Array.isArray(axisOpts.y) ? axisOpts.y[0] : axisOpts.y);
        const gridOpts = normalizeGrid(this.options.grid);
        const tooltipOpts = normalizeTooltip(this.options.tooltip);
        const crosshairOpts = normalizeCrosshair(this.options.crosshair, setup.crosshairAxisDefault ? { axis: setup.crosshairAxisDefault } : undefined);

        if (tooltipOpts.visible) {
            this.tooltip = new Tooltip({
                scene: this.scene,
                renderer: this.renderer,
                padding: typeof tooltipOpts.padding === 'number' ? tooltipOpts.padding : 8,
                font: tooltipOpts.font,
                fontColor: tooltipOpts.fontColor,
                backgroundColor: tooltipOpts.backgroundColor,
                borderRadius: typeof tooltipOpts.borderRadius === 'number' ? tooltipOpts.borderRadius : 6,
            });
        }

        this.xAxis = new ChartXAxis({
            scene: this.scene,
            renderer: this.renderer,
            bounds: Box.empty(),
            scale: scaleContinuous([0, 1], [0, 1]),
            alignment: setup.xAxisAlignment,
            labelFont: xAxis.font,
            labelColor: xAxis.fontColor,
            formatLabel: resolveFormatLabel(xAxis.format),
            title: xAxis.title,
        });

        this.xAxis.visible = xAxis.visible;

        this.yAxis = new ChartYAxis({
            scene: this.scene,
            renderer: this.renderer,
            bounds: Box.empty(),
            scale: scaleContinuous([0, 1], [0, 1]),
            alignment: setup.yAxisAlignment ?? (yAxis.position === 'right' ? 'right' : 'left'),
            labelFont: yAxis.font,
            labelColor: yAxis.fontColor,
            formatLabel: resolveFormatLabel(yAxis.format),
            title: yAxis.title,
        });

        this.yAxis.visible = yAxis.visible;

        if (gridOpts.visible) {
            this.grid = new Grid({
                scene: this.scene,
                renderer: this.renderer,
                horizontal: setup.grid?.horizontal ?? true,
                vertical: setup.grid?.vertical ?? false,
                stroke: gridOpts.lineColor,
                lineWidth: gridOpts.lineWidth,
                lineDash: gridOpts.lineDash,
            });
        }

        if (setup.crosshair && crosshairOpts.visible) {
            this.crosshair = new Crosshair({
                scene: this.scene,
                renderer: this.renderer,
                vertical: crosshairOpts.axis === 'x' || crosshairOpts.axis === 'both',
                horizontal: crosshairOpts.axis === 'y' || crosshairOpts.axis === 'both',
                stroke: crosshairOpts.lineColor,
                lineWidth: crosshairOpts.lineWidth,
            });
        }
    }

    /** Applies the chart's resolved animation to both axes ahead of rendering. */
    protected prepareAxes() {
        const animation = this.resolveAnimation(ANIMATION_REFERENCE.axis);
        this.xAxis.animation = animation;
        this.yAxis.animation = animation;
    }

    /** Reserves and renders the legend using the chart's `legend` option. */
    protected reserveLegend(layout: ChartLayout, items: LegendItem[]): void {
        super.reserveLegend(layout, items, this.options.legend);
    }

    /** Renders the grid within the given plot area at the supplied tick positions. */
    protected renderGrid(xTicks: number[], yTicks: number[], area: ChartArea) {
        this.grid?.render(xTicks, yTicks, area.x, area.y, area.width, area.height);
    }

    /** Sets up the crosshair to track within the given plot area. */
    protected setupCrosshair(area: ChartArea) {
        this.crosshair?.setup(area.x, area.y, area.width, area.height);
    }

    /**
     * Builds an evenly-spaced point scale mapping category keys to x positions across
     * `[left, right]`. Shared by line and area charts.
     */
    protected pointScale(keys: string[], left: number, right: number): Scale<string> {
        const span = Math.max(1, keys.length - 1);

        const convert = (value: string) => {
            const index = keys.indexOf(value);
            const t = index < 0 ? 0 : index / span;
            return left + t * (right - left);
        };

        const invert = (position: number) => {
            const t = (position - left) / Math.max(1, right - left);
            const index = Math.round(t * span);
            return keys[Math.max(0, Math.min(keys.length - 1, index))];
        };

        return Object.assign(convert, {
            domain: keys,
            range: [left, right] as number[],
            inverse: invert,
            ticks: () => keys,
            includes: (value: string) => keys.includes(value),
        }) as unknown as Scale<string>;
    }

}

/** Re-exported for convenience to subclasses that accept a render target. */
export type CartesianTarget = string | HTMLElement | Context;
