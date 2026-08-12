import {
    createRenderer,
    createScene,
    EventBus,
    factory,
} from '@ripl/core';

import type {
    Context,
    ContextExport,
    Element,
    EventMap,
    Group,
    Renderer,
    Scene,
} from '@ripl/core';

import {
    createContext,
} from '@ripl/canvas';

import {
    COLORS,
    getColorGenerator,
} from '../constants/colors';

import {
    ELEMENT_GAP,
} from '../constants/layout';

import type {
    ChartAnimationOptions,
    ChartLegendInput,
    ChartTitleOptions,
    ChartTooltipInput,
    ChartTooltipTrigger,
} from './options';

import {
    normalizeAnimation,
    normalizeLegend,
    normalizePadding,
    normalizeTitle,
    normalizeTooltip,
} from './options';

import type {
    Theme,
} from './theme';

import {
    resolveTheme,
} from './theme';

import type {
    LegendItem,
} from '../components/legend';

import {
    Legend,
} from '../components/legend';

import type {
    ChartArea,
    ChartPadding,
    PaddingInput,
} from './layout';

import {
    ChartLayout,
    resolveChartPadding,
} from './layout';

import type {
    ResolvedAnimation,
} from './animation';

import {
    ANIMATION_REFERENCE,
    resolveAnimation,
} from './animation';

import type {
    MarkInteraction,
} from './interaction';

import {
    getMarkInteraction,
} from './interaction';

import {
    ChartTitle,
} from '../components/title';

import type {
    TooltipPlacement,
} from '../components/tooltip';

import {
    Tooltip,
} from '../components/tooltip';

import type {
    Disposable,
} from '@ripl/utilities';

import {
    typeIsArray,
    typeIsFunction,
    typeIsNumber,
    typeIsString,
} from '@ripl/utilities';

if (!factory.createContext) {
    factory.set({ createContext });
}

export type {
    ChartAnimationOptions,
    ChartTitleOptions,
    ChartArea,
    ChartPadding,
    PaddingInput,
};

export { ChartLayout };

/** Base options shared by all chart types. */
export interface BaseChartOptions {
    /** Whether the chart renders automatically on construction and after every {@link Chart.update}. Defaults to `true`. */
    autoRender?: boolean;
    /** Space reserved around the chart, in pixels. A single number applies to all four edges; a `[top, right, bottom, left]` tuple or a partial `{ top, right, bottom, left }` object sets individual edges, leaving unspecified edges at the default. Defaults to `16`. */
    padding?: PaddingInput;
    /** Chart title as plain text, or a {@link ChartTitleOptions} object for full control. */
    title?: string | Partial<ChartTitleOptions>;
    /** Animation configuration, or a boolean toggling all transitions. See {@link ChartAnimationOptions}. */
    animation?: boolean | Partial<ChartAnimationOptions>;
    /** Theme for this chart: a registered name (`'light'`/`'dark'`/`'auto'`), or a {@link Theme}. Falls back to the module default (see `setDefaultTheme`). */
    theme?: string | Theme;
    /** Accessible description announced by screen readers (sets the rendering element's ARIA label). Defaults to the title text. */
    description?: string;
}

/** Identifies a mark: its key — the same key the chart reports in its events — optionally narrowed to a series. */
export interface MarkRef {
    /** The mark's key, exactly as the chart reports it in the mark's interaction events. */
    key: string;
    /** The series the mark belongs to. Omit to select the mark at that key in every series. */
    series?: string;
}

/** Identifies a link mark by the nodes it joins. */
export interface LinkRef {
    /** Id of the node the link leaves. */
    source: string;
    /** Id of the node the link enters. */
    target: string;
}

/** Identifies a heatmap cell by its axis labels. */
export interface CellRef {
    /** The cell's x-axis label. */
    x: string;
    /** The cell's y-axis label. */
    y: string;
}

/**
 * Selects one or more marks: a key, the chart's ref shape narrowing it, or an accessor receiving the
 * chart's dataset and returning either — so a mark can be addressed by position in the data
 * (`data => data[2].id`) without the caller tracking keys itself.
 *
 * @typeParam TData - The chart's datum type, as passed to its `data` option.
 * @typeParam TRef - The ref shape the chart's marks are addressed by. Defaults to {@link MarkRef}.
 */
