import {
    createRenderer,
    createScene,
    Renderer,
    Scene,
} from '@ripl/core';

export type ChartRenderFunction = () => Promise<void>;

export interface ChartOptions {
    autoRender?: boolean;
    animated?: boolean;
}

export interface Chart<TOptions extends ChartOptions, TData = unknown> {
    render(): void;
    update(options: Partial<TOptions>): void;
    clear: Scene['clear'];
}

export interface ChartInstance<TOptions extends ChartOptions> {
    options: TOptions;
    scene: Scene;
    renderer: Renderer;
    onUpdate(handler: () => void): void;
}

export type ChartDefinition<TOptions extends ChartOptions> = (instance: ChartInstance<TOptions>) => ChartRenderFunction;
export type ChartConstructor<TOptions extends ChartOptions> = <TData>(target: string | HTMLCanvasElement, options: TOptions) => Chart<TOptions>;

const OPTIONS = {
    autoRender: true,
} as ChartOptions;

export function createChart<TOptions extends ChartOptions>(definition: ChartDefinition<TOptions>): ChartConstructor<TOptions> {
    return (target, options) => {
        const scene = createScene(target);
        const renderer = createRenderer(scene);
        const chartOptions = {
            ...OPTIONS,
            ...options,
        } as TOptions;

        const handlers = {
            onUpdate: new Set(),
        } as Record<keyof ChartInstance<TOptions>, Set<() => void>>;

        const instance = {
            scene,
            renderer,
            options: chartOptions,
            onUpdate: handler => handlers.onUpdate.add(handler),
        } as ChartInstance<TOptions>;

        const onRender = definition(instance);

        const render = () => {
            //scene.clear();

            try {
                onRender();
            } catch {
                scene.clear();
                // render error message
            }
        };

        const update = (options: Partial<TOptions>) => {
            const updatedOptions = {
                ...chartOptions,
                ...options,
            };

            instance.options = updatedOptions;
            handlers.onUpdate.forEach(handler => handler());

            if (updatedOptions.autoRender) {
                render();
            }
        };

        if (chartOptions.autoRender) {
            render();
        }

        return {
            render,
            update,
            clear: scene.clear.bind(scene),
        };
    };
}