import {
    onUnmounted,
    shallowRef,
} from 'vue';

import {
    Context3D,
    createCamera,
} from '@ripl/3d';

import type {
    Camera,
    CameraOptions,
} from '@ripl/3d';

import type {
    Scene,
} from '@ripl/core';

export function useRipl3DExample(onReady?: (context: Context3D, camera: Camera) => void, cameraOptions?: CameraOptions) {
    const context = shallowRef<Context3D>();
    let animationId = 0;

    function contextChanged(ctx: Context3D) {
        cancelAnimationFrame(animationId);
        context.value?.destroy();
        context.value = ctx;

        const mockScene = {
            context: ctx,
        } as unknown as Scene;

        const camera = createCamera(mockScene, {
            position: [0, 1.5, 5],
            target: [0, 0, 0],
            fov: 50,
            ...cameraOptions,
        });

        camera.flush();
        onReady?.(ctx, camera);
    }

    onUnmounted(() => {
        cancelAnimationFrame(animationId);
        context.value?.destroy();
    });

    return {
        context,
        contextChanged,
        startRotation(camera: Camera, ctx: Context3D, renderFn: () => void, speed = 0.005) {
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

                ctx.clear();
                ctx.markRenderStart();
                renderFn();
                ctx.markRenderEnd();

                animationId = requestAnimationFrame(loop);
            };

            loop();
        },
        startInteractive(camera: Camera, ctx: Context3D, renderFn: () => void) {
            const loop = () => {
                camera.flush();
                ctx.clear();
                ctx.markRenderStart();
                renderFn();
                ctx.markRenderEnd();
                animationId = requestAnimationFrame(loop);
            };

            loop();
        },
    };
}
