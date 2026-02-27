<template>
    <select
        class="ripl-select"
        :value="modelValue"
        @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
        <slot></slot>
    </select>
</template>

<script lang="ts" setup>
defineProps<{
    modelValue: string;
}>();

defineEmits<{
    'update:modelValue': [value: string];
}>();
</script>
