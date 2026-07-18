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
    ChartAxisItemOptions,
    ChartCrosshairInput,
    ChartGridInput,
    ChartLegendInput,
    ChartTooltipInput,
    ChartYAxisItemOptions,
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

import {
    axisTickCount,
} from './scales';

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

import type {
    AnnotationScales,
    ChartAnnotation,
} from '../components/annotation';

import {
    ChartAnnotations,
} from '../components/annotation';

import {
    Crosshair,
} from '../components/crosshair';

import {
    Tooltip,
} from '../components/tooltip';

import type {
    LegendItem,
} from '../components/legend';

import {
    ChartNavigator,
} from '../components/navigator';

import type {
    ChartNavigatorCategoryLayout,
    ChartNavigatorSeries,
    ChartNavigatorSeriesType,
    ChartNavigatorWindow,
} from '../components/navigator';

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
    numberClamp,
} from '@ripl/utilities';

import {
    createNavigator,
} from '@ripl/dom';

import type {
    DOMNavigator,
} from '@ripl/dom';

/** Resolved animation used to snap geometry into place during navigator-driven re-renders. */
const NO_ANIMATION = normalizeAnimation(false);

/** Default size (height for a bottom strip, width for a side strip) of the overview navigator, in pixels. */
const DEFAULT_OVERVIEW_SIZE = 48;
/** Gap between the plot/axis and the overview strip, in pixels. */
const OVERVIEW_GAP = 14;
/** Minimum visible window width, as a fraction of the domain (bounds the maximum zoom). */
const MIN_WINDOW = 0.02;
/** Maximum zoom factor `k` — you can zoom in to this, and out only to the full-data identity view (`k = 1`). */
const NAV_MAX_ZOOM = 50;

/** Whether a view transform is the identity (no pan, no zoom). */
function isIdentityTransform(transform: NavigatorTransform): boolean {
    return transform.k === 1 && transform.x === 0 && transform.y === 0;
}

/** Whether two view transforms are exactly equal. */
function isSameTransform(a: NavigatorTransform, b: NavigatorTransform): boolean {
    return a.k === b.k && a.x === b.x && a.y === b.y;
}

/**
 * Clamps a view translation so the visible window stays within the full domain: given the axis plot
 * `origin`/`size` and zoom `k`, the translate must lie in `[(origin+size)(1-k), origin(1-k)]`.
 */
function clampTranslate(translate: number, origin: number, size: number, k: number): number {
    return numberClamp(translate, (origin + size) * (1 - k), origin * (1 - k));
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
    /** Reference lines, shaded bands, and point markers drawn over the plot. See {@link ChartAnnotation}. */
    annotations?: ChartAnnotation[];
    /**
     * Enables pan/zoom (and optionally brush) navigation on the plot. `true` turns on wheel-zoom and
     * click-drag pan; an object configures each interaction individually. The chart auto-creates a
     * {@link DOMNavigator} on its context and rescales the axis domains as the view changes — no data
     * rebuild. Access the underlying controller via `chart.navigator` for imperative framing
     * (`centerOn`/`fitBounds`) or brush-and-link.
     */
    navigator?: boolean | NavigatorInteractions;
    /**
     * Enables an overview "scrub bar" strip beside the plot with a draggable window that selects the
     * visible range of the **category** axis (a bottom bar for category-on-x charts, a side bar for a
     * horizontal bar chart). `true` uses the default size; an object sets it. Enabling the strip also
     * turns on in-plot wheel/drag pan-zoom (category-axis only) unless `navigator` is explicitly `false`.
     * Only category-axis charts (line, area, bar, trend) render the strip.
     */
    overview?: boolean | ChartOverviewOptions;
}

