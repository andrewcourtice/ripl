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
    ChartTitleOptions,
} from './options';

import {
    normalizeAnimation,
    normalizeTitle,
} from './options';

if (!factory.createContext) {
    factory.set({ createContext });
}

export type {
    ChartAnimationOptions,
    ChartTitleOptions,
};

/** Chart padding with explicit top, right, bottom, and left values. */
export interface ChartPadding {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

/** The computed drawing area of a chart after padding is applied. */
export interface ChartArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

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
        if (!this.animationOptions.enabled) {
            return 0;
        }

        const scale = this.animationOptions.duration / 1000;
        return referenceDuration * scale;
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
