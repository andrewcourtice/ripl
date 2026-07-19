<script setup lang="ts">
import {
    getNodeAttributes,
} from '../../composables/use-tree';

import type {
    TreeRow,
} from '../../composables/use-tree';

import {
    computed,
} from 'vue';

const props = defineProps<{
    row: TreeRow;
    selected: boolean;
}>();

const emit = defineEmits<{
    (event: 'select'): void;
    (event: 'toggle'): void;
    (event: 'hover'): void;
    (event: 'leave'): void;
}>();

const attributes = computed(() => {
    if (props.row.kind === 'close') {
        return [];
    }

    return getNodeAttributes(props.row.node);
});

const indent = computed(() => `${props.row.depth * 12 + 4}px`);
</script>

<template>
    <div
        class="tree-node"
        :class="{ 'tree-node--selected': selected }"
        :style="{ paddingLeft: indent }"
        @click="emit('select')"
        @dblclick="emit('toggle')"
        @mouseenter="emit('hover')"
        @mouseleave="emit('leave')"
    >
        <span
            v-if="row.hasChildren && row.kind !== 'close'"
            class="tree-node__chevron"
            @click.stop="emit('toggle')"
        >{{ row.kind === 'open' ? '▾' : '▸' }}</span>
        <span v-else class="tree-node__chevron tree-node__chevron--spacer"></span>
        <template v-if="row.kind === 'close'">
            <span class="tree-node__bracket">&lt;/</span><span class="tree-node__tag">{{ row.node.elementType }}</span><span class="tree-node__bracket">&gt;</span>
        </template>
        <template v-else>
            <span class="tree-node__bracket">&lt;</span><span class="tree-node__tag">{{ row.node.elementType }}</span><template
                v-for="attribute of attributes"
                :key="attribute.key"
            ><span> </span><span class="tree-node__attr-name">{{ attribute.key }}</span><span class="tree-node__bracket">="</span><span class="tree-node__attr-value">{{ attribute.value }}</span><span class="tree-node__bracket">"</span></template>
            <span v-if="row.kind === 'open'" class="tree-node__bracket">&gt;</span>
            <template v-else-if="row.hasChildren">
                <span class="tree-node__bracket">&gt;</span><span class="tree-node__ellipsis">…</span><span class="tree-node__bracket">&lt;/</span><span class="tree-node__tag">{{ row.node.elementType }}</span><span class="tree-node__bracket">&gt;</span>
            </template>
            <span v-else class="tree-node__bracket"> /&gt;</span>
        </template>
    </div>
</template>

<style scoped>
.tree-node {
    display: flex;
    align-items: center;
    height: 18px;
    line-height: 18px;
    white-space: nowrap;
    cursor: default;
}

.tree-node:hover {
    background: var(--ripl-hover);
}

.tree-node--selected,
.tree-node--selected:hover {
    background: var(--ripl-selected);
}

.tree-node__chevron {
    flex: none;
    display: inline-block;
    width: 12px;
    color: var(--ripl-text-dim);
    font-size: 9px;
    text-align: center;
    cursor: pointer;
}

.tree-node__chevron--spacer {
    cursor: default;
}

.tree-node__bracket {
    color: var(--ripl-bracket);
}

.tree-node__tag {
    color: var(--ripl-tag);
}

.tree-node__attr-name {
    color: var(--ripl-attr-name);
}

.tree-node__attr-value {
    color: var(--ripl-attr-value);
}

.tree-node__ellipsis {
    color: var(--ripl-text-dim);
}
</style>
