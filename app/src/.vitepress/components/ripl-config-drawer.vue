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
            class="ripl-config-drawer__panel"
            role="dialog"
            aria-label="Chart options"
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
withDefaults(defineProps<{
    modelValue: boolean;
    title?: string;
}>(), {
    title: 'Customize',
});

defineEmits<{
    'update:modelValue': [value: boolean];
}>();
</script>

<style scoped>
.ripl-config-drawer {
    position: absolute;
    inset: 0;
    z-index: 10;
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
    width: min(300px, 85%);
    background-color: var(--vp-c-bg);
    border-left: 1px solid var(--vp-c-divider);
    box-shadow: -4px 0 16px rgba(0, 0, 0, 0.08);
    transform: translateX(100%);
    transition: transform 220ms ease-out;
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
    padding: 0.75rem 1rem;
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
    padding: 1rem;
}
</style>
