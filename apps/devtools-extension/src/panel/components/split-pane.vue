<template>
    <div ref="container" class="split-pane" :class="`split-pane--${orientation}`">
        <div class="split-pane__pane" :style="paneStyle">
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
    computed,
    ref,
} from 'vue';

import {
    numberClamp,
} from '@ripl/utilities';

const MIN_RATIO = 0.2;
const MAX_RATIO = 0.85;

const props = withDefaults(defineProps<{
    /** Whether the panes sit side by side or stacked. */
    orientation?: 'horizontal' | 'vertical';
    /** localStorage key the pane ratio is persisted under. */
    storageKey?: string;
    /** Ratio used before the user has dragged the divider. */
    defaultRatio?: number;
}>(), {
    orientation: 'horizontal',
    storageKey: 'ripl-devtools:split-ratio',
    defaultRatio: 0.66,
});

function clampRatio(value: number): number {
    return numberClamp(value, MIN_RATIO, MAX_RATIO);
}

function readRatio(): number {
    const stored = Number.parseFloat(localStorage.getItem(props.storageKey) ?? '');

    return Number.isNaN(stored) ? clampRatio(props.defaultRatio) : clampRatio(stored);
}

const container = ref<HTMLElement | null>(null);
const ratio = ref(readRatio());
const dragging = ref(false);

const isVertical = computed(() => props.orientation === 'vertical');

const paneStyle = computed(() => {
    const size = `${ratio.value * 100}%`;

    return isVertical.value ? {
        height: size,
    } : {
        width: size,
    };
});

function onPointerDown(event: PointerEvent): void {
    dragging.value = true;
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
}

function onPointerMove(event: PointerEvent): void {
    if (!dragging.value || !container.value) {
        return;
    }

    const rect = container.value.getBoundingClientRect();

    const extent = isVertical.value ? rect.height : rect.width;
    const offset = isVertical.value ? event.clientY - rect.top : event.clientX - rect.left;

    if (extent > 0) {
        ratio.value = clampRatio(offset / extent);
    }
}

function onPointerUp(): void {
    if (!dragging.value) {
        return;
    }

    dragging.value = false;
    localStorage.setItem(props.storageKey, ratio.value.toFixed(4));
}
</script>

<style scoped>
.split-pane {
    display: flex;
    height: 100%;
    min-height: 0;
}

.split-pane--vertical {
    flex-direction: column;
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

.split-pane--vertical .split-pane__divider {
    width: auto;
    height: 5px;
    margin: -2px 0;
    cursor: row-resize;
    border-left: none;
    border-right: none;
    border-top: 2px solid transparent;
    border-bottom: 2px solid transparent;
}

.split-pane__divider:hover,
.split-pane__divider--active {
    background-color: var(--ripl-accent);
}
</style>