export type MarkSelector<TData = unknown, TRef = MarkRef> = string | TRef | ((data: TData[]) => string | TRef);

/** Controls what a programmatic highlight shows alongside the mark's own highlight state. */
export interface HighlightOptions {
    /** Also show the mark's tooltip, anchored where hovering it would. Defaults to `false`. */
    tooltip?: boolean;
    /** Also place the crosshair on the mark. Only the axes the crosshair was configured for are drawn; ignored on charts without one. Defaults to `false`. */
    crosshair?: boolean;
}

/** Opacity applied to non-highlighted series/segments while a legend item is hovered. */
const HIGHLIGHT_DIM_OPACITY = 0.15;

/** Symbol slot used to remember an element's rest opacity across legend hover-highlight dim/restore. */
const HIGHLIGHT_REST = Symbol('highlight-rest');

interface HighlightHost {
    [HIGHLIGHT_REST]?: number;
}

/**
 * The opacity an element is settling to, read from the target state a render stashed on `element.data`,
 * or `undefined` when the element does not animate its opacity. Reading the target (rather than the
 * instantaneous value) keeps a hover placed mid-fade-in from recording `0` as an element's rest.
 */
function targetOpacityOf(element: Element): number | undefined {
    const target = (element.data as { opacity?: unknown } | null | undefined)?.opacity;

    return typeIsNumber(target) ? target : undefined;
}

function highlightOwnersInclude(owners: string | string[], id: string): boolean {
    return typeIsArray(owners) ? owners.includes(id) : owners === id;
}

/**
 * Abstract base class for all chart types, providing the scene, renderer, animation, color
 * management, title/legend layout, and the render/update lifecycle that every concrete chart
 * builds on. Consumers never instantiate this directly; each chart exposes a `createXChart`
 * factory (e.g. {@link createBarChart}) and this class supplies the shared behavior behind it.
 *
 * @typeParam TOptions - The chart's options type, extending {@link BaseChartOptions}.
 * @typeParam TEventMap - The map of events the chart emits.
 *
 * @example
 * ```ts
 * const chart = createBarChart(document.querySelector('#chart'), {
 *     data,
 *     series: [{ id: 'sales', label: 'Sales', value: 'amount' }],
 *     key: 'month',
 *     title: 'Monthly sales',
 * });
 *
 * // Merge new data/options over the current ones and re-render.
 * chart.update({ data: nextData });
 *
 * // Or trigger a render explicitly (e.g. when `autoRender` is disabled).
 * await chart.render();
 * ```
 */
export class Chart<
    TOptions extends BaseChartOptions,
    TEventMap extends EventMap = EventMap
