<template>
    <div class="filter-bar">
        <input
            class="filter-bar__query"
            type="search"
            spellcheck="false"
            autocomplete="off"
            :placeholder="placeholder"
            :value="query"
            @input="emit('update:query', ($event.target as HTMLInputElement).value)"
        >
        <select
            class="filter-bar__type"
            :value="type"
            @change="emit('update:type', ($event.target as HTMLSelectElement).value)"
        >
            <option value="">All types</option>
            <option v-for="option of types" :key="option" :value="option">{{ option }}</option>
        </select>
        <button
            v-if="query || type"
            class="filter-bar__clear"
            type="button"
            title="Clear filters"
            aria-label="Clear filters"
            @click="clear"
        >×</button>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    /** The current free-text query. */
    query: string;
    /** The currently selected type, or an empty string for all types. */
    type: string;
    /** The types available to filter by, in display order. */
    types: string[];
    /** Placeholder shown in the search field. */
    placeholder: string;
}>();

const emit = defineEmits<{
    (event: 'update:query', value: string): void;
    (event: 'update:type', value: string): void;
}>();

function clear(): void {
    emit('update:query', '');
    emit('update:type', '');
}
</script>

<style scoped>
.filter-bar {
    display: flex;
    align-items: center;
    gap: var(--ripl-space-1);
    min-width: 0;
}

.filter-bar__query {
    flex: 1;
    min-width: 0;
    font-size: 11px;
}

.filter-bar__type {
    flex: none;
    max-width: 96px;
    font-size: 11px;
}

.filter-bar__clear {
    flex: none;
    width: 18px;
    height: 18px;
    padding: 0;
    border: none;
    border-radius: 3px;
    background: transparent;
    color: var(--ripl-text-dim);
    font-size: 14px;
    line-height: 1;
    cursor: pointer;
}

.filter-bar__clear:hover {
    background: var(--ripl-hover);
    color: var(--ripl-text);
}
</style>
