<template>
    <input
        type="range"
        class="ripl-input-range"
        :value="modelValue"
        :min="min"
        :max="max"
        :step="step"
        @input="$emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
    >
</template>

<script lang="ts" setup>
defineProps<{
    modelValue: number;
    min?: number;
    max?: number;
    step?: number;
}>();

defineEmits<{
    'update:modelValue': [value: number];
}>();
</script>
