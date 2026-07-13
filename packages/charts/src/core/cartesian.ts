/**
 * Base class for cartesian (axis-based) charts.
 *
 * Centralises the construction and orchestration of the components that every cartesian chart
 * (bar, line, area, scatter, trend, stock, gantt, realtime) previously wired up by hand: x/y
 * axes, grid, crosshair, tooltip, legend and the chart title. Subclasses build their own scales
 * and series, but obtain a correctly-sized plot area from the shared layout pass so titles,
 * legends and axes never overlap or clip the plotting region.
 */

import type {
    BaseChartOptions,
} from './chart';

import {
    Chart,
} from './chart';

import type {
    ChartArea,
    ChartLayout,
} from './layout';

import {
    ANIMATION_REFERENCE,
    resolveAnimation,
} from './animation';

import type {
    ResolvedAnimation,
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
    normalizeAnimation,
    normalizeAxis,
    normalizeAxisItem,
    normalizeCrosshair,
    normalizeGrid,
    normalizeTooltip,
    normalizeYAxisItem,
    resolveFormatLabel,
} from './options';

import type {
    ChartXAxisAlignment,
    ChartYAxisAlignment,
} from '../components/axis';

import {
    ChartXAxis,
    ChartYAxis,
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

import type {
    LegendItem,
} from '../components/legend';

import type {
    Context,
    EventMap,
    NavigatorInteractions,
    NavigatorTransform,
    Scale,
} from '@ripl/core';

import {
    Box,
    createFrameBuffer,
    scaleContinuous,
} from '@ripl/core';

import {
    createNavigator,
} from '@ripl/dom';

import type {
    DOMNavigator,
} from '@ripl/dom';

/** Resolved animation used to snap geometry into place during navigator-driven re-renders. */
const NO_ANIMATION = normalizeAnimation(false);

/** Whether a view transform is the identity (no pan, no zoom). */
function isIdentityTransform(transform: NavigatorTransform): boolean {
    return transform.k === 1 && transform.x === 0 && transform.y === 0;
}

/** Options shared by all cartesian charts. */
export interface CartesianChartOptions<TData = unknown> extends BaseChartOptions {
    axis?: ChartAxisInput<TData>;
    grid?: ChartGridInput;
    tooltip?: ChartTooltipInput;
    legend?: ChartLegendInput;
    crosshair?: ChartCrosshairInput;
    /**
     * Enables pan/zoom (and optionally brush) navigation on the plot. `true` turns on wheel-zoom and
     * click-drag pan; an object configures each interaction individually. The chart auto-creates a
     * {@link DOMNavigator} on its context and rescales the axis domains as the view changes — no data
     * rebuild. Access the underlying controller via `chart.navigator` for imperative framing
     * (`centerOn`/`fitBounds`) or brush-and-link.
     */
    navigator?: boolean | NavigatorInteractions;
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

    private _navigator?: DOMNavigator;
    private _view: NavigatorTransform = {
        k: 1,
        x: 0,
        y: 0,
    };

    private _navigating = false;
    private _scheduleNavigatorRender = createFrameBuffer();

    /**
     * The pan/zoom/brush controller for this chart, or `undefined` when the `navigator` option is off.
     * Use it for imperative framing (`centerOn`, `fitBounds`, `reset`) and to subscribe to
     * `brush`/`brushend` for brush-and-link.
     */
    public get navigator(): DOMNavigator | undefined {
        return this._navigator;
    }

    /**
     * Merges options and re-renders (see {@link Chart.update}), additionally creating or destroying the
     * navigator when the `navigator` option is toggled. The controller is otherwise a construction-time
     * concern, so reconciling here keeps `chart.update({ navigator })` working at runtime.
     */
    public override update(options: Partial<TOptions>): void {
        if (options.navigator !== undefined) {
            this.options = {
                ...this.options,
                ...options,
            };

            this._reconcileNavigator();
        }

        super.update(options);
    }

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

        this.retain({
            dispose: () => this._destroyNavigator(),
        });

        this._reconcileNavigator();
    }

    /**
     * Creates or destroys the pan/zoom/brush controller to match the current `navigator` option,
     * returning `true` when the active state changed. Called on construction and whenever
     * {@link update} receives a `navigator` option, so the controller can be toggled at runtime.
     */
    private _reconcileNavigator(): boolean {
        const enabled = !!this.options.navigator;

        if (enabled === !!this._navigator) {
            return false;
        }

        if (enabled) {
            this._createNavigator();
        } else {
            this._destroyNavigator();
        }

        return true;
    }

    /**
     * Creates the controller and wires its view changes to a coalesced, animation-free re-render (so
     * panning/zooming snaps rather than tweens). Charts opt their scales into the view via
     * {@link applyView}.
     */
    private _createNavigator(): void {
        const config = this.options.navigator;

        if (!config) {
            return;
        }

        const interactions = config === true
            ? {
                zoom: true,
                pan: true,
            }
            : config;

        this._navigator = createNavigator(this.scene.context, {
            interactions,
        });

        this._navigator.on('change', event => {
            this._view = event.data;
            this._scheduleNavigatorRender(() => this._renderFromNavigator());
        });
    }

    /** Destroys the controller (if any) and resets the view to the identity transform. */
    private _destroyNavigator(): void {
        if (!this._navigator) {
            return;
        }

        this._navigator.destroy();
        this._navigator = undefined;
        this._view = {
            k: 1,
            x: 0,
            y: 0,
        };
    }

    private _renderFromNavigator(): void {
        this._navigating = true;

        void Promise.resolve(this.render()).finally(() => {
            this._navigating = false;
        });
    }

    /**
     * Rescales a continuous axis scale to the window currently visible under the navigator's view
     * transform, keeping the same pixel range. Returns the scale unchanged when no navigator is active
     * or the view is at the identity. Subclasses pass their final x/y scales through this so pan/zoom
     * rescales the axis domains (and repositions geometry) without a data rebuild.
     */
    protected applyView(scale: Scale<number>, axis: 'x' | 'y'): Scale<number> {
        if (!this._navigator || isIdentityTransform(this._view)) {
            return scale;
        }

        const range = scale.range as [number, number];
        const translate = axis === 'x' ? this._view.x : this._view.y;
        const factor = this._view.k;

        const domain: [number, number] = [
            scale.inverse((range[0] - translate) / factor),
            scale.inverse((range[1] - translate) / factor),
        ];

        return scaleContinuous(domain, range);
    }

    protected resolveAnimation(referenceDuration: number = ANIMATION_REFERENCE.update): ResolvedAnimation {
        if (this._navigating) {
            return resolveAnimation(NO_ANIMATION, referenceDuration);
        }

        return super.resolveAnimation(referenceDuration);
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
