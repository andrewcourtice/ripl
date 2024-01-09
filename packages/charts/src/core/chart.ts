import {
    ContextType,
    createRenderer,
    createScene,
    Renderer,
    Scene,
} from '@ripl/core';

export type BaseChartOptions = Record<PropertyKey, any>;
export type ChartOptions<TOptions extends BaseChartOptions> = {
    autoRender?: boolean;
    animated?: boolean;
    type?: ContextType;
} & TOptions;

export class Chart<TOptions extends BaseChartOptions> {

    private scene: Scene;
    private renderer: Renderer;
    private autoRender: boolean;
    private animated: boolean;

    private hasRendered: boolean = false;

    protected options: TOptions;

    constructor(target: string | HTMLElement, options?: ChartOptions<TOptions>) {
        const {
            type,
            autoRender = true,
            animated = true,
            ...opts
        } = options || {};

        this.autoRender = autoRender;
        this.animated = animated;
        this.options = opts as TOptions;

        this.scene = createScene(target, {
            type,
        });

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

    public async render(callback?: (scene: Scene, renderer: Renderer) => Promise<any>) {
        try {
            await callback?.(this.scene, this.renderer);
        } catch (error) {
            console.log('failed', error);
            this.scene.context.clear();
        } finally {
            this.hasRendered = true;
        }
    }

}