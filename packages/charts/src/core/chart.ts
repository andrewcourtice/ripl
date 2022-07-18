import {
    Renderer,
    renderer,
    Scene,
    scene,
} from '@ripl/core';

export interface ChartOptions<TData = unknown> {
    data: TData[];
    autoRender: boolean;
}

export interface ChartDefinition<TOptions extends ChartOptions> {
    onRender(): void;
    onUpdate(options: Partial<TOptions>): void;
}

export interface Chart<TOptions extends ChartOptions> {
    render(): void;
    update(options: Partial<TOptions>): void;
}

export type ChartDefiner<TOptions extends ChartOptions> = (options: TOptions, scene: Scene, renderer: Renderer) => ChartDefinition<TOptions>;
export type ChartConstructor<TOptions extends ChartOptions> = <TData>(target: string | HTMLCanvasElement, options: TOptions) => Chart<TOptions>;

const OPTIONS = {
    autoRender: false,
} as ChartOptions;

export function chart<TOptions extends ChartOptions>(definition: ChartDefiner<TOptions>): ChartConstructor<TOptions> {
    return (target, options) => {
        const chartScene = scene(target);
        const chartRenderer = renderer(chartScene);
        const chartOptions = {
            ...OPTIONS,
            ...options,
        } as TOptions;

        const {
            onRender,
            onUpdate,
        } = definition(chartOptions, chartScene, chartRenderer);

        const render = () => {
            onRender();
        };

        const update = (options) => {
            onUpdate(options);
        };

        return {
            render,
            update,
        };
    };
}