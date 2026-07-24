import {
    useEffect,
    useMemo,
} from 'react';

import {
    createRenderer,
    createScene,
} from '@ripl/core';

import type {
    Renderer,
    Scene,
} from '@ripl/core';

import {
    useRiplContext,
} from './use-ripl-context';

import type {
    RiplContextHandle,
    UseRiplContextOptions,
} from './use-ripl-context';

/** The value returned by {@link useRiplScene}: a {@link RiplContextHandle} plus a bound scene and renderer. */
export interface RiplSceneHandle extends RiplContextHandle {
    /** The scene bound to the context; add Ripl elements to it. */
    scene: Scene;
    /** The renderer driving the scene's animation loop. */
    renderer: Renderer;
}

/**
 * Builds on {@link useRiplContext} to also create a {@link Scene} and {@link Renderer} bound to the
 * context, for rendering raw Ripl elements (rather than a chart). The renderer is destroyed on
 * unmount.
 *
 * @param options - Context and interaction options.
 * @returns The scene handle to wire into a Skia surface.
 */
export function useRiplScene(options?: UseRiplContextOptions): RiplSceneHandle {
    const handle = useRiplContext(options);

    const {
        scene,
        renderer,
    } = useMemo(() => {
        const boundScene = createScene(handle.context);

        return {
            scene: boundScene,
            renderer: createRenderer(boundScene),
        };
    }, [handle.context]);

    useEffect(() => () => renderer.destroy(), [renderer]);

    return {
        ...handle,
        scene,
        renderer,
    };
}
