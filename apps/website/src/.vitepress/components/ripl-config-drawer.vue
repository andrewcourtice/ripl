<template>
    <div
        class="ripl-config-drawer"
        :class="{ 'ripl-config-drawer--open': modelValue }"
    >
        <div
            class="ripl-config-drawer__overlay"
            @click="$emit('update:modelValue', false)"
        ></div>
        <aside
            ref="panel"
            class="ripl-config-drawer__panel"
            role="dialog"
            tabindex="-1"
            :aria-label="title"
        >
            <header class="ripl-config-drawer__header">
                <span class="ripl-config-drawer__title">{{ title }}</span>
                <button
                    class="ripl-config-drawer__close"
                    type="button"
                    aria-label="Close"
                    @click="$emit('update:modelValue', false)"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 6 6 18M6 6l12 12" />
                    </svg>
                </button>
            </header>
            <div class="ripl-config-drawer__body">
                <slot></slot>
            </div>
        </aside>
    </div>
</template>

<script lang="ts" setup>
import {
    nextTick,
    onBeforeUnmount,
    ref,
    watch,
} from 'vue';

const props = withDefaults(defineProps<{
    /** Whether the drawer is open. */
    modelValue: boolean;
    /** Heading shown in the drawer, and the dialog's accessible name. */
    title?: string;
}>(), {
    title: 'Customize',
});

const emit = defineEmits<{
    /** The drawer was opened or dismissed. */
    'update:modelValue': [value: boolean];
}>();

const panel = ref<HTMLElement | null>(null);

let previouslyFocused: HTMLElement | null = null;

function onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
        emit('update:modelValue', false);
    }
}

watch(() => props.modelValue, async open => {
    if (open) {
        previouslyFocused = document.activeElement as HTMLElement | null;
        window.addEventListener('keydown', onKeydown);
        await nextTick();

        // The panel is still translated off-screen mid-transition, so a scrolling focus drags the
        // page across to meet it and the slide-in plays on the content instead of the drawer.
        panel.value?.focus({ preventScroll: true });

        return;
    }

    window.removeEventListener('keydown', onKeydown);
    previouslyFocused?.focus();
    previouslyFocused = null;
});

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
</script>

<style scoped>
.ripl-config-drawer {
    position: absolute;
    inset: 0;
    z-index: var(--ripl-drawer-z, 10);
    pointer-events: none;
}

.ripl-config-drawer__overlay {
    position: absolute;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.25);
    opacity: 0;
    transition: opacity 200ms ease-out;
}

.ripl-config-drawer__panel {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    width: var(--ripl-drawer-width, min(340px, 92%));
    background-color: var(--vp-c-bg);
    border-left: 1px solid var(--vp-c-divider);
    box-shadow: -4px 0 16px rgba(0, 0, 0, 0.08);
    transform: translateX(100%);
    transition: transform 220ms ease-out;
}

/* Focused only to move the keyboard into the dialog; it is not tabbable, so it shows no ring. */
.ripl-config-drawer__panel:focus {
    outline: none;
}

.ripl-config-drawer--open {
    pointer-events: auto;
}

.ripl-config-drawer--open .ripl-config-drawer__overlay {
    opacity: 1;
}

.ripl-config-drawer--open .ripl-config-drawer__panel {
    transform: translateX(0);
}

.ripl-config-drawer__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px var(--ripl-panel-pad, 16px);
    border-bottom: 1px solid var(--vp-c-divider);
}

.ripl-config-drawer__title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--vp-c-text-1);
}

.ripl-config-drawer__close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.25rem;
    color: var(--vp-c-text-2);
    border: none;
    border-radius: 0.375rem;
    background: none;
    cursor: pointer;
    transition: color 150ms ease-out, background-color 150ms ease-out;
}

.ripl-config-drawer__close:hover {
    color: var(--vp-c-text-1);
    background-color: var(--vp-c-default-soft);
}

.ripl-config-drawer__body {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0;
}
</style>
