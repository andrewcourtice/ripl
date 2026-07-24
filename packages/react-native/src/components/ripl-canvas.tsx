import {
    useEffect,
} from 'react';

import type {
    StyleProp,
    ViewStyle,
} from 'react-native';

import type {
    Renderer,
    Scene,
} from '@ripl/core';

import type {
    ReactNativeSkiaContext,
} from '../context';

import {
    useRiplScene,
} from '../hooks/use-ripl-scene';

import type {
    UseRiplContextOptions,
} from '../hooks/use-ripl-context';

import {
    RiplSurface,
} from './ripl-surface';

/** The scene, renderer, and context handed to {@link RiplCanvasProps.onReady}. */
export interface RiplCanvasReadyEvent {
    /** The scene to add Ripl elements to. */
    scene: Scene;
    /** The renderer driving the scene's animation loop. */
    renderer: Renderer;
    /** The underlying React Native Skia context. */
    context: ReactNativeSkiaContext;
}

/** Props for {@link RiplCanvas}. */
export interface RiplCanvasProps extends UseRiplContextOptions {
    /** Style applied to the underlying Skia `<Canvas>` (defaults to `{ flex: 1 }`). */
    style?: StyleProp<ViewStyle>;
    /** Called once the scene/renderer/context are ready, so the caller can add elements and animate them. */
    onReady?: (event: RiplCanvasReadyEvent) => void;
}

/**
 * A declarative surface for rendering raw Ripl elements in React Native. It owns the
 * context/scene/renderer lifecycle (via {@link useRiplScene}) and calls {@link RiplCanvasProps.onReady}
 * so the caller can populate and animate the scene. For charts, prefer the chart components (e.g.
 * `BarChart`) or {@link createChartComponent}.
 *
 * @example
 * ```tsx
 * <RiplCanvas
 *     style={{ flex: 1 }}
 *     onReady={({ scene, renderer }) => {
 *         const circle = createCircle({ cx: 80, cy: 80, radius: 40, fillStyle: '#4c9aff' });
 *         scene.add(circle);
 *         renderer.render();
 *     }}
 * />
 * ```
 *
 * @param props - The canvas props (context/interaction options plus `style` and `onReady`).
 * @returns The rendered Skia surface element.
 */
export function RiplCanvas(props: RiplCanvasProps) {
    const {
        style,
        onReady,
        ...options
    } = props;

    const {
        scene,
        renderer,
        context,
        picture,
        onLayout,
        gesture,
    } = useRiplScene(options);

    useEffect(() => {
        onReady?.({
            scene,
            renderer,
            context,
        });
    }, [scene, renderer, context]);

    return (
        <RiplSurface picture={picture} onLayout={onLayout} gesture={gesture} style={style} />
    );
}
