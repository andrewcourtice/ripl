<template>
    <div class="teapot-demo">
        <div class="teapot-demo__toolbar">
            <RiplControlGroup>
                <RiplButtonGroup v-model="preset" :options="presetOptions" />
            </RiplControlGroup>
            <RiplControlGroup>
                <RiplSwitch v-model="textured" label="Texture" />
                <RiplSwitch v-model="wireframe" label="Wireframe" />
                <RiplSwitch v-model="flatShading" label="Flat" />
                <RiplSwitch v-model="spinning" label="Spin" />
            </RiplControlGroup>
            <RiplControlGroup>
                <label class="teapot-demo__label">Shine</label>
                <RiplInputRange v-model="shininess" :min="0" :max="120" :step="1" />
            </RiplControlGroup>
        </div>
        <div class="teapot-demo__viewport" ref="viewport"></div>
        <p class="teapot-demo__note">
            Every surface is a <code>createParametric</code> element: the body, lid and knob are
            surfaces of revolution, the spout and handle are circular tubes swept along a curve.
            Normals come from the analytic partial derivatives, so the shading is smooth without an
            averaging pass. Lit by a three-point rig of coloured lights.
        </p>
    </div>
</template>

<script lang="ts" setup>
import {
    onMounted,
    onUnmounted,
    ref,
    watch,
} from 'vue';

import RiplButtonGroup from '../../.vitepress/components/ripl-button-group.vue';
import RiplControlGroup from '../../.vitepress/components/ripl-control-group.vue';
import RiplInputRange from '../../.vitepress/components/ripl-input-range.vue';
import RiplSwitch from '../../.vitepress/components/ripl-switch.vue';

import {
    createTeapotScene,
} from './scene';

import type {
    TeapotPreset,
    TeapotScene,
} from './scene';

import './styles/teapot.scss';

const presetOptions = [
    {
        label: 'Porcelain',
        value: 'porcelain',
    },
    {
        label: 'Copper',
        value: 'copper',
    },
    {
        label: 'Jade',
        value: 'jade',
    },
];

const viewport = ref<HTMLElement>();
const preset = ref<TeapotPreset>('porcelain');
const textured = ref(false);
const wireframe = ref(false);
const flatShading = ref(false);
const spinning = ref(true);
const shininess = ref(48);

let scene: TeapotScene | undefined;

function applyOptions(): void {
    scene?.setOptions({
        preset: preset.value,
        textured: textured.value,
        wireframe: wireframe.value,
        flatShading: flatShading.value,
        shininess: shininess.value,
    });
}

watch([preset, textured, wireframe, flatShading, shininess], applyOptions);
watch(spinning, value => scene?.setSpinning(value));

onMounted(() => {
    if (!viewport.value) {
        return;
    }

    scene = createTeapotScene({
        host: viewport.value,
    });

    applyOptions();
    scene.setSpinning(spinning.value);
});

onUnmounted(() => {
    scene?.destroy();
    scene = undefined;
});
</script>
