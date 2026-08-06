<template>
    <div class="preset-gallery">
        <section v-for="group in groups" :key="group.mode" class="preset-gallery__group">
            <h4 class="preset-gallery__heading">
                {{ group.heading }}
                <span v-if="group.mode !== mode" class="preset-gallery__note">switches mode</span>
            </h4>
            <ul class="preset-gallery__items">
                <li v-for="preset in group.presets" :key="preset.label">
                    <button
                        type="button"
                        class="preset-gallery__item"
                        @click="$emit('select', preset)"
                    >
                        <span class="preset-gallery__label">{{ preset.label }}</span>
                        <span class="preset-gallery__description">{{ preset.description }}</span>
                    </button>
                </li>
            </ul>
        </section>
    </div>
</template>

<script lang="ts" setup>
import {
    computed,
} from 'vue';

import type {
    GraphPreset,
} from '../types';

/** The mode a preset loads into. */
type PresetMode = GraphPreset['mode'];

const HEADINGS: Record<PresetMode, string> = {
    '2d': '2D curves',
    '3d': '3D surfaces',
};

const props = defineProps<{
    /** Every preset on offer, in both modes. */
    presets: GraphPreset[];
    /** The mode the calculator is in; its presets are listed first. */
    mode: PresetMode;
}>();

defineEmits<{
    /** The user picked a preset to load. */
    'select': [preset: GraphPreset];
}>();

const groups = computed(() => {
    const order: PresetMode[] = props.mode === '3d' ? ['3d', '2d'] : ['2d', '3d'];

    return order.map(mode => ({
        mode,
        heading: HEADINGS[mode],
        presets: props.presets.filter(preset => preset.mode === mode),
    })).filter(group => group.presets.length > 0);
});
</script>

<style scoped>
.preset-gallery {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
    padding: 1rem;
}

.preset-gallery__heading {
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
    margin: 0 0 0.5rem;
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--vp-c-text-2);
}

.preset-gallery__note {
    font-size: 0.6875rem;
    font-weight: 400;
    letter-spacing: 0;
    text-transform: none;
    color: var(--vp-c-text-3);
}

.preset-gallery__items {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
}

.preset-gallery__item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    width: 100%;
    height: 100%;
    padding: 0.5rem 0.625rem;
    font: inherit;
    text-align: left;
    border: 1px solid var(--vp-c-divider);
    border-radius: 0.375rem;
    background-color: var(--vp-button-alt-bg);
    cursor: pointer;
    transition: border-color 150ms ease-out, background-color 150ms ease-out;
}

.preset-gallery__item:hover {
    border-color: var(--vp-c-brand-1);
    background-color: var(--vp-c-bg-soft);
}

.preset-gallery__item:focus-visible {
    outline: 2px solid var(--vp-c-brand-1);
    outline-offset: 2px;
}

.preset-gallery__label {
    font-size: 0.8125rem;
    font-weight: 500;
    color: var(--vp-c-text-1);
}

.preset-gallery__description {
    font-size: 0.75rem;
    line-height: 1.4;
    color: var(--vp-c-text-2);
}
</style>
