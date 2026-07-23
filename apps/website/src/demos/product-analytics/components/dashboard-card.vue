<template>
    <div class="dashboard-card">
        <div class="dashboard-card__header" v-if="title || $slots.actions">
            <h3 class="dashboard-card__title" v-if="title">{{ title }}</h3>
            <div class="dashboard-card__actions" v-if="$slots.actions">
                <slot name="actions"></slot>
            </div>
        </div>
        <div class="dashboard-card__body">
            <slot></slot>
        </div>
    </div>
</template>

<script lang="ts" setup>
defineProps<{
    title?: string;
}>();
</script>
