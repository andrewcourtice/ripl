<template>
    <div class="ripl-example">
        <div class="ripl-example__root">
            <ClientOnly>
                <ripl-context-3d
                    class="ripl-example__mount"
                    :lights="lights"
                    :fog="fog"
                >
                    <ripl-scene>
                        <ripl-renderer :auto-stop="false" @tick="onTick">
                            <ripl-camera
                                :position="[0, 2.4, 6]"
                                :target="[0, 0, 0]"
                                :fov="45"
                                :interactions="true"
                            />

                            <ripl-transition :update="{ duration: 1000, ease: easeOutCubic }">
                                <ripl-group-3d :rotation-y="spin">
                                    <ripl-cube
                                        v-for="block in blocks"
                                        :key="block.key"
                                        :size="block.size"
                                        :x="block.x"
                                        :y="block.y"
                                        :z="block.z"
                                        :fill="block.fill"
                                        :material="material"
                                    />
                                </ripl-group-3d>
                            </ripl-transition>
                        </ripl-renderer>
                    </ripl-scene>
                </ripl-context-3d>
            </ClientOnly>
        </div>
        <div class="ripl-example__footer">
            <RiplControlGroup>
                <RiplButton @click="shuffle">Shuffle</RiplButton>
                <RiplSwitch v-model="spinning" label="Spin" />
                <RiplSwitch v-model="wireframe" label="Wireframe" />
            </RiplControlGroup>
        </div>
    </div>
</template>

<script lang="ts" setup>
import {
    computed,
    ref,
} from 'vue';

import RiplButton from './ripl-button.vue';
import RiplControlGroup from './ripl-control-group.vue';
import RiplSwitch from './ripl-switch.vue';

import {
    createAmbientLight,
    createDirectionalLight,
    createPointLight,
} from '@ripl/3d';

import {
    easeOutCubic,
} from '@ripl/web';

const RING = 8;
const RADIUS = 2.2;
const PALETTE = ['#3a86ff', '#8338ec', '#ff006e', '#fb5607', '#ffbe0b'];

// Replaces the default ambient-plus-directional rig with a warm key, a cool fill and a rim light,
// which is what makes the faces read as shaded rather than flat-filled.
const lights = [
    createAmbientLight({
        color: '#8899bb',
        intensity: 0.3,
    }),
    createDirectionalLight({
        direction: [-0.6, -0.8, -0.5],
        color: '#fff2e0',
        intensity: 0.7,
    }),
    createPointLight({
        position: [0, 4, 3],
        color: '#ffd0a0',
        intensity: 12,
        distance: 14,
    }),
];

const fog = {
    color: '#0b1020',
    near: 8,
    far: 18,
};

const spin = ref(0);
const spinning = ref(true);
const wireframe = ref(false);
const seed = ref(0);

const material = computed(() => ({
    shininess: 40,
    specular: '#ffffff',
    wireframe: wireframe.value,
}));

function heightFor(index: number, offset: number): number {
    return 0.5 + ((index * 7 + offset * 13) % 9) / 6;
}

const blocks = computed(() => Array.from({ length: RING }, (_, index) => {
    const angle = (index / RING) * Math.PI * 2;
    const size = heightFor(index, seed.value);

    return {
        key: index,
        size,
        x: Math.cos(angle) * RADIUS,
        y: size / 2 - 1,
        z: Math.sin(angle) * RADIUS,
        fill: PALETTE[index % PALETTE.length],
    };
}));

function onTick(payload: { deltaTime: number }) {
    if (spinning.value) {
        spin.value += payload.deltaTime * 0.0004;
    }
}

function shuffle() {
    seed.value += 1;
}
</script>
