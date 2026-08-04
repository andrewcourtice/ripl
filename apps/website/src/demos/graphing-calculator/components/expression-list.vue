<template>
    <div class="expression-list">
        <div class="expression-list__rows">
            <ExpressionRow
                v-for="(expression, index) in expressions"
                :key="expression.id"
                :expression="expression"
                :index="index"
                @update:source="onPatch(expression.id, { source: $event })"
                @update:visible="onPatch(expression.id, { visible: $event })"
                @update:color="onPatch(expression.id, { color: $event })"
                @remove="$emit('remove', expression.id)"
            />
            <p v-if="!expressions.length" class="expression-list__empty">
                Nothing plotted yet. Add an expression such as <code>y = sin(x)</code> to start.
            </p>
        </div>

        <div class="expression-list__actions">
            <RiplButton @click="$emit('add')">
                <Plus :size="14" />
                Add expression
            </RiplButton>
        </div>
    </div>
</template>

<script lang="ts" setup>
import ExpressionRow from './expression-row.vue';
import RiplButton from '../../../.vitepress/components/ripl-button.vue';

import {
    Plus,
} from 'lucide-vue-next';

import type {
    GraphExpression,
} from '../types';

/** A change to one expression, addressed by its stable id rather than its position. */
export interface ExpressionUpdate {
    /** The {@link GraphExpression.id} of the row that changed. */
    id: string;
    /** The fields to merge into that expression. */
    patch: Partial<GraphExpression>;
}

defineProps<{
    /** The expressions to render, in list order. */
    expressions: GraphExpression[];
}>();

const emit = defineEmits<{
    /** A row edited one of its fields. */
    'update:expression': [update: ExpressionUpdate];
    /** The user asked for a new, empty expression. */
    'add': [];
    /** The user asked to delete the expression with this id. */
    'remove': [id: string];
}>();

function onPatch(id: string, patch: Partial<GraphExpression>): void {
    emit('update:expression', {
        id,
        patch,
    });
}
</script>

<style scoped>
.expression-list {
    display: flex;
    flex-direction: column;
    min-height: 0;
}

.expression-list__rows {
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow-y: auto;
}

.expression-list__empty {
    margin: 0;
    padding: 1rem 0.75rem;
    font-size: 0.8125rem;
    line-height: 1.5;
    color: var(--vp-c-text-2);
}

.expression-list__empty code {
    font-family: var(--vp-font-family-mono);
    font-size: 0.75rem;
}

.expression-list__actions {
    padding: 0.625rem;
}

.expression-list__actions :deep(.ripl-button) {
    width: 100%;
}
</style>
