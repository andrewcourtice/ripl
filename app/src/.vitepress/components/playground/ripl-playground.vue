<template>
    <ClientOnly>
        <div class="playground">
            <div class="playground__left" :style="{ width: leftWidth + 'px' }">
                <PlaygroundEditor
                    v-model="code"
                    v-model:mode="mode"
                    v-model:import-map="riplImportMap"
                    @reset="resetCode"
                    @load-example="onLoadExample"
                />
            </div>
            <div
                class="playground__divider"
                @mousedown="onDividerMouseDown"
            ></div>
            <div class="playground__right" :class="{ 'playground__right--dragging': isDragging }">
                <PlaygroundPreview
                    :srcdoc="currentSrcdoc"
                    :mode="mode"
                    v-model:context-type="contextType"
                    v-model:settings="settings"
                />
            </div>
        </div>
    </ClientOnly>
</template>

<script lang="ts" setup>
import {
    ref,
    watch,
    onMounted,
    onBeforeUnmount,
} from 'vue';

import {
    useData,
} from 'vitepress';

import PlaygroundEditor from './playground-editor.vue';
import PlaygroundPreview from './playground-preview.vue';

import {
    buildSrcdoc,
    encodeState,
    decodeState,
} from './sandbox';

import {
    EXAMPLES,
} from './examples';

import type {
    PlaygroundMode,
    ContextType,
    PlaygroundSettings,
    PlaygroundState,
} from './sandbox';

const mode = ref<PlaygroundMode>('2d');
const contextType = ref<ContextType>('canvas');
const code = ref('');
const leftWidth = ref(0);
const currentSrcdoc = ref('');
const riplImportMap = ref<Record<string, string>>({});
const settings = ref<PlaygroundSettings>({
    autoStop: false,
    cameraInteractions: true,
    debugFps: false,
    debugElementCount: false,
    debugBoundingBoxes: false,
});

const { isDark } = useData();

let debounceTimer: ReturnType<typeof setTimeout> | undefined;
let renderTimer: ReturnType<typeof setTimeout> | undefined;
let loadingExample = false;
let manifestKeys = new Set<string>();
let pendingState: PlaygroundState | null = null;

function getDefaultCode(m: PlaygroundMode): string {
    return EXAMPLES.find(e => e.mode === m)!.code;
}

function loadStateFromHash(): PlaygroundState | null {
    if (typeof window === 'undefined') {
        return null;
    }

    const hash = window.location.hash.slice(1);

    if (!hash) {
        return null;
    }

    return decodeState(hash);
}

function getExtraImports(): Record<string, string> | undefined {
    const extra: Record<string, string> = {};

    for (const [pkg, url] of Object.entries(riplImportMap.value)) {
        if (!manifestKeys.has(pkg)) {
            extra[pkg] = url;
        }
    }

    return Object.keys(extra).length ? extra : undefined;
}

function saveToHash() {
    if (typeof window === 'undefined') {
        return;
    }

    const state: PlaygroundState = {
        code: code.value,
        mode: mode.value,
        contextType: contextType.value,
        extraImports: getExtraImports(),
    };

    const encoded = encodeState(state);

    if (encoded) {
        window.history.replaceState(null, '', '#' + encoded);
    }
}

function updateSrcdoc() {
    if (!Object.keys(riplImportMap.value).length) {
        return;
    }

    currentSrcdoc.value = buildSrcdoc(code.value, mode.value, contextType.value, riplImportMap.value, window.location.origin, settings.value, isDark.value);
}

function debouncedUpdate() {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(updateSrcdoc, 300);
}

function debouncedSave() {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => saveToHash(), 500);
}

watch(code, () => {
    debouncedUpdate();
    debouncedSave();
});

watch([contextType, riplImportMap], () => {
    updateSrcdoc();
    debouncedSave();
}, { deep: true });

watch([settings, isDark], () => {
    updateSrcdoc();
}, { deep: true });

watch(mode, (newMode) => {
    if (loadingExample) {
        loadingExample = false;
        return;
    }

    code.value = getDefaultCode(newMode);
    updateSrcdoc();
    debouncedSave();
});

function onLoadExample(example: { mode: string; code: string }) {
    loadingExample = true;
    mode.value = example.mode as PlaygroundMode;
    code.value = example.code;
    updateSrcdoc();
}

function resetCode() {
    mode.value = '2d';
    contextType.value = 'canvas';
    code.value = getDefaultCode('2d');

    const baseMap: Record<string, string> = {};

    for (const key of manifestKeys) {
        if (riplImportMap.value[key]) {
            baseMap[key] = riplImportMap.value[key];
        }
    }

    riplImportMap.value = baseMap;
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
}

const isDragging = ref(false);

function onDividerMouseDown(event: MouseEvent) {
    event.preventDefault();
    isDragging.value = true;
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
}

function onMouseMove(event: MouseEvent) {
    if (!isDragging.value) {
        return;
    }

    const minWidth = 200;
    const maxWidth = window.innerWidth - 200;
    leftWidth.value = Math.min(maxWidth, Math.max(minWidth, event.clientX));
}

function onMouseUp() {
    isDragging.value = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
}

async function loadImportMap() {
    try {
        const base = import.meta.env.BASE_URL || '/';
        const response = await fetch(base + '_playground/manifest.json');
        const manifest = await response.json();
        const importMap: Record<string, string> = {};

        for (const [pkg, entry] of Object.entries(manifest)) {
            const esm = (entry as { esm: string | null }).esm;

            if (esm) {
                importMap[pkg] = esm;
            }
        }

        manifestKeys = new Set(Object.keys(importMap));

        if (pendingState?.extraImports) {
            Object.assign(importMap, pendingState.extraImports);
            pendingState = null;
        }

        riplImportMap.value = importMap;
        updateSrcdoc();
    } catch {
        // manifest not available
    }
}

onMounted(() => {
    leftWidth.value = Math.round(window.innerWidth / 2);

    const savedState = loadStateFromHash();

    if (savedState) {
        mode.value = savedState.mode || '2d';
        contextType.value = savedState.contextType || 'canvas';
        code.value = savedState.code;
        pendingState = savedState;
    } else {
        code.value = getDefaultCode(mode.value);
    }

    loadImportMap();
});

onBeforeUnmount(() => {
    clearTimeout(debounceTimer);
    clearTimeout(renderTimer);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
});
</script>

<style lang="scss">
.playground {
    display: flex;
    height: calc(100vh - var(--vp-nav-height));
    overflow: hidden;
}

.playground__left {
    flex-shrink: 0;
    overflow: hidden;
}

.playground__divider {
    width: 4px;
    cursor: col-resize;
    background-color: var(--vp-c-divider);
    flex-shrink: 0;
    transition: background-color 150ms ease-out;

    &:hover {
        background-color: var(--vp-c-brand-1);
    }
}

.playground__right {
    flex: 1;
    min-width: 0;
    overflow: hidden;

    &--dragging {
        pointer-events: none;
    }
}
</style>
