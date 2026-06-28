import {
    Context,
    createRenderer,
    createScene,
    EventBus,
    EventMap,
    factory,
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

import {
    Legend,
    LegendItem,
} from '../components/legend';

import {
    ChartArea,
    ChartLayout,
    ChartPadding,
} from './layout';

import {
    ANIMATION_REFERENCE,
    resolveAnimation,
    ResolvedAnimation,
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

    private hasRendered: boolean = false;

    protected options: TOptions;
    protected colorGenerator = getColorGenerator();
    private seriesColorMap: Map<string, string> = new Map();

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
        this.scene.on('resize', () => {
            if (this.hasRendered) {
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
        const legendOpts = normalizeLegend(input);

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
            this.hasRendered = true;
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
            if (!this.seriesColorMap.has(srs.id)) {
                this.seriesColorMap.set(srs.id, srs.color ?? this.colorGenerator.next().value!);
            }

            if (srs.color) {
                this.seriesColorMap.set(srs.id, srs.color);
            }
        });
    }

    protected getSeriesColor(seriesId: string): string {
        return this.seriesColorMap.get(seriesId) ?? '#a1afc4';
    }

    /** Destroys the chart, its scene, context, and cleans up all event subscriptions. */
    public destroy() {
        this.scene.destroy(true);
        super.destroy();
    }

}
