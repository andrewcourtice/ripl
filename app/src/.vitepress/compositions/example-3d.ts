import {
    onUnmounted,
    shallowRef,
} from 'vue';

import {
    Context3D,
    createCamera,
    depthSort,
} from '@ripl/3d';

import {
    createScene,
    createRenderer,
} from '@ripl/core';

import type {
    Camera,
    CameraOptions,
} from '@ripl/3d';

import type {
    Scene,
    Renderer,
} from '@ripl/core';

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
            sortBuffer: depthSort(ctx),
        });

        const camera = createCamera(scene, {
            position: [0, 1.5, 5],
            target: [0, 0, 0],
            fov: 50,
            ...cameraOptions,
        });

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
