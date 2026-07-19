<script setup lang="ts">
import TreeNode from './tree-node.vue';

import {
    useDevtoolsStore,
} from '../../composables/use-devtools-store';

import {
    useTree,
} from '../../composables/use-tree';

import type {
    TreeRow,
} from '../../composables/use-tree';

import {
    useVirtualList,
} from '../../composables/use-virtual-list';

import {
    computed,
    ref,
} from 'vue';

// Must match the rendered `.tree-node` height (--ripl-row-height in theme.css).
const ROW_HEIGHT = 22;

const store = useDevtoolsStore();
const tree = useTree(store);

const viewport = ref<HTMLElement | null>(null);
const rowCount = computed(() => tree.rows.value.length);
const virtualList = useVirtualList(viewport, rowCount, ROW_HEIGHT);

const visibleRows = computed(() => {
    const {
        start,
        end,
    } = virtualList.range.value;

    return tree.rows.value.slice(start, end);
});

function isSelected(row: TreeRow): boolean {
    const selection = store.selection.value;

    return !!selection
        && selection.contextId === row.contextId
        && selection.elementId === row.node.id;
}

function selectRow(row: TreeRow): void {
    store.selectElement(row.contextId, row.node.id);
}

function toggleRow(row: TreeRow): void {
    if (row.hasChildren) {
        tree.toggleNode(row.node.id);
    }
}

function hoverRow(row: TreeRow): void {
    store.highlightElement(row.contextId, row.node.id);
}

function leaveRow(): void {
    store.clearHighlight();
}

function getSelectableRows(): TreeRow[] {
    return tree.rows.value.filter(row => row.kind !== 'close');
}

function getSelectedIndex(rows: TreeRow[]): number {
    const selection = store.selection.value;

    if (!selection) {
        return -1;
    }

    return rows.findIndex(row => row.contextId === selection.contextId && row.node.id === selection.elementId);
}

function scrollRowIntoView(row: TreeRow): void {
    const element = viewport.value;
    const index = tree.rows.value.findIndex(item => item.key === row.key);

    if (!element || index < 0) {
        return;
    }

    const top = index * ROW_HEIGHT;
    const bottom = top + ROW_HEIGHT;

    if (top < element.scrollTop) {
        element.scrollTop = top;
    } else if (bottom > element.scrollTop + element.clientHeight) {
        element.scrollTop = bottom - element.clientHeight;
    }
}

function selectByOffset(offset: number): void {
    const rows = getSelectableRows();

    if (!rows.length) {
        return;
    }

    const index = getSelectedIndex(rows);
    const nextIndex = index < 0
        ? 0
        : Math.min(rows.length - 1, Math.max(0, index + offset));
    const row = rows[nextIndex];

    selectRow(row);
    scrollRowIntoView(row);
}

function expandSelected(): void {
    const rows = getSelectableRows();
    const row = rows[getSelectedIndex(rows)];

    if (row?.hasChildren && !row.expanded) {
        tree.expandNode(row.node.id);
    }
}

function collapseSelected(): void {
    const rows = getSelectableRows();
    const row = rows[getSelectedIndex(rows)];

    if (!row) {
        return;
    }

    if (row.expanded) {
        tree.collapseNode(row.node.id);
        return;
    }

    // Move the selection up to the parent when the node is already collapsed.
    if (row.node.parentId) {
        store.selectElement(row.contextId, row.node.parentId);
    }
}

function onKeydown(event: KeyboardEvent): void {
    const handlers: Record<string, () => void> = {
        ArrowDown: () => selectByOffset(1),
        ArrowUp: () => selectByOffset(-1),
        ArrowRight: expandSelected,
        ArrowLeft: collapseSelected,
    };

    const handler = handlers[event.key];

    if (handler) {
        event.preventDefault();
        handler();
    }
}
</script>

<template>
    <div
        ref="viewport"
        class="tree-view"
        tabindex="0"
        @scroll.passive="virtualList.onScroll"
        @keydown="onKeydown"
    >
        <div class="tree-view__spacer" :style="{ height: `${virtualList.range.value.topPad}px` }"></div>
        <TreeNode
            v-for="row of visibleRows"
            :key="row.key"
            :row="row"
            :selected="isSelected(row)"
            @select="selectRow(row)"
            @toggle="toggleRow(row)"
            @hover="hoverRow(row)"
            @leave="leaveRow"
        />
        <div class="tree-view__spacer" :style="{ height: `${virtualList.range.value.bottomPad}px` }"></div>
    </div>
</template>

<style scoped>
.tree-view {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: var(--ripl-space-1) 0;
    outline: none;
    font-family: ui-monospace, Menlo, Consolas, monospace;
    font-size: 11.5px;
}

.tree-view__spacer {
    flex: none;
}
</style>
