<template>
    <div class="freeform-zoom">
        <button
            class="freeform-zoom__button"
            title="Undo (⌘Z)"
            :disabled="!canUndo"
            @click="$emit('action', 'undo')"
        >
            <Undo2 :size="16" />
        </button>
        <button
            class="freeform-zoom__button"
            title="Redo (⌘⇧Z)"
            :disabled="!canRedo"
            @click="$emit('action', 'redo')"
        >
            <Redo2 :size="16" />
        </button>

        <span class="freeform-zoom__divider"></span>

        <button class="freeform-zoom__button" title="Zoom out" @click="$emit('action', 'zoom-out')">
            <ZoomOut :size="16" />
        </button>
        <button class="freeform-zoom__readout" title="Reset to 100%" @click="$emit('action', 'reset')">
            {{ Math.round(zoom * 100) }}%
        </button>
        <button class="freeform-zoom__button" title="Zoom in" @click="$emit('action', 'zoom-in')">
            <ZoomIn :size="16" />
        </button>
        <button class="freeform-zoom__button" title="Fit to content" @click="$emit('action', 'fit')">
            <Maximize :size="16" />
        </button>

        <span class="freeform-zoom__divider"></span>

        <button class="freeform-zoom__button" title="Export PNG" @click="$emit('action', 'png')">
            <Image :size="16" />
        </button>
        <button class="freeform-zoom__button" title="Export SVG" @click="$emit('action', 'svg')">
            <FileCode :size="16" />
        </button>
        <button class="freeform-zoom__button" title="Add 5,000 shapes (stress test)" @click="$emit('action', 'stress')">
            <Boxes :size="16" />
        </button>
        <button class="freeform-zoom__button freeform-zoom__button--danger" title="Clear canvas" @click="$emit('action', 'clear')">
            <Trash2 :size="16" />
        </button>
    </div>
</template>

<script lang="ts" setup>
import {
    Boxes,
    FileCode,
    Image,
    Maximize,
    Redo2,
    Trash2,
    Undo2,
    ZoomIn,
    ZoomOut,
} from 'lucide-vue-next';

/** The set of actions the zoom bar can request. */
export type ZoomBarAction = 'undo'
| 'redo'
| 'zoom-in'
| 'zoom-out'
| 'fit'
| 'reset'
| 'png'
| 'svg'
| 'stress'
| 'clear';

defineProps<{
    zoom: number;
    canUndo: boolean;
    canRedo: boolean;
}>();

defineEmits<{
    action: [action: ZoomBarAction];
}>();
</script>

<style scoped>
.freeform-zoom {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 5px;
    border-radius: 12px;
    background: var(--vp-c-bg);
    border: 1px solid var(--vp-c-divider);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.18);
}

.freeform-zoom__button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 8px;
    color: var(--vp-c-text-2);
    background: transparent;
    cursor: pointer;
    transition: background-color 0.15s, color 0.15s;
}

.freeform-zoom__button:hover:not(:disabled) {
    background: var(--vp-c-default-soft);
    color: var(--vp-c-text-1);
}

.freeform-zoom__button:disabled {
    opacity: 0.4;
    cursor: default;
}

.freeform-zoom__button--danger:hover:not(:disabled) {
    color: var(--vp-c-danger-1);
}

.freeform-zoom__readout {
    min-width: 52px;
    height: 32px;
    padding: 0 8px;
    border: none;
    border-radius: 8px;
    font-size: 0.8125rem;
    font-variant-numeric: tabular-nums;
    color: var(--vp-c-text-1);
    background: transparent;
    cursor: pointer;
}

.freeform-zoom__readout:hover {
    background: var(--vp-c-default-soft);
}

.freeform-zoom__divider {
    width: 1px;
    height: 20px;
    margin: 0 4px;
    background: var(--vp-c-divider);
}
</style>
