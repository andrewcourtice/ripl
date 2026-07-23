import {
    onUnmounted,
    shallowRef,
} from 'vue';

import {
    createCamera,
} from '@ripl/3d';

import {
    createDevtools,
} from '@ripl/devtools';

import {
    createRenderer,
    createScene,
} from '@ripl/web';

import type {
    Camera,
    CameraOptions,

    Context3D,
} from '@ripl/3d';

import type {
    Renderer,
    Scene,
} from '@ripl/web';

export function useRipl3DExample(onReady?: (scene: Scene<Context3D>, camera: Camera, renderer: Renderer) => void, cameraOptions?: CameraOptions) {
    const context = shallowRef<Context3D>();
    let animationId = 0;
    let currentScene: Scene<Context3D> | undefined;

    function contextChanged(ctx: Context3D) {
        cancelAnimationFrame(animationId);
        currentScene?.destroy();
        context.value = ctx;

        const scene = createScene(ctx) as Scene<Context3D>;
        currentScene = scene;

        const renderer = createRenderer(scene, {
            autoStop: false,
        });

        const camera = createCamera(ctx, {
            position: [0, 1.5, 5],
            target: [0, 0, 0],
            fov: 50,
            ...cameraOptions,
        });

        // Self-disposes when the scene is destroyed on the next context change/unmount.
        createDevtools(ctx, scene, renderer);

        camera.flush();
        onReady?.(scene, camera, renderer);
    }

    onUnmounted(() => {
        cancelAnimationFrame(animationId);
        currentScene?.destroy();
    });

    return {
        context,
        contextChanged,
        startRotation(camera: Camera, speed = 0.005) {
            let angle = 0;
            const radius = 5;
            const height = 1.5;

            const loop = () => {
                angle += speed;
                camera.position = [
                    Math.sin(angle) * radius,
                    height,
                    Math.cos(angle) * radius,
                ];
                camera.flush();

                animationId = requestAnimationFrame(loop);
            };

            loop();
        },
    };
}
