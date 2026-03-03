import {
    Context,
    createRenderer,
    createScene,
    EventBus,
    EventMap,
    Renderer,
    Scene,
} from '@ripl/core';

import {
    arrayForEach,
} from '@ripl/utilities';

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

export type {
    ChartAnimationOptions,
    ChartTitleOptions,
};

export interface ChartPadding {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

export interface ChartArea {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface BaseChartOptions {
    autoRender?: boolean;
    padding?: Partial<ChartPadding>;
    title?: string | Partial<ChartTitleOptions>;
    animation?: boolean | Partial<ChartAnimationOptions>;
}

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
        arrayForEach(series, srs => {
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

    public destroy() {
        this.scene.destroy();
        super.destroy();
    }

}
