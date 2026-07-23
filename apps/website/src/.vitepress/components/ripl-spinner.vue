<template>
    <div
        class="ripl-spinner"
        :class="{ 'ripl-spinner--overlay': overlay }"
        role="status"
        aria-live="polite"
    >
        <span class="ripl-spinner__circle" aria-hidden="true"></span>
        <span v-if="label" class="ripl-spinner__label">{{ label }}</span>
        <span v-else class="ripl-spinner__sr">Loading…</span>
    </div>
</template>

<script lang="ts" setup>
withDefaults(defineProps<{
    label?: string;
    overlay?: boolean;
}>(), {
    label: '',
    overlay: false,
});
</script>

<style scoped>
.ripl-spinner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    color: var(--vp-c-text-2);
}

.ripl-spinner--overlay {
    position: absolute;
    inset: 0;
    z-index: 2;
    background-color: var(--vp-c-bg-soft);
}

.ripl-spinner__circle {
    width: 1.75rem;
    height: 1.75rem;
    border: 2px solid var(--vp-c-divider);
    border-top-color: var(--vp-c-brand-1);
    border-radius: 50%;
    animation: ripl-spinner-rotate 0.7s linear infinite;
}

.ripl-spinner__label {
    font-size: 0.8125rem;
}

.ripl-spinner__sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
    white-space: nowrap;
}

@keyframes ripl-spinner-rotate {
    to {
        transform: rotate(360deg);
    }
}

@media (prefers-reduced-motion: reduce) {
    .ripl-spinner__circle {
        animation-duration: 2s;
    }
}
</style>
