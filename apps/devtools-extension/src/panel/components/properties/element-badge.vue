<template>
    <span class="element-badge">
        <span class="element-badge__tag">{{ elementType }}</span>
        <template v-if="docsUrl">
            <span class="element-badge__chip">Built-in</span>
            <a
                class="element-badge__docs"
                :href="docsUrl"
                target="_blank"
                rel="noreferrer"
                :title="`${elementType} documentation`"
                :aria-label="`${elementType} documentation`"
            >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <path d="M15 3h6v6" />
                    <path d="M10 14 21 3" />
                </svg>
            </a>
        </template>
    </span>
</template>

<script setup lang="ts">
import {
    getElementDocsUrl,
} from '../../../shared/elements';

import {
    computed,
} from 'vue';

const props = defineProps<{
    elementType: string;
}>();

const docsUrl = computed(() => getElementDocsUrl(props.elementType));
</script>

<style scoped>
.element-badge {
    display: flex;
    align-items: center;
    gap: var(--ripl-space-1);
    text-transform: none;
    letter-spacing: normal;
}

.element-badge__tag {
    font-family: ui-monospace, Menlo, Consolas, monospace;
    font-size: 11px;
    color: var(--ripl-tag);
}

.element-badge__chip {
    padding: 0 6px;
    border-radius: 8px;
    font-size: 10px;
    font-weight: 500;
    color: var(--ripl-text-dim);
    background: var(--ripl-hover);
}

.element-badge__docs {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 3px;
    color: var(--ripl-text-dim);
}

.element-badge__docs:hover {
    background: var(--ripl-hover);
    color: var(--ripl-accent);
}

.element-badge__docs svg {
    width: 11px;
    height: 11px;
}
</style>
