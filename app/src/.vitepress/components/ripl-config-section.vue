<template>
    <section class="ripl-config-section" :class="{ 'ripl-config-section--open': open }">
        <button
            class="ripl-config-section__header"
            type="button"
            :aria-expanded="open"
            :aria-controls="bodyId"
            @click="open = !open"
        >
            <span class="ripl-config-section__title">{{ title }}</span>
            <svg
                class="ripl-config-section__chevron"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                aria-hidden="true"
            >
                <path d="m9 18 6-6-6-6" />
            </svg>
        </button>
        <div v-show="open" :id="bodyId" class="ripl-config-section__body">
            <slot></slot>
        </div>
    </section>
</template>

<script lang="ts" setup>
import {
    ref,
    useId,
} from 'vue';

const props = withDefaults(defineProps<{
    /** Section heading shown in the accordion header. */
    title: string;
    /** Whether the section starts expanded. Defaults to `true`. */
    defaultOpen?: boolean;
}>(), {
    defaultOpen: true,
});

const open = ref(props.defaultOpen);
const bodyId = useId();
</script>

<style scoped>
.ripl-config-section {
    border-bottom: 1px solid var(--ripl-panel-rule, var(--vp-c-divider));
}

.ripl-config-section__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: 10px var(--ripl-panel-pad, 16px);
    border: none;
    background: none;
    cursor: pointer;
    transition: background-color 150ms ease-out;
}

.ripl-config-section__header:hover {
    background-color: var(--vp-c-default-soft);
}

.ripl-config-section__title {
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--ripl-panel-heading, var(--vp-c-text-3));
}

.ripl-config-section__chevron {
    flex-shrink: 0;
    color: var(--vp-c-text-3);
    transition: transform 180ms ease-out;
}

.ripl-config-section--open .ripl-config-section__chevron {
    transform: rotate(90deg);
}

.ripl-config-section__body {
    display: flex;
    flex-direction: column;
    gap: var(--ripl-panel-gap, 8px);
    padding: 0 var(--ripl-panel-pad, 16px) var(--ripl-panel-body-pad-y, 14px);
}
</style>