> extends EventBus<TEventMap> {

    /** The scene the chart renders into. Exposed for inspection and tooling (e.g. devtools binding). */
    public readonly scene: Scene;
    /** The renderer driving the chart's animation loop. Exposed for inspection and tooling (e.g. devtools binding). */
    public readonly renderer: Renderer;
    protected autoRender: boolean;
    protected animationOptions: ChartAnimationOptions;
    protected titleOptions?: ChartTitleOptions;
    protected title?: ChartTitle;
    protected legend?: Legend;

    private _hasRendered: boolean = false;

    protected options: TOptions;
    /** The resolved theme (palette + furniture colors) this chart renders with. */
    protected theme: Theme;

    /** The resolved tooltip trigger mode (`'item'` per-mark, 'axis' shared), kept in sync by {@link Chart.syncTooltip}. */
    protected tooltipTrigger: ChartTooltipTrigger = 'item';
    protected colorGenerator: ReturnType<typeof getColorGenerator>;
    private _seriesColorMap: Map<string, string> = new Map();
    private _hiddenItems: Set<string> = new Set();
    private _highlightGroups: Array<{ group: Group;
        owners: string | string[]; }> = [];
    private _highlightDisposers: Disposable[] = [];
    private _activeHighlight: string | null = null;
    private _markRegistry: Map<string, Element[]> = new Map();
    private _activeMarks: MarkInteraction[] = [];
    private _programmaticSeries: boolean = false;

    /** The rendering context the chart's scene draws into. */
    public get context(): Context {
        return this.scene.context;
    }

    constructor(target: Context | string | HTMLElement, options?: TOptions) {
        const {
            autoRender = true,
            animation,
            title,
            theme,
            ...opts
        } = options || {};

        super();

        this.theme = resolveTheme(theme);
        this.colorGenerator = getColorGenerator(this.theme.palette);
        this.autoRender = autoRender;
        this.animationOptions = normalizeAnimation(animation);
        this.titleOptions = normalizeTitle(title);
        this.options = opts as TOptions;

        this.scene = createScene(target);
        this.renderer = createRenderer(this.scene);
    }

    protected init() {
        this._applyAccessibility();

        this.scene.context.on('resize', () => {
            if (this._hasRendered) {
                this.render();
            }
        });

        if (this.autoRender) {
            this.render();
        }
    }

    /**
     * Applies ARIA metadata to the rendering element so screen readers announce the chart as a
     * labeled image. The label is the chart's `description`, falling back to the title text, then a
     * generic "Chart". No-ops when the context's element does not support attributes (e.g. terminal).
     */
    private _applyAccessibility() {
        const element = this.scene.context.element as unknown as { setAttribute?: (name: string, value: string) => void };

        if (!element || !typeIsFunction(element.setAttribute)) {
            return;
        }

        const label = this.options.description ?? this.titleOptions?.text ?? 'Chart';

        element.setAttribute('role', 'img');
        element.setAttribute('aria-label', label);
    }

    /**
     * Merges partial options into the current options and re-renders if `autoRender` is enabled.
     *
     * The merge is a **shallow, top-level** merge: passing a key replaces that option wholesale
     * (it is then re-normalized against the chart defaults), so e.g. `update({ axis: { y: { ticks: 5 } } })`
     * replaces the whole `axis` option rather than deep-merging into the previous one. Furniture
     * options (axis, grid, tooltip, crosshair, legend, title) are re-applied to the live components
     * on the next render, so they can be reconfigured at runtime without recreating the chart.
     *
     * Passing `theme` re-resolves the chart theme: the series palette generator is re-seeded and
     * generated series colors are re-assigned from the new palette on the next render (explicit
     * per-series colors are kept), and furniture colors follow the new theme automatically.
     */
    public update(options: Partial<TOptions>) {
        if (options.animation !== undefined) {
            this.animationOptions = normalizeAnimation(options.animation);
        }

        if (options.title !== undefined) {
            this.titleOptions = normalizeTitle(options.title);
        }

        if (options.theme !== undefined) {
            this.theme = resolveTheme(options.theme);
            this.colorGenerator = getColorGenerator(this.theme.palette);
            // Drop generated colors so the next render re-seeds them from the new palette.
            this._seriesColorMap.clear();
        }

        this.options = {
            ...this.options,
            ...options,
        };

        if (options.title !== undefined || options.description !== undefined) {
            this._applyAccessibility();
        }

        if (this.autoRender) {
            this.render();
        }
    }

    protected getAnimationDuration(referenceDuration: number = 1000): number {
        return this.resolveAnimation(referenceDuration).duration;
    }

    /** Resolves the chart's animation options for a given reference duration (duration + easing + enabled). */
    protected resolveAnimation(referenceDuration: number = ANIMATION_REFERENCE.update): ResolvedAnimation {
        return resolveAnimation(this.animationOptions, referenceDuration);
    }

    /** Creates a fresh layout for the current canvas size and padding. */
    protected createLayout(): ChartLayout {
        const { width, height } = this.scene.context;
        return new ChartLayout(width, height, this.getPadding());
    }

    /**
     * Reserves a band for the chart title (if configured) and renders it. Returns the remaining
     * area unchanged when there is no title. Call this first in a chart's layout pass so the
     * title sits outermost.
     */
    protected reserveTitle(layout: ChartLayout) {
        if (!this.titleOptions) {
            this.title?.destroy();
            return;
        }

        if (!this.title) {
            this.title = new ChartTitle({
                scene: this.scene,
                renderer: this.renderer,
                options: this.titleOptions,
            });
        } else {
            this.title.setOptions(this.titleOptions);
        }

        if (!this.title.visible) {
            this.title.destroy();
            return;
        }

        const thickness = this.title.measure();
        // `ELEMENT_GAP` stops the title sitting flush against whatever is reserved next.
        const region = layout.reserve(this.title.position, thickness, ELEMENT_GAP);

        this.title.render(region, this.resolveAnimation(ANIMATION_REFERENCE.enter));
    }

    /**
     * Whether the series or segment behind a legend item id is currently shown. Legend clicks
     * toggle this via {@link Chart.setItemActive}; charts read it when building legend items and
     * filtering their rendered series.
     */
    protected isItemActive(id: string): boolean {
        return !this._hiddenItems.has(id);
    }

    /**
     * Filters series or segments down to the ones whose legend item is active. The id defaults to
     * each item's `id` property; pass an accessor for keyed data items.
     */
    protected filterActive<T>(items: T[], getId: (item: T) => string = item => (item as { id: string }).id): T[] {
        return items.filter(item => this.isItemActive(getId(item)));
    }

    /**
     * Shows or hides the series/segment behind a legend item and re-renders, so the existing
     * enter/exit joins animate it out of or back into the chart.
     */
    protected setItemActive(id: string, active: boolean): void {
        if (active) {
            this._hiddenItems.delete(id);
        } else {
            this._hiddenItems.add(id);
        }

        this.render();
    }

    /**
     * Reserves a band for the legend (when visible and given items) at its configured position
     * and renders it into that band, reconciling against the previous render.
     */
    protected reserveLegend(layout: ChartLayout, items: LegendItem[], input?: ChartLegendInput) {
        // Unconfigured legends default to visible only for multi-item charts.
        const legendOpts = normalizeLegend(input, { visible: items.length > 1 });

        if (!legendOpts.visible || items.length === 0) {
            this.legend?.destroy();
            this.legend = undefined;
            return;
        }

        // The legend insets symmetrically, so collapse the per-edge box to its largest edge.
        const legendPadding = normalizePadding(legendOpts.padding);
        const itemPadding = legendPadding && Math.max(
            legendPadding.top,
            legendPadding.right,
            legendPadding.bottom,
            legendPadding.left
        );

        if (!this.legend) {
            this.legend = new Legend({
                scene: this.scene,
                renderer: this.renderer,
                items,
                position: legendOpts.position,
                font: legendOpts.font,
                fontColor: legendOpts.fontColor,
                itemPadding,
                highlight: legendOpts.highlight,
                onToggle: (item, active) => this.setItemActive(item.id, active),
                onHighlight: id => this.applySeriesHighlight(id),
            });
        } else {
            this.legend.setOptions({
                position: legendOpts.position,
                font: legendOpts.font,
                fontColor: legendOpts.fontColor,
                itemPadding,
                highlight: legendOpts.highlight,
            });
            this.legend.update(items);
        }

        const thickness = this.legend.measure(layout.area);
        const region = layout.reserve(legendOpts.position, thickness, ELEMENT_GAP);

        this.legend.render(region, this.resolveAnimation(ANIMATION_REFERENCE.enter));
    }

    /**
     * Reconciles a hover tooltip against the chart's current `tooltip` option so it can be
     * reconfigured (or toggled) at runtime. Call once per render with the previous instance and
     * keep the returned one: the tooltip is created when it should be visible and none exists,
     * destroyed (returning `undefined`) when hidden, and restyled in place otherwise.
     *
     * @param tooltip - The chart's current tooltip instance, if any.
     * @param input - The chart's raw `tooltip` option.
     * @param placement - Where the tooltip box sits relative to its anchor (see {@link Tooltip}).
     * @returns The tooltip to use for this render, or `undefined` when tooltips are disabled.
     */
    protected syncTooltip(tooltip: Tooltip | undefined, input?: ChartTooltipInput, placement?: TooltipPlacement): Tooltip | undefined {
        const opts = normalizeTooltip(input, {
            fontColor: this.theme.tooltipColor,
            backgroundColor: this.theme.tooltipBackground,
        });

        this.tooltipTrigger = opts.trigger;

        if (!opts.visible) {
            tooltip?.destroy();
            return undefined;
        }

        const style = {
            padding: typeIsNumber(opts.padding) ? opts.padding : 8,
            font: opts.font,
            fontColor: opts.fontColor,
            backgroundColor: opts.backgroundColor,
            borderRadius: typeIsNumber(opts.borderRadius) ? opts.borderRadius : 6,
            maxWidth: opts.maxWidth,
            wrap: opts.wrap,
        };

        if (!tooltip) {
            return new Tooltip({
                scene: this.scene,
                renderer: this.renderer,
                placement,
                ...style,
            });
        }

        tooltip.setOptions(style);

        return tooltip;
    }

    /**
     * Runs a render pass, invoking `callback` to draw into the scene and marking the chart as
     * rendered. Concrete charts override this and delegate to `super.render(async () => { ... })`;
     * any error thrown by the callback is caught and the context cleared, so a failed render never
     * leaves a partially-drawn chart.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async render(callback?: (scene: Scene, renderer: Renderer) => Promise<any>) {
        // A programmatic highlight is a one-shot command, so a render restores the chart before redrawing it.
        this.clearHighlight();
        this._markRegistry.clear();

        try {
            await callback?.(this.scene, this.renderer);
        } catch (error) {
            console.error('failed', error);
            this.scene.context.clear();
        } finally {
            this._hasRendered = true;
        }
    }

    protected getPadding(): ChartPadding {
        return resolveChartPadding(this.options.padding);
    }

    protected getChartArea(): ChartArea {
        const { width, height } = this.scene.context;
        const padding = this.getPadding();

        return {
            x: padding.left,
            y: padding.top,
            width: width - padding.left - padding.right,
            height: height - padding.top - padding.bottom,
        };
    }

    protected resolveSeriesColors(series: {
        id: string;
        color?: string;
    }[]) {
        series.forEach(srs => {
            if (!this._seriesColorMap.has(srs.id)) {
                this._seriesColorMap.set(srs.id, srs.color ?? this.colorGenerator.next().value!);
            }

            if (srs.color) {
                this._seriesColorMap.set(srs.id, srs.color);
            }
        });
    }

    protected getSeriesColor(seriesId: string): string {
        return this._seriesColorMap.get(seriesId) ?? COLORS.slate;
    }

    /**
     * Registers the groups that {@link Chart.highlightSeries} dims when a legend entry is hovered. Charts
     * call this each render. By default a group belongs to the legend item whose id equals its
     * `group.id` (one-to-one). Pass `resolveId` when a group belongs to a different legend item, or
     * to several, e.g. a cluster legend (many node groups per legend item) or a connector that is
     * incident to two legend items (return an array of owner ids). Replaces any previous set.
     *
     * @param groups - The element groups eligible for dimming.
     * @param resolveId - Maps a group to the legend item id(s) it belongs to. Defaults to `group.id`.
     */
    protected registerHighlightGroups(groups: Group[], resolveId: (group: Group) => string | string[] = group => group.id) {
        this._highlightDisposers.forEach(disposer => disposer.dispose());

        this._highlightGroups = groups.map(group => ({
            group,
            owners: resolveId(group),
        }));

        this._highlightDisposers = this._highlightGroups.map(({ group }) => group.once('destroyed', () => {
            this._highlightGroups = this._highlightGroups.filter(entry => entry.group !== group);
            this._dropOrphanedHighlight();
        }, { self: true }));

        this._dropOrphanedHighlight();
    }

    /**
     * Restores the chart when the highlighted group is gone. A destroyed element never fires
     * `mouseleave`, so an exiting hovered segment would otherwise strand every other group dimmed.
     */
    private _dropOrphanedHighlight() {
        const active = this._activeHighlight;

        if (active === null || this._highlightGroups.some(({ owners }) => highlightOwnersInclude(owners, active))) {
            return;
        }

        this._programmaticSeries = false;
        this.applySeriesHighlight(null);
    }

    /**
     * Highlights a single series/segment by id (dimming the others), or restores all when `null`.
     * Wired to legend hover via {@link reserveLegend}, and to {@link Chart.highlightSeries} for the
     * public one-shot command. No-ops for charts that never registered highlight groups.
     *
     * Dims the leaf elements of each group rather than the group itself: a group's opacity does not
     * cascade multiplicatively, and the leaves carry no explicit `opacity` (so a group-level tween is
     * a no-op; `element.interpolate` skips nil current values). Each leaf's rest opacity is remembered
     * on the element (via a Symbol slot, like `applyHoverHighlight`), tracking the target a render
     * stashed on `.data` where there is one, so hidden elements stay hidden, an element caught
     * mid-fade-in still restores to full, and restoring returns to the true value.
     *
     * @param id - The legend item id to isolate, or `null` to restore every group.
     * @param immediate - Settle the groups and legend at their target opacity without transitioning,
     * so a caller that exports straight afterwards captures the chart at rest.
     * @returns `true` when the id matched at least one registered group (always `true` for `null`).
     */
    protected applySeriesHighlight(id: string | null, immediate: boolean = false): boolean {
        if (this._highlightGroups.length === 0) {
            this._activeHighlight = id;
            return false;
        }

        // Dimming for an id no group owns would leave the whole chart dimmed with nothing tracking the restore.
        if (id !== null && !this._highlightGroups.some(({ owners }) => highlightOwnersInclude(owners, id))) {
            return false;
        }

        const { duration, ease } = this.resolveAnimation(ANIMATION_REFERENCE.hover);
        const timing = {
            duration: immediate ? 0 : duration,
            ease,
        };

        this._activeHighlight = id;
        this.legend?.setHighlight(id, timing);

        this._highlightGroups.forEach(({ group, owners }) => {
            const active = id === null || highlightOwnersInclude(owners, id);

            group.graph(false).forEach(element => {
                const host = element as unknown as HighlightHost;
                const target = targetOpacityOf(element);

                if (target !== undefined) {
                    host[HIGHLIGHT_REST] = target;
                } else if (host[HIGHLIGHT_REST] === undefined) {
                    host[HIGHLIGHT_REST] = element.opacity ?? 1;
                }

                const rest = host[HIGHLIGHT_REST]!;

                // Seed a concrete opacity only where there is none, or a fade-in would snap to full.
                element.opacity ??= rest;

                const state = {
                    opacity: active ? rest : rest * HIGHLIGHT_DIM_OPACITY,
                };

                if (immediate) {
                    // A zero-duration transition lands a frame later, so write the state and paint it.
                    element.interpolate(state)(1);
                    return;
                }

                this.renderer.transition(element, {
                    ...timing,
                    state,
                });
            });
        });

        if (immediate) {
            this.renderer.start();
        }

        return true;
    }

    /**
     * Registers a rendered mark so {@link Chart.replayMark} can address it by key. Charts call this
     * beside the `applyHoverHighlight` call that makes the mark interactive, keying it by the same
     * value they report in the mark's interaction events. Passing `series` registers the mark twice:
     * once under the bare key (which selects that key across every series) and once narrowed to the
     * series. The registry is dropped at the top of every render.
     *
     * @param kind - The mark family, matching the chart's highlight method (e.g. `'bar'`, `'marker'`, `'node'`).
     * @param key - The mark's key, exactly as the chart reports it in the mark's interaction events.
     * @param element - The element carrying the mark's replayable hover treatment.
     * @param series - The series the mark belongs to, for multi-series charts.
     */
    protected registerMark(kind: string, key: string, element: Element, series?: string): void {
        this._addMark(`${kind}:${key}`, element);

        if (series !== undefined) {
            this._addMark(`${kind}:${series}:${key}`, element);
        }
    }

    private _addMark(id: string, element: Element): void {
        const elements = this._markRegistry.get(id);

        if (elements) {
            elements.push(element);
            return;
        }

        this._markRegistry.set(id, [element]);
    }

    /**
     * Replays the hover treatment of every mark matching a selector, as the chart's typed highlight
     * methods do. Accessor selectors are resolved by those methods (with
     * {@link Chart.resolveMarkSelector}) before they get here, so this stays free of the chart's
     * datum type. Silent by design: the mark's highlight state, chart-wide dim and tooltip are
     * applied, but no interaction event is emitted.
     *
     * @param kind - The mark family the selector addresses, as passed to {@link Chart.registerMark}.
     * @param selector - A registered key, or a {@link MarkRef} narrowing it to one series.
     * @param options - What to show alongside the mark's highlight state.
     * @returns `true` when at least one live mark matched, `false` when nothing changed.
     */
    protected replayMark(kind: string, selector: string | MarkRef, options?: HighlightOptions): boolean {
        const ref = typeIsString(selector) ? { key: selector } as MarkRef : selector;
        const id = ref.series === undefined
            ? `${kind}:${ref.key}`
            : `${kind}:${ref.series}:${ref.key}`;

        const marks = (this._markRegistry.get(id) ?? [])
            // A mark mid-exit is detached; transitioning it would never complete and would pin the render loop.
            .filter(element => !!element.parent)
            .map(element => getMarkInteraction(element))
            .filter((mark): mark is MarkInteraction => !!mark);

        if (marks.length === 0) {
            return false;
        }

        this.clearHighlight();

        const showTooltip = options?.tooltip ?? false;
        const content = showTooltip
            ? marks.map(mark => mark.content()).filter(line => !!line).join('\n') || undefined
            : undefined;

        marks.forEach((mark, index) => mark.enter({
            tooltip: showTooltip && index === 0,
            content: index === 0 ? content : undefined,
            onTakeover: () => this._releaseHighlight(),
        }));

        this._activeMarks = marks;

        return true;
    }

    /**
     * Resolves a selector's accessor form against the chart's data. Charts call this in their typed
     * highlight methods, where the datum type is known, before handing the result to
     * {@link Chart.replayMark}.
     *
     * @typeParam TData - The chart's datum type.
     * @typeParam TRef - The ref shape the chart's marks are addressed by.
     * @param selector - The selector the caller passed.
     * @param data - The dataset an accessor selector is called with.
     * @returns The key or ref the selector resolves to.
     */
    protected resolveMarkSelector<TData, TRef>(selector: MarkSelector<TData, TRef>, data: TData[]): string | TRef {
        return typeIsFunction(selector)
            ? (selector as (data: TData[]) => string | TRef)(data)
            : selector as string | TRef;
    }

    /** The mark handles the active programmatic highlight is holding, in match order. Empty when none is active. */
    protected get activeMarks(): readonly MarkInteraction[] {
        return this._activeMarks;
    }

    /** Drops the bookkeeping for a highlight whose marks have already been restored (e.g. by a pointer taking over). */
    private _releaseHighlight(): void {
        this._activeMarks = [];

        if (this._programmaticSeries) {
            this._programmaticSeries = false;
            this.applySeriesHighlight(null);
        }
    }

    /**
     * Highlights a series by id — dimming every other series, exactly as hovering its legend entry
     * does — and returns whether the id matched. The highlight is a one-shot command: the next
     * render (a resize, an {@link Chart.update}, a legend toggle) restores the chart, and it emits
     * no interaction events.
     *
     * @param id - The series or segment id, as the chart reports it in its events and legend items.
     * @returns `true` when the id matched a highlightable series, `false` when nothing changed.
     *
     * @example
     * ```ts
     * chart.highlightSeries('revenue');
     * chart.clearHighlight();
     * ```
     */
    public highlightSeries(id: string): boolean {
        this.clearHighlight();

        this._programmaticSeries = this.applySeriesHighlight(id);

        return this._programmaticSeries;
    }

    /**
     * Restores everything a programmatic highlight changed — the highlighted marks, the chart-wide
     * dim and any tooltip it opened — synchronously, leaving no transition behind. Hover highlights
     * are untouched, and calling it with nothing highlighted is a no-op.
     */
    public clearHighlight(): void {
        const marks = this._activeMarks;

        if (marks.length === 0 && !this._programmaticSeries) {
            return;
        }

        this._activeMarks = [];
        marks.forEach(mark => mark.leave({ duration: 0 }));

        // A mark's own chart-wide restore animates, so settle it too or the chart is still moving on return.
        this._programmaticSeries = false;
        this.applySeriesHighlight(null, true);
    }

    /** Exports a snapshot of the chart's rendered context (image, url, or string). See {@link Context.export}. */
    public export(): ContextExport {
        return this.scene.context.export();
    }

    /** Destroys the chart, its scene, context, and cleans up all event subscriptions. */
    public destroy() {
        this._highlightDisposers.forEach(disposer => disposer.dispose());
        this._highlightDisposers = [];
        this.scene.destroy(true);
        super.destroy();
    }

}