/** Configuration for the overview navigator strip. */
export interface ChartOverviewOptions {
    /** Size of the strip (height for a bottom strip, width for a side strip), in pixels. Defaults to 48. */
    size?: number;
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
    /** All y-axes (primary plus any secondary). {@link CartesianChart.yAxis} is the primary (`yAxes[0]`). */
    protected yAxes: ChartYAxis[] = [];
    /** Resolved options for every y-axis, parallel to {@link CartesianChart.yAxes}. */
    protected yAxesOptions: ChartYAxisItemOptions<TData>[] = [];
    /** Resolved x-axis options (scale type, ticks, min/max, format) captured in {@link CartesianChart.setupCartesian}. */
    protected xAxisOptions!: ChartAxisItemOptions<TData>;
    /** Resolved y-axis options (scale type, ticks, min/max, format) captured in {@link CartesianChart.setupCartesian}. */
    protected yAxisOptions!: ChartYAxisItemOptions<TData>;
    protected tooltip?: Tooltip;
    protected grid?: Grid;
    protected crosshair?: Crosshair;
    private _annotations?: ChartAnnotations;

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

    /** The overview "scrub bar" strip (created in `setupCartesian`; only rendered by category-axis charts). */
    private _navigatorStrip!: ChartNavigator;
    /** The plot rectangle from the most recent render, used to bound pan and window the category axis. */
    private _navPlot?: ChartArea;

    /**
     * The pan/zoom/brush controller for this chart, or `undefined` when the `navigator` option is off.
     * Use it for imperative framing (`centerOn`, `fitBounds`, `reset`) and to subscribe to
     * `brush`/`brushend` for brush-and-link.
     */
    public get navigator(): DOMNavigator | undefined {
        return this._navigator;
    }

    /**
     * Whether a navigator pan/zoom gesture is currently in flight. Subclasses can gate entry/update
     * animations on this so marks snap to the new view each frame instead of tweening (which would lag
     * behind the pointer). Mirrors the animation suppression in {@link CartesianChart.resolveAnimation}.
     */
    protected get isNavigating(): boolean {
        return this._navigating;
    }

    /**
     * Merges options and re-renders (see {@link Chart.update}), additionally creating or destroying the
     * navigator when the `navigator` or `overview` option is toggled. The controller is otherwise a
     * construction-time concern, so reconciling here keeps `chart.update({ navigator })` /
     * `chart.update({ overview })` working at runtime.
     */
    public override update(options: Partial<TOptions>): void {
        if (options.navigator !== undefined || options.overview !== undefined) {
            this.options = {
                ...this.options,
                ...options,
            };

            this.options.navigator = this._resolveNavigator();

            if (this._overviewEnabled()) {
                this._navigatorStrip.attach();
            }

            this._reconcileNavigator();
        }

        super.update(options);
    }

