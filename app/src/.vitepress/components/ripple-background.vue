<template>
    <div ref="container" class="ripple-background"></div>
</template>

<script lang="ts" setup>
import {
    onMounted,
    onBeforeUnmount,
    ref,
} from 'vue';

import {
    createCircle,
    createRenderer,
    createScene,
} from '@ripl/core';

import type {
    Circle,
    Renderer,
    Scene,
} from '@ripl/core';

const container = ref<HTMLElement>();

let scene: Scene | undefined;
let renderer: Renderer | undefined;
let intervalId: ReturnType<typeof setInterval> | undefined;

const RING_COUNT = 4;
const RING_DELAY = 250;

function spawnRipple() {
    if (!scene || !renderer) {
        return;
    }

    const width = scene.width;
    const height = scene.height;

    const cx = Math.random() * width;
    const cy = height * 0.7 + Math.random() * height * 0.3;
    const baseMaxRadius = 250 + Math.random() * 200;

    for (let i = 0; i < RING_COUNT; i++) {
        const circle = createCircle({
            cx,
            cy,
            radius: 0,
            autoFill: false,
            strokeStyle: 'rgba(40, 120, 220, 0.2)',
            lineWidth: 1.5,
            globalAlpha: 1,
        });

        scene.add(circle);

        renderer.transition(circle, {
            duration: 4000,
            delay: i * RING_DELAY,
            state: {
                radius: baseMaxRadius + i * 30,
                globalAlpha: 0,
            },
            onComplete() {
                scene?.remove(circle);
                circle.destroy();
            },
        });
    }
}

onMounted(() => {
    if (!container.value) {
        return;
    }

    scene = createScene(container.value);
    renderer = createRenderer(scene, {
        autoStop: false,
    });

    spawnRipple();

    intervalId = setInterval(() => {
        spawnRipple();
    }, 3000);
});

onBeforeUnmount(() => {
    if (intervalId) {
        clearInterval(intervalId);
    }

    renderer?.destroy();
    scene?.destroy();
});
</script>

<style scoped>
.ripple-background {
    position: fixed;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    overflow: hidden;
}
</style>
