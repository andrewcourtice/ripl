<template>
    <div ref="container" class="split-pane">
        <div class="split-pane__pane" :style="{ width: `${ratio * 100}%` }">
            <slot name="left" />
        </div>
        <div
            class="split-pane__divider"
            :class="{ 'split-pane__divider--active': dragging }"
            @pointerdown="onPointerDown"
            @pointermove="onPointerMove"
            @pointerup="onPointerUp"
            @pointercancel="onPointerUp"
        ></div>
        <div class="split-pane__pane split-pane__pane--fill">
            <slot name="right" />
        </div>
    </div>
</template>

<script setup lang="ts">
import {
    ref,
} from 'vue';

const STORAGE_KEY = 'ripl-devtools:split-ratio';
const DEFAULT_RATIO = 0.66;
const MIN_RATIO = 0.2;
const MAX_RATIO = 0.85;

function clampRatio(value: number): number {
    return Math.min(MAX_RATIO, Math.max(MIN_RATIO, value));
}

function readRatio(): number {
    const stored = Number.parseFloat(localStorage.getItem(STORAGE_KEY) ?? '');

    return Number.isNaN(stored) ? DEFAULT_RATIO : clampRatio(stored);
}

const container = ref<HTMLElement | null>(null);
const ratio = ref(readRatio());
const dragging = ref(false);

function onPointerDown(event: PointerEvent): void {
    dragging.value = true;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
}

function onPointerMove(event: PointerEvent): void {
    if (!dragging.value || !container.value) {
        return;
    }

    const rect = container.value.getBoundingClientRect();

    if (rect.width > 0) {
        ratio.value = clampRatio((event.clientX - rect.left) / rect.width);
    }
}

function onPointerUp(): void {
    if (!dragging.value) {
        return;
    }

    dragging.value = false;
    localStorage.setItem(STORAGE_KEY, ratio.value.toFixed(4));
}
</script>

<style scoped>
.split-pane {
    display: flex;
    height: 100%;
    min-height: 0;
}

.split-pane__pane {
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.split-pane__pane--fill {
    flex: 1;
}

.split-pane__divider {
    flex: none;
    width: 5px;
    margin: 0 -2px;
    z-index: 5;
    cursor: col-resize;
    background: transparent;
    border-left: 2px solid transparent;
    border-right: 2px solid transparent;
    background-clip: padding-box;
    background-color: var(--ripl-border);
}

.split-pane__divider:hover,
.split-pane__divider--active {
    background-color: var(--ripl-accent);
}
</style>
