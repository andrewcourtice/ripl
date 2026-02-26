<template>
    <div class="mermaid-demo">
        <div class="mermaid-demo__header">
            <h1 class="mermaid-demo__title">Mermaid Diagram Renderer</h1>
            <p class="mermaid-demo__subtitle">Parse Mermaid flowchart syntax and render with Ripl elements</p>
        </div>
        <div class="mermaid-demo__body">
            <div class="mermaid-demo__editor">
                <label class="mermaid-demo__label">Mermaid Source</label>
                <textarea
                    class="mermaid-demo__textarea"
                    v-model="source"
                    spellcheck="false"
                    @input="onInput"
                ></textarea>
            </div>
            <div class="mermaid-demo__canvas" ref="canvasContainer"></div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import {
    ref,
    onMounted,
    onUnmounted,
} from 'vue';

import {
    createScene,
    createRenderer,
} from '@ripl/core';

import type {
    Scene,
    Renderer,
} from '@ripl/core';

import { parseMermaid } from './parser';
import { computeLayout } from './layout';
import { renderDiagram } from './renderer';

const EXAMPLE_SOURCE = `graph TD
    A[Start] --> B{Is it working?}
    B -->|Yes| C((Great))
    B -->|No| D[Debug]
    D --> E(Review Code)
    E --> F{Fixed?}
    F -->|Yes| C
    F -->|No| G[Ask for Help]
    G --> D
    C --> H[Ship It]`;

const canvasContainer = ref<HTMLElement>();
const source = ref(EXAMPLE_SOURCE);

let scene: Scene | undefined;
let renderer: Renderer | undefined;
let debounceTimer: ReturnType<typeof setTimeout> | undefined;

function renderFromSource() {
    if (!scene || !renderer) return;

    try {
        const ir = parseMermaid(source.value);
        const layout = computeLayout(ir);
        renderDiagram(scene, renderer, layout);
    } catch (e) {
        console.warn('Mermaid parse error:', e);
    }
}

function onInput() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(renderFromSource, 400);
}

onMounted(() => {
    if (!canvasContainer.value) return;

    scene = createScene(canvasContainer.value);
    renderer = createRenderer(scene, {
        autoStart: true,
        autoStop: false,
    });

    scene.on('resize', () => renderFromSource());

    renderFromSource();
});

onUnmounted(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    renderer?.destroy();
    scene?.destroy();
});
</script>
