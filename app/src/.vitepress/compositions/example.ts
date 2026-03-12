import type {
    Chart,
} from '@ripl/charts';

import type {
    Context,
    Renderer,
    RendererOptions,
    Scene,
    SceneOptions,
} from '@ripl/core';

import {
    shallowRef,
} from 'vue';

import {
    enableTracking,
    pauseTracking,
} from '@vue/reactivity';

import {
    createRenderer,
    createScene,
} from '@ripl/core';

type AdvancedExampleOptions = {
    scene?: SceneOptions;
    renderer?: RendererOptions;
};

type AdvancedExampleState = {
    context: Context;
    scene: Scene;
    renderer: Renderer;
};

export function useRiplExample(onContextChanged?: (context: Context) => void) {
    const context = shallowRef<Context>();

    function contextChanged(ctx: Context) {
        context.value?.destroy();
        context.value = ctx;

        pauseTracking();
        onContextChanged?.(context.value);
        enableTracking();
    }

    return {
        context,
        contextChanged,
    };
}

export function useAdvRiplExample(onContextChanged?: (state: AdvancedExampleState) => void, options?: AdvancedExampleOptions) {
    const scene = shallowRef<Scene>();
    const renderer = shallowRef<Renderer>();

    const output = useRiplExample(context => {
        scene.value?.destroy();
        renderer.value?.destroy();

        const scn = createScene(context, options?.scene);
        const rdr = createRenderer(scn, options?.renderer);

        scene.value = scn;
        renderer.value = rdr;

        onContextChanged?.({
            context,
            scene: scn,
            renderer: rdr,
        });
    });

    return {
        ...output,
        scene,
        renderer,
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useRiplChart<TChart extends Chart<any>>(onContextChanged: (context: Context) => TChart) {
    const chart = shallowRef<TChart>();

    function contextChanged(context: Context) {
        chart.value = (chart.value?.destroy(), onContextChanged(context));
    }

    return {
        chart,
        contextChanged,
    };
}