    /**
     * Builds the cartesian components from the chart options. Call this from a subclass
     * constructor (after `super(...)`) and before `init()`.
     */
    protected setupCartesian(setup: CartesianSetup = {}) {
        // Build the overview strip and attach its listeners before the in-plot navigator is created, so
        // a pointerdown inside the strip band is claimed by the strip and never also pans the plot.
        this._navigatorStrip = new ChartNavigator({
            scene: this.scene,
            renderer: this.renderer,
        });

        if (this._overviewEnabled()) {
            this._navigatorStrip.attach();
        }

        // Enabling the overview implies a navigator for the strip to drive.
        this.options.navigator = this._resolveNavigator();

        // Per-chart theme colours are passed as normalizer defaults so a chart-level `theme`
        // themes the axes/grid/tooltip/crosshair (user-supplied options still win over them).
        const axisDefaults = {
            font: this.theme.font,
            fontColor: this.theme.axisColor,
        };

        const axisOpts = normalizeAxis(this.options.axis);
        const xAxis = normalizeAxisItem(axisOpts.x, axisDefaults);
        const yAxisInputs = Array.isArray(axisOpts.y) ? axisOpts.y : [axisOpts.y];
        const yAxisOptionsList = yAxisInputs.map((input, index) => normalizeYAxisItem(input, {
            ...axisDefaults,
            position: index === 0 ? 'left' : 'right',
        }));

        this.xAxisOptions = xAxis;
        this.yAxesOptions = yAxisOptionsList;
        this.yAxisOptions = yAxisOptionsList[0];
        const gridOpts = normalizeGrid(this.options.grid, { lineColor: this.theme.gridColor });
        const tooltipOpts = normalizeTooltip(this.options.tooltip, {
            fontColor: this.theme.tooltipColor,
            backgroundColor: this.theme.tooltipBackground,
        });
        const crosshairOpts = normalizeCrosshair(this.options.crosshair, {
            ...(setup.crosshairAxisDefault ? { axis: setup.crosshairAxisDefault } : {}),
            lineColor: this.theme.crosshairColor,
        });

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

        this.yAxes = yAxisOptionsList.map((yOpts, index) => {
            const axis = new ChartYAxis({
                scene: this.scene,
                renderer: this.renderer,
                bounds: Box.empty(),
                scale: scaleContinuous([0, 1], [0, 1]),
                alignment: index === 0
                    ? (setup.yAxisAlignment ?? (yOpts.position === 'right' ? 'right' : 'left'))
                    : yOpts.position,
                labelFont: yOpts.font,
                labelColor: yOpts.fontColor,
                formatLabel: resolveFormatLabel(yOpts.format),
                title: yOpts.title,
            });

            axis.visible = yOpts.visible;
            axis.tickCount = axisTickCount(yOpts);

            return axis;
        });

        this.yAxis = this.yAxes[0];

        this.xAxis.tickCount = axisTickCount(xAxis);

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
            dispose: () => {
                this._destroyNavigator();
                this._navigatorStrip.destroy();
            },
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
            // You can zoom in up to NAV_MAX_ZOOM, but only out to the full-data identity view (k = 1) —
            // never past the extent of the dataset.
            scaleExtent: [1, NAV_MAX_ZOOM],
        });

        this._navigator.on('change', event => {
            // Bound the transform so pan/zoom can't scroll past the data edges. Clamping is a fixpoint,
            // so re-applying the clamped transform re-enters once and then settles.
            const clamped = this._clampView(event.data);

            if (!isSameTransform(clamped, event.data)) {
                this._navigator?.setTransform(clamped);
                return;
            }

            this._view = clamped;
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
     * Which axis the navigator windows: `'x'` (category on x — line/area/vertical bar/trend), `'y'`
     * (category on y — horizontal bar), or `'both'` (2-D charts like scatter). Category-axis charts get
     * the overview strip and hold the value axis fixed; `'both'` charts zoom both axes uniformly. Only
     * `'x'`/`'y'` charts render the strip. Defaults to `'both'`.
     */
    protected navigationAxis(): 'x' | 'y' | 'both' {
        return 'both';
    }

    /**
     * How the overview strip positions category marks: `'band'` (bar/trend — padded category bands with
     * marks at band centres, so bars sit fully inside the strip) or `'point'` (line/area — marks spread
     * edge-to-edge). Defaults to `'point'`; category-band charts override it.
     */
    protected navigatorCategoryLayout(): ChartNavigatorCategoryLayout {
        return 'point';
    }

    /**
     * Builds the per-series overview data ({@link ChartNavigatorSeries}) the strip renders — id,
     * palette colour, draw type, and per-category values — from a series list and per-series
     * `type`/`value` resolvers. Shared by the line, area, bar, and trend charts so each only supplies
     * how to resolve its own type and values.
     *
     * @typeParam TSeries - The chart's series-options type (must carry an `id`).
     * @param series - The series to describe.
     * @param data - The dataset each series is sampled over.
     * @param getType - Resolves how a series is drawn in the strip (`line`/`bar`/`area`).
     * @param getValue - Resolves a series' numeric value at a data item.
     * @returns One {@link ChartNavigatorSeries} per input series, in order.
     */
    protected buildOverviewSeries<TSeries extends { id: string }>(
        series: TSeries[],
        data: TData[],
        getType: (series: TSeries) => ChartNavigatorSeriesType,
        getValue: (series: TSeries, item: TData) => number
    ): ChartNavigatorSeries[] {
        return series.map(srs => ({
            id: srs.id,
            color: this.getSeriesColor(srs.id),
            type: getType(srs),
            values: data.map(item => getValue(srs, item)),
        }));
    }

    /** Whether the overview strip is enabled and applicable (a category-axis chart with `overview` on). */
    private _overviewEnabled(): boolean {
        return !!this.options.overview && this.navigationAxis() !== 'both';
    }

    /** The strip's size (height for a bottom strip, width for a side strip), in pixels. */
    private _overviewSize(): number {
        const overview = this.options.overview;

        if (overview && typeof overview === 'object') {
            return overview.size ?? DEFAULT_OVERVIEW_SIZE;
        }

        return DEFAULT_OVERVIEW_SIZE;
    }

    /** Resolves the effective in-plot navigator config, ensuring a controller exists when the strip is on. */
    private _resolveNavigator(): boolean | NavigatorInteractions | undefined {
        const navigator = this.options.navigator;

        if (!this._overviewEnabled()) {
            return navigator;
        }

        // Strip on but in-plot gestures explicitly off — still create an inert controller for the strip.
        if (navigator === false) {
            return {
                zoom: false,
                pan: false,
                brush: false,
            };
        }

        return navigator ?? true;
    }

    /** Clamps a transform's category-axis translation so the visible window stays within the full domain. */
    private _clampView(transform: NavigatorTransform): NavigatorTransform {
        if (!this._navPlot || isIdentityTransform(transform)) {
            return transform;
        }

        const axis = this.navigationAxis();
        const { k } = transform;
        let { x, y } = transform;

        if (axis === 'x' || axis === 'both') {
            x = clampTranslate(x, this._navPlot.x, this._navPlot.width, k);
        }

        if (axis === 'y' || axis === 'both') {
            y = clampTranslate(y, this._navPlot.y, this._navPlot.height, k);
        }

        return {
            k,
            x,
            y,
        };
    }

    /**
     * Reserves the strip band from the layout (a bottom band for a category-on-x chart, a right band for
     * a horizontal bar chart). Call after `reserveTitle`/`reserveLegend` and before measuring the axes.
     * Returns `undefined` when the strip is off.
     */
    protected reserveNavigatorBand(layout: ChartLayout): ChartArea | undefined {
        if (!this._overviewEnabled()) {
            return undefined;
        }

        const size = this._overviewSize() + OVERVIEW_GAP;

        return this.navigationAxis() === 'y'
            ? layout.reserveRight(size)
            : layout.reserveBottom(size);
    }

    /**
     * Renders the overview strip into the reserved `band` from the given series and value extent, or
     * clears it when the strip is off. Call after the plot rect is known (i.e. after `clipPlot`). Pass
     * `stacked` so the strip stacks same-type bar/area series rather than grouping/overlaying them.
     */
    protected renderNavigator(band: ChartArea | undefined, series: ChartNavigatorSeries[], valueExtent: [number, number], stacked = false): void {
        if (!band || !this._overviewEnabled() || !this._navPlot) {
            this._navigatorStrip.clear();
            return;
        }

        const plot = this._navPlot;
        const vertical = this.navigationAxis() === 'y';

        const area = vertical
            ? {
                x: band.x + OVERVIEW_GAP,
                y: plot.y,
                width: this._overviewSize(),
                height: plot.height,
            }
            : {
                x: plot.x,
                y: band.y + OVERVIEW_GAP,
                width: plot.width,
                height: this._overviewSize(),
            };

        this._navigatorStrip.render({
            orientation: vertical ? 'vertical' : 'horizontal',
            area,
            series,
            valueExtent,
            stacked,
            categoryLayout: this.navigatorCategoryLayout(),
            window: this._currentWindow(),
            onWindow: window => this._onNavigatorWindow(window),
        });
    }

    /** The visible window `[start, end]` (category-domain fractions) derived from the current transform. */
    private _currentWindow(): ChartNavigatorWindow {
        const transform = this._navigator?.transform;

        if (!this._navPlot || !transform) {
            return {
                start: 0,
                end: 1,
            };
        }

        const vertical = this.navigationAxis() === 'y';
        const origin = vertical ? this._navPlot.y : this._navPlot.x;
        const size = Math.max(1, vertical ? this._navPlot.height : this._navPlot.width);
        const translate = vertical ? transform.y : transform.x;
        const start = ((origin - translate) / transform.k - origin) / size;
        const end = ((origin + size - translate) / transform.k - origin) / size;

        return {
            start: numberClamp(start, 0, 1),
            end: numberClamp(end, 0, 1),
        };
    }

    /** Converts a strip window into a navigator transform, windowing the category axis (value axis fixed). */
    private _onNavigatorWindow(window: ChartNavigatorWindow): void {
        if (!this._navPlot || !this._navigator) {
            return;
        }

        const vertical = this.navigationAxis() === 'y';
        const origin = vertical ? this._navPlot.y : this._navPlot.x;
        const size = Math.max(1, vertical ? this._navPlot.height : this._navPlot.width);

        let start = window.start;
        let end = window.end;

        if (end - start < MIN_WINDOW) {
            end = start + MIN_WINDOW;
        }

        start = numberClamp(start, 0, 1 - MIN_WINDOW);
        end = numberClamp(end, start + MIN_WINDOW, 1);

        const k = 1 / (end - start);
        const translate = origin - k * (origin + start * size);
        const current = this._navigator.transform;

        this._navigator.setTransform({
            k,
            x: vertical ? current.x : translate,
            y: vertical ? translate : current.y,
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
        this._navPlot = area;
        this._ensurePlotContent();

        // Marks + grid must stay within the plot while navigating; they live in `_plotContent` (masked by
        // `_plotClip`) and the grid's own clip. Axis labels only need clipping along the axis they
        // actually slide: the category axis slides under the window, so clip it; the value axis is held
        // at the full extent, so leave it unclipped (clipping it bisected its min/max labels). 2-D charts
        // (`both`) slide both axes.
        const navigating = !!this._navigator;
        const axis = this.navigationAxis();

        if (this._plotClip) {
            this._plotClip.x = area.x;
            this._plotClip.y = area.y;
            this._plotClip.width = area.width;
            this._plotClip.height = area.height;
            this._plotClip.clip = navigating;
        }

        this.xAxis.clipTo(area, navigating && (axis === 'x' || axis === 'both'));
        this.yAxis.clipTo(area, navigating && (axis === 'y' || axis === 'both'));
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

    /**
     * Renders the chart's {@link CartesianChartOptions.annotations} over the plot, resolving each
     * annotation's value(s) through the supplied x/y scales. Call after drawing the series so
     * annotations sit on top. Annotations that cannot map to the given scales are skipped.
     *
     * @param scales - The x/y value scales annotations resolve against.
     * @param plot - The plot rectangle annotations are drawn within.
     */
    protected renderAnnotations(scales: AnnotationScales, plot: ChartArea) {
        const annotations = this.options.annotations;

        if (!annotations || annotations.length === 0) {
            this._annotations?.destroy();
            this._annotations = undefined;
            return;
        }

        if (!this._annotations) {
            this._annotations = new ChartAnnotations({
                scene: this.scene,
                renderer: this.renderer,
            });
        }

        // Clip the annotations to the plot only while a navigator is active — the pan/zoom rescales
        // the axes, so unclipped annotations would otherwise slide into the axis gutters. Matches the
        // series/grid/axis clip gate in `clipPlot`.
        this._annotations.render(annotations, scales, plot, !!this._navigator);
    }

    /**
     * Resolves a series `axis` binding — a y-axis index or a y-axis `id` — to an index into
     * {@link CartesianChart.yAxes}, clamped to the available axes. Defaults to the primary axis (0).
     *
     * @param axis - The series' `axis` option (index, id, or undefined).
     * @returns The resolved y-axis index.
     */
    protected resolveSeriesAxisIndex(axis?: number | string): number {
        if (axis === undefined) {
            return 0;
        }

        if (typeof axis === 'number') {
            return Math.max(0, Math.min(axis, this.yAxes.length - 1));
        }

        const byId = this.yAxesOptions.findIndex((opts, index) => (opts.id ?? String(index)) === axis);

        return byId >= 0 ? byId : 0;
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
            return keys[numberClamp(index, 0, keys.length - 1)];
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
