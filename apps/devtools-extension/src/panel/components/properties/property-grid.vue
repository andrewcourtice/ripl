<script setup lang="ts">
import PropertyRow from './property-row.vue';

import {
    useDevtoolsStore,
} from '../../composables/use-devtools-store';

import {
    computed,
} from 'vue';

const store = useDevtoolsStore();

const detail = computed(() => store.selectedDetail.value);

function commit(key: string, value: number | string | boolean | number[]): void {
    store.setSelectedProperty(key, value);
}
</script>

<template>
    <div class="property-grid">
        <template v-if="detail">
            <PropertyRow
                v-for="property of detail.properties"
                :key="property.key"
                :property="property"
                @commit="commit"
            />
            <div v-if="!detail.properties.length" class="property-grid__empty">No properties set</div>
        </template>
        <div v-else class="property-grid__empty">Loading…</div>
    </div>
</template>

<style scoped>
.property-grid {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: var(--ripl-space-1) 0 var(--ripl-space-2);
}

.property-grid__empty {
    padding: 12px 8px;
    color: var(--ripl-text-dim);
    font-size: 11px;
    text-align: center;
}
</style>
