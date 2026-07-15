<template>
    <div class="freeform">
        <div ref="hostEl" class="freeform__canvas"></div>

        <ToolBar
            class="freeform__toolbar"
            :active-tool="activeTool"
            @select="onSelectTool"
        />

        <StylePanel
            class="freeform__style"
            :style="style"
            :corner-radius="cornerRadius"
            @patch="onPatchStyle"
            @corner="onCornerRadius"
        />

        <ZoomBar
            class="freeform__zoom"
            :zoom="zoom"
            :can-undo="canUndo"
            :can-redo="canRedo"
            @action="onAction"
        />

        <div class="freeform__hint">
            Draw with the tools · scroll to zoom · space or middle-drag to pan · shift-drag to marquee-select
        </div>
    </div>
</template>

<script lang="ts" setup>
import ToolBar from './components/tool-bar.vue';

import StylePanel from './components/style-panel.vue';

import ZoomBar from './components/zoom-bar.vue';

import type {
    ZoomBarAction,
} from './components/zoom-bar.vue';

import {
    STRESS_TEST_COUNT,
} from './editor/constants';

import type {
    ToolId,
} from './editor/constants';

import {
    Editor,
} from './editor/editor';

import {
    exportPNG,
    exportSVG,
} from './editor/export';

import type {
    ShapeStyle,
} from './editor/model';

import {
    generateStressShapes,
} from './editor/stress';

import {
    onBeforeUnmount,
    onMounted,
    ref,
    shallowRef,
} from 'vue';

const hostEl = ref<HTMLElement | null>(null);
const editor = shallowRef<Editor | null>(null);

const activeTool = ref<ToolId>('select');
const style = ref<ShapeStyle>({
    stroke: '#e6edf3',
    fill: null,
    strokeWidth: 4,
    opacity: 1,
    dash: false,
});
const cornerRadius = ref(0);
const zoom = ref(1);
const canUndo = ref(false);
const canRedo = ref(false);

function sync(): void {
    const instance = editor.value;

    if (!instance) {
        return;
    }

    activeTool.value = instance.activeToolId;
    style.value = instance.style;
    cornerRadius.value = instance.cornerRadius;
    zoom.value = instance.zoom;
    canUndo.value = instance.canUndo;
    canRedo.value = instance.canRedo;
}

function onSelectTool(tool: ToolId): void {
    editor.value?.setTool(tool);
}

function onPatchStyle(patch: Partial<ShapeStyle>): void {
    editor.value?.setStyle(patch);
}

function onCornerRadius(radius: number): void {
    editor.value?.setCornerRadius(radius);
}

function onAction(action: ZoomBarAction): void {
    const instance = editor.value;

    if (!instance) {
        return;
    }

    const handlers: Record<ZoomBarAction, () => void> = {
        'undo': () => instance.undo(),
        'redo': () => instance.redo(),
        'zoom-in': () => instance.zoomBy(1.25),
        'zoom-out': () => instance.zoomBy(0.8),
        'fit': () => instance.fitContent(),
        'reset': () => instance.resetView(),
        'png': () => exportPNG(instance),
        'svg': () => exportSVG(instance),
        'stress': () => instance.insertMany(generateStressShapes(STRESS_TEST_COUNT)),
        'clear': () => instance.clear(),
    };

    handlers[action]();
}

function onKeyDown(event: KeyboardEvent): void {
    editor.value?.handleKeyDown(event);
}

function onKeyUp(event: KeyboardEvent): void {
    editor.value?.handleKeyUp(event);
}

onMounted(() => {
    if (!hostEl.value) {
        return;
    }

    const instance = new Editor(hostEl.value);

    instance.on('toolchange', sync);
    instance.on('stylechange', sync);
    instance.on('zoomchange', sync);
    instance.on('historychange', sync);
    instance.on('selectionchange', sync);
    instance.on('documentchange', sync);

    editor.value = instance;
    sync();

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
});

onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeyDown);
    window.removeEventListener('keyup', onKeyUp);
    editor.value?.destroy();
    editor.value = null;
});
</script>
