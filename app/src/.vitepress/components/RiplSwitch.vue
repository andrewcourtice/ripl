<template>
    <label class="ripl-switch">
        <input
            type="checkbox"
            :checked="modelValue"
            @change="$emit('update:modelValue', !modelValue)"
        >
        <span class="ripl-switch__track">
            <span class="ripl-switch__thumb"></span>
        </span>
        <span v-if="label">{{ label }}</span>
        <slot v-else></slot>
    </label>
</template>

<script lang="ts" setup>
defineProps<{
    modelValue: boolean;
    label?: string;
}>();

defineEmits<{
    'update:modelValue': [value: boolean];
}>();
</script>
