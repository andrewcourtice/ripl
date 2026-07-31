<template>
    <span class="ripl-input-range">
        <input
            type="range"
            class="ripl-input-range__slider"
            :value="modelValue"
            :min="min"
            :max="max"
            :step="step"
            @input="onInput"
        >
        <span class="ripl-input-range__value">{{ display }}</span>
    </span>
</template>

<script lang="ts" setup>
import {
    computed,
    onBeforeUnmount,
    ref,
    watch,
} from 'vue';

const props = withDefaults(defineProps<{
    modelValue: number;
    min?: number;
    max?: number;
    step?: number;
    /**
     * Milliseconds to hold back `update:modelValue` while the slider is being dragged. The first
     * change in a gesture is emitted immediately, so a click or a keyboard step still applies at
     * once; subsequent changes coalesce onto the trailing edge. Set `0` to emit every step.
     */
    debounce?: number;
}>(), {
    min: undefined,
    max: undefined,
    step: undefined,
    debounce: 120,
});

const emit = defineEmits<{
    'update:modelValue': [value: number];
}>();

// Each `input` costs a `chart.update()` and a full render, so throttle the emit; the thumb and readout stay live.
const dragged = ref<number>();
const display = computed(() => dragged.value ?? props.modelValue);

let timer: ReturnType<typeof setTimeout> | undefined;

function flush(value: number): void {
    timer = undefined;
    emit('update:modelValue', value);
}

function onInput(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);

    dragged.value = value;

    if (!props.debounce) {
        flush(value);
        return;
    }

    // Leading edge: apply immediately when idle; values inside the window replace the pending one.
    if (!timer) {
        flush(value);
        timer = setTimeout(() => {
            timer = undefined;
        }, props.debounce);

        return;
    }

    clearTimeout(timer);
    timer = setTimeout(() => flush(value), props.debounce);
}

// Once the model catches up (or is reset externally) the readout goes back to tracking it.
watch(() => props.modelValue, value => {
    if (!timer || value === dragged.value) {
        dragged.value = undefined;
    }
});

onBeforeUnmount(() => clearTimeout(timer));
</script>

<style scoped>
.ripl-input-range {
    display: flex;
    align-items: center;
    gap: 0.625rem;
    width: 100%;
}

.ripl-input-range__slider {
    appearance: none;
    flex: 1;
    min-width: 0;
    height: 4px;
    border-radius: 2px;
    background: var(--vp-c-divider);
    outline: none;
    cursor: pointer;
}

.ripl-input-range__value {
    flex-shrink: 0;
    min-width: 2.5ch;
    font-family: var(--vp-font-family-mono);
    font-size: 0.75rem;
    font-variant-numeric: tabular-nums;
    text-align: right;
    color: var(--vp-c-text-3);
}

.ripl-input-range__slider::-webkit-slider-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--vp-c-brand-3);
    border: 2px solid var(--vp-c-bg);
    box-shadow: 0 0 0 1px var(--vp-c-divider);
    cursor: pointer;
    transition: background-color 150ms ease-out, box-shadow 150ms ease-out;
}

.ripl-input-range__slider::-webkit-slider-thumb:hover {
    background: var(--vp-c-brand-2);
}

.ripl-input-range__slider::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--vp-c-brand-3);
    border: 2px solid var(--vp-c-bg);
    box-shadow: 0 0 0 1px var(--vp-c-divider);
    cursor: pointer;
}

.ripl-input-range__slider::-moz-range-track {
    height: 4px;
    border-radius: 2px;
    background: var(--vp-c-divider);
}

.ripl-input-range__slider:focus-visible {
    outline: none;
}

.ripl-input-range__slider:focus-visible::-webkit-slider-thumb {
    box-shadow: 0 0 0 2px var(--vp-c-brand-1);
}
</style>
