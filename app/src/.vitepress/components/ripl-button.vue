<template>
    <button
        class="ripl-button"
        :class="{ 'ripl-button--active': active }"
        @click="$emit('click', $event)"
    >
        <slot></slot>
    </button>
</template>

<script lang="ts" setup>
defineProps<{
    active?: boolean;
}>();

defineEmits<{
    'click': [event: MouseEvent];
}>();
</script>
