import {
    Context,
    createRenderer,
    createScene,
    EventBus,
    EventMap,
    Renderer,
    Scene,
} from '@ripl/core';

export interface BaseChartOptions {
    autoRender?: boolean;
    animated?: boolean;
}

export class Chart<
    TOptions extends BaseChartOptions,
    TEventMap extends EventMap = EventMap
> extends EventBus<TEventMap> {

    protected scene: Scene;
    protected renderer: Renderer;
    protected autoRender: boolean;
    protected animated: boolean;

    private hasRendered: boolean = false;

    protected options: TOptions;

    constructor(target: Context | string | HTMLElement, options?: TOptions) {
        const {
            autoRender = true,
            animated = true,
            ...opts
        } = options || {};

        super();

        this.autoRender = autoRender;
        this.animated = animated;
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
        this.options = {
            ...this.options,
            ...options,
        };

        if (this.autoRender) {
            this.render();
        }
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

    public destroy() {
        this.scene.destroy();
        super.destroy();
    }

}
