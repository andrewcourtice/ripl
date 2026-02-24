<template>
    <div class="dashboard-card">
        <div class="dashboard-card__header" v-if="title || $slots.actions">
            <h3 class="dashboard-card__title" v-if="title">{{ title }}</h3>
            <div class="dashboard-card__actions" v-if="$slots.actions">
                <slot name="actions"></slot>
            </div>
        </div>
        <div class="dashboard-card__body" :class="{ 'dashboard-card__body--loading': loading }">
            <slot></slot>
            <div class="dashboard-card__loading" v-if="loading">
                <div class="dashboard-card__spinner"></div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
defineProps<{
    title?: string;
    loading?: boolean;
}>();
</script>
