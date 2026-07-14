import {
    createRenderer,
    createScene,
    EventBus,
    factory,
} from '@ripl/core';

import type {
    Context,
    ContextExport,
    EventMap,
    Group,
    Renderer,
    Scene,
} from '@ripl/core';

import {
    createContext,
} from '@ripl/canvas';

import {
    getColorGenerator,
} from '../constants/colors';

import type {
    ChartAnimationOptions,
    ChartLegendInput,
    ChartTitleOptions,
} from './options';

import {
    normalizeAnimation,
    normalizeLegend,
    normalizeTitle,
} from './options';

import type {
    LegendItem,
} from '../components/legend';

import {
    Legend,
} from '../components/legend';

import type {
    ChartArea,
    ChartPadding,
} from './layout';

import {
    ChartLayout,
} from './layout';

import type {
    ResolvedAnimation,
} from './animation';

import {
    ANIMATION_REFERENCE,
    resolveAnimation,
} from './animation';

import {
    ChartTitle,
} from '../components/title';

if (!factory.createContext) {
    factory.set({ createContext });
}

export type {
    ChartAnimationOptions,
    ChartTitleOptions,
    ChartArea,
    ChartPadding,
};

export { ChartLayout };

/** Base options shared by all chart types. */
export interface BaseChartOptions {
    autoRender?: boolean;
    padding?: Partial<ChartPadding>;
    title?: string | Partial<ChartTitleOptions>;
    animation?: boolean | Partial<ChartAnimationOptions>;
}

/** Opacity applied to non-highlighted series/segments while a legend item is hovered. */
const HIGHLIGHT_DIM_OPACITY = 0.15;

/** Symbol slot used to remember an element's rest opacity across legend hover-highlight dim/restore. */
const HIGHLIGHT_REST = Symbol('highlight-rest');

interface HighlightHost {
    [HIGHLIGHT_REST]?: number;
}

/** Abstract base class for all chart types, providing scene, renderer, animation, color management, and lifecycle. */
export class Chart<
    TOptions extends BaseChartOptions,
    TEventMap extends EventMap = EventMap
> extends EventBus<TEventMap> {

    protected scene: Scene;
    protected renderer: Renderer;
    protected autoRender: boolean;
    protected animationOptions: ChartAnimationOptions;
    protected titleOptions?: ChartTitleOptions;
    protected title?: ChartTitle;
    protected legend?: Legend;

    private _hasRendered: boolean = false;

    protected options: TOptions;
    protected colorGenerator = getColorGenerator();
    private _seriesColorMap: Map<string, string> = new Map();
    private _highlightGroups: Map<string, Group> = new Map();

    constructor(target: Context | string | HTMLElement, options?: TOptions) {
        const {
            autoRender = true,
            animation,
            title,
            ...opts
        } = options || {};

        super();

        this.autoRender = autoRender;
        this.animationOptions = normalizeAnimation(animation);
        this.titleOptions = normalizeTitle(title);
        this.options = opts as TOptions;

        this.scene = createScene(target);
        this.renderer = createRenderer(this.scene);
    }

    protected init() {
        this.scene.context.on('resize', () => {
            if (this._hasRendered) {
                this.render();
            }
        });

        if (this.autoRender) {
            this.render();
        }
    }

    /** Merges partial options into the current options and re-renders if `autoRender` is enabled. */
    public update(options: Partial<TOptions>) {
        if (options.animation !== undefined) {
            this.animationOptions = normalizeAnimation(options.animation);
        }

        if (options.title !== undefined) {
            this.titleOptions = normalizeTitle(options.title);
        }

        this.options = {
            ...this.options,
            ...options,
        };

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
        const region = layout.reserve(this.title.position, thickness);
        this.title.render(region, this.resolveAnimation(ANIMATION_REFERENCE.enter));
    }

    /**
     * Reserves a band for the legend (when visible and given items) at its configured position
     * and renders it into that band, reconciling against the previous render.
     */
    protected reserveLegend(layout: ChartLayout, items: LegendItem[], input?: ChartLegendInput) {
        // When the chart hasn't explicitly configured a legend, show one automatically for
        // multi-series / multi-segment charts (more than one legend item) and hide it otherwise.
        const legendOpts = normalizeLegend(input, { visible: items.length > 1 });

        if (!legendOpts.visible || items.length === 0) {
            this.legend?.destroy();
            this.legend = undefined;
            return;
        }

        if (!this.legend) {
            this.legend = new Legend({
                scene: this.scene,
                renderer: this.renderer,
                items,
                position: legendOpts.position,
                font: legendOpts.font,
                fontColor: legendOpts.fontColor,
                highlight: legendOpts.highlight,
                onToggle: () => this.render(),
                onHighlight: id => this.highlightSeries(id),
            });
        } else {
            this.legend.update(items);
        }

        const thickness = this.legend.measure(layout.area);
        const region = layout.reserve(legendOpts.position, thickness);

        this.legend.render(region, this.resolveAnimation(ANIMATION_REFERENCE.enter));
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public async render(callback?: (scene: Scene, renderer: Renderer) => Promise<any>) {
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
        const p = this.options.padding || {};
        return {
            top: p.top ?? 10,
            right: p.right ?? 10,
            bottom: p.bottom ?? 10,
            left: p.left ?? 10,
        };
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
        return this._seriesColorMap.get(seriesId) ?? '#a1afc4';
    }

    /**
     * Registers the top-level series/segment groups that map one-to-one to legend items (by matching
     * `group.id` to the legend item id). Charts call this each render so {@link highlightSeries} can
     * dim the other series when a legend entry is hovered. Replaces any previously registered set.
     */
    protected registerHighlightGroups(groups: Group[]) {
        this._highlightGroups = new Map(groups.map(group => [group.id, group]));
    }

    /**
     * Highlights a single series/segment by id (dimming the others), or restores all when `null`.
     * Wired to legend hover via {@link reserveLegend}. No-ops for charts that never registered
     * highlight groups.
     *
     * Dims the leaf elements of each group rather than the group itself: a group's opacity does not
     * cascade multiplicatively, and the leaves carry no explicit `opacity` (so a group-level tween is
     * a no-op — `element.interpolate` skips nil current values). Each leaf's rest opacity is captured
     * once on the element (via a Symbol slot, like `applyHoverHighlight`), so hidden elements stay
     * hidden and restoring returns to the true value.
     */
    protected highlightSeries(id: string | null) {
        if (this._highlightGroups.size === 0) {
            return;
        }

        const { duration, ease } = this.resolveAnimation(ANIMATION_REFERENCE.hover);

        this._highlightGroups.forEach((group, groupId) => {
            const active = id === null || groupId === id;

            group.graph(false).forEach(element => {
                const host = element as unknown as HighlightHost;

                if (host[HIGHLIGHT_REST] === undefined) {
                    const rest = element.opacity ?? 1;
                    host[HIGHLIGHT_REST] = rest;
                    // Seed a concrete opacity so the transition below has a non-nil value to animate.
                    element.opacity = rest;
                }

                const rest = host[HIGHLIGHT_REST]!;

                this.renderer.transition(element, {
                    duration,
                    ease,
                    state: {
                        opacity: active ? rest : rest * HIGHLIGHT_DIM_OPACITY,
                    },
                });
            });
        });
    }

    /** Exports a snapshot of the chart's rendered context (image, url, or string). See {@link Context.export}. */
    public export(): ContextExport {
        return this.scene.context.export();
    }

    /** Destroys the chart, its scene, context, and cleans up all event subscriptions. */
    public destroy() {
        this.scene.destroy(true);
        super.destroy();
    }

}
