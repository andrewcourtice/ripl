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
    BandScale,
    Context,
    Element,
    EventMap,
    Group,
    NavigatorInteractions,
    NavigatorTransform,
    Rect,
    Scale,
} from '@ripl/core';

import {
    Box,
    createFrameBuffer,
    createGroup,
    createRect,
    scaleContinuous,
} from '@ripl/core';

import type {
    OneOrMore,
} from '@ripl/utilities';

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
    /** X/y axis configuration, or a boolean toggling both axes. See {@link ChartAxisInput}. */
    axis?: ChartAxisInput<TData>;
    /** Background grid configuration, or a boolean toggle. See {@link ChartGridInput}. */
    grid?: ChartGridInput;
    /** Hover-tooltip configuration, or a boolean toggle. See {@link ChartTooltipInput}. */
    tooltip?: ChartTooltipInput;
    /** Legend configuration, a position string, or a boolean toggle. See {@link ChartLegendInput}. */
    legend?: ChartLegendInput;
    /** Crosshair configuration, or a boolean toggle. See {@link ChartCrosshairInput}. */
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
    /** Which edge the x-axis is aligned to (`top` or `bottom`). */
    xAxisAlignment?: ChartXAxisAlignment;
    /** Which edge the y-axis is aligned to (`left` or `right`). */
    yAxisAlignment?: ChartYAxisAlignment;
    /** Which grid-line directions to render (horizontal and/or vertical). */
    grid?: {
        /** Whether to draw horizontal grid lines. */
        horizontal?: boolean;
        /** Whether to draw vertical grid lines. */
        vertical?: boolean;
    };
    /** Whether to construct a crosshair for this chart. */
    crosshair?: boolean;
    /** Default axis the crosshair tracks when the consumer hasn't specified one. */
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
    private _navigatorConfigKey?: string;
    private _view: NavigatorTransform = {
        k: 1,
        x: 0,
        y: 0,
    };

    private _navigating = false;
    private _scheduleNavigatorRender = createFrameBuffer();

    /** Persistent container holding the plotted marks, clipped to the plot rect while navigating. */
    private _plotContent?: Group;
    private _plotClip?: Rect;

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
     * Creates, destroys, or rebuilds the pan/zoom/brush controller to match the current `navigator`
     * option, returning `true` when it changed. Called on construction and whenever {@link update}
     * receives a `navigator` option, so the controller can be toggled — and its interaction config
     * (e.g. zoom `sensitivity`) retuned — at runtime. A change to the config rebuilds the controller;
     * an unchanged config (the common case on a data/style update) leaves the current view intact.
     */
    private _reconcileNavigator(): boolean {
        const config = this.options.navigator;
        const enabled = !!config;
        const key = enabled ? JSON.stringify(config) : undefined;

        if (enabled === !!this._navigator && key === this._navigatorConfigKey) {
            return false;
        }

        this._destroyNavigator();
        this._navigatorConfigKey = key;

        if (enabled) {
            this._createNavigator();
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

    /**
     * Transforms a scale's pixel *output* by the current view (`k·pos + t`) instead of rescaling its
     * domain — for categorical axes (point/band scales) where domain rescaling is meaningless, so the
     * category positions pan and zoom in lock-step with the continuous axis. Returns the scale
     * unchanged when there is no navigator or the view is at rest. Band/point pixel spans
     * (`bandwidth`/`step`) scale with the zoom so bars widen as you zoom in.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    protected applyViewToScale<TScale extends Scale<any, number>>(scale: TScale, axis: 'x' | 'y'): TScale {
        if (!this._navigator || isIdentityTransform(this._view)) {
            return scale;
        }

        const factor = this._view.k;
        const translate = axis === 'x' ? this._view.x : this._view.y;

        type Domain = Parameters<TScale>[0];
        type ViewedScale = TScale & { bandwidth?: number;
            step?: number; };

        const source = scale as ViewedScale;
        const viewed = ((value: Domain) => factor * scale(value) + translate) as unknown as ViewedScale;

        viewed.domain = source.domain;
        viewed.range = source.range;
        viewed.ticks = (count?: number) => source.ticks(count);
        viewed.includes = (value: Domain) => source.includes(value);
        viewed.inverse = (position: number) => source.inverse((position - translate) / factor);

        // Band/point scales expose pixel spans that must zoom with the view (bars widen on zoom-in).
        if (typeof source.bandwidth === 'number') {
            viewed.bandwidth = source.bandwidth * factor;
        }

        if (typeof source.step === 'number') {
            viewed.step = source.step * factor;
        }

        return viewed;
    }

    /**
     * Adds plotted marks to a persistent, plot-clipped container instead of straight to the scene, so
     * that panning/zooming can't smear marks over the axes, title or legend. Subclasses call this in
     * place of `this.scene.add(...)` for their data marks (bars, bubbles, lines, …). The container sits
     * just above the grid (z-index 1) and below the axes/title/legend, and its clip only bites while a
     * navigator is active — see {@link clipPlot} — so non-navigator rendering is byte-for-byte
     * unchanged.
     */
    protected addPlotContent(elements: OneOrMore<Element>): void {
        this._ensurePlotContent().add(elements);
    }

    /** Lazily builds the plot-content container and its clip rect, adding it to the scene once. */
    private _ensurePlotContent(): Group {
        if (!this._plotContent) {
            // A fill-less, stroke-less rect: when `clip` is on it masks its later siblings (the marks);
            // when off it draws nothing. Lowest z-index so it applies before any mark renders.
            this._plotClip = createRect({
                x: 0,
                y: 0,
                width: 0,
                height: 0,
                clip: false,
                // A pure visual mask: never intercept pointer events, or it would swallow hovers/clicks
                // meant for the marks it covers (barclick, marker hover, etc.).
                pointerEvents: 'none',
                zIndex: Number.NEGATIVE_INFINITY,
            });

            this._plotContent = createGroup({
                id: '__plot-content',
                zIndex: 1,
                children: [this._plotClip],
            });

            this.scene.add(this._plotContent);
        }

        return this._plotContent;
    }

    /**
     * Points the plot-content clip at the current plot rectangle and enables it only while a navigator
     * is active. Subclasses call this once per render after they know their plot area. With no
     * navigator the clip stays inert, preserving the exact un-clipped rendering.
     */
    protected clipPlot(area: ChartArea): void {
        this._ensurePlotContent();

        // Everything positioned by the (navigator-rescaled) scales — marks, grid, and axis
        // ticks/labels — must stay within the plot while navigating. The marks live in
        // `_plotContent` (masked by `_plotClip`); the grid and axes live in their own scene-root
        // groups, so they get their own clips here. All are inert without a navigator.
        const navigating = !!this._navigator;

        if (this._plotClip) {
            this._plotClip.x = area.x;
            this._plotClip.y = area.y;
            this._plotClip.width = area.width;
            this._plotClip.height = area.height;
            this._plotClip.clip = navigating;
        }

        this.xAxis.clipTo(area, navigating);
        this.yAxis.clipTo(area, navigating);
        this.grid?.clipTo(area, navigating);
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

    /**
     * Wraps a band scale as a point scale positioned at each band's centre, rendering one centred
     * tick per category. Shared by the bar chart (its categorical axis) and the trend chart (which
     * places line/area markers at the centre of each category slot).
     */
    protected bandCenterScale(band: BandScale<string>, keys: string[]): Scale<string> {
        return Object.assign(
            (value: string) => band(value) + band.bandwidth / 2,
            {
                domain: keys,
                range: band.range,
                inverse: band.inverse,
                ticks: () => keys,
                includes: (value: string) => keys.includes(value),
            }
        ) as unknown as Scale<string>;
    }

}

/** Re-exported for convenience to subclasses that accept a render target. */
export type CartesianTarget = string | HTMLElement | Context;
