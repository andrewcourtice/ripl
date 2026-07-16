<template>
    <div class="freeform-toolbar">
        <button
            v-for="tool in tools"
            :key="tool.id"
            class="freeform-toolbar__button"
            :class="{ 'freeform-toolbar__button--active': tool.id === activeTool }"
            :title="`${tool.label} (${tool.key})`"
            @click="$emit('select', tool.id)"
        >
            <component :is="tool.icon" :size="18" />
        </button>
    </div>
</template>

<script lang="ts" setup>
import type {
    ToolId,
} from '../editor/constants';

import {
    Circle,
    Eraser,
    Hand,
    Highlighter,
    Minus,
    MousePointer2,
    PenTool,
    Pencil,
    Spline,
    Square,
    Type,
} from 'lucide-vue-next';

import type {
    Component,
} from 'vue';

interface ToolButton {
    id: ToolId;
    label: string;
    key: string;
    icon: Component;
}

defineProps<{
    activeTool: ToolId;
}>();

defineEmits<{
    select: [tool: ToolId];
}>();

const tools: ToolButton[] = [
    { id: 'select', label: 'Select', key: 'V', icon: MousePointer2 },
    { id: 'hand', label: 'Pan', key: 'H', icon: Hand },
    { id: 'pencil', label: 'Pencil', key: 'P', icon: Pencil },
    { id: 'pen', label: 'Pen', key: 'N', icon: PenTool },
    { id: 'highlighter', label: 'Highlighter', key: 'I', icon: Highlighter },
    { id: 'rect', label: 'Rectangle', key: 'R', icon: Square },
    { id: 'ellipse', label: 'Ellipse', key: 'O', icon: Circle },
    { id: 'line', label: 'Line', key: 'L', icon: Minus },
    { id: 'connector', label: 'Connector', key: 'C', icon: Spline },
    { id: 'text', label: 'Text', key: 'T', icon: Type },
    { id: 'eraser', label: 'Eraser', key: 'E', icon: Eraser },
];
</script>

<style scoped>
.freeform-toolbar {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 6px;
    border-radius: 14px;
    background: var(--vp-c-bg);
    border: 1px solid var(--vp-c-divider);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.18);
}

.freeform-toolbar__button {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border: none;
    border-radius: 10px;
    color: var(--vp-c-text-2);
    background: transparent;
    cursor: pointer;
    transition: background-color 0.15s, color 0.15s;
}

.freeform-toolbar__button:hover {
    background: var(--vp-c-default-soft);
    color: var(--vp-c-text-1);
}

.freeform-toolbar__button--active {
    background: var(--vp-c-brand-1);
    color: #ffffff;
}

.freeform-toolbar__button--active:hover {
    background: var(--vp-c-brand-1);
    color: #ffffff;
}
</style>
