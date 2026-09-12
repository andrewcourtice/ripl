<template>
    <div class="ripl-example">
        <div class="ripl-example__root">
            <div ref="mount" class="ripl-example__mount"></div>
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
    ref,
    useTemplateRef,
} from 'vue';

import {
    useReactRoot,
} from '../compositions/react-root';

import {
    Scene3DDemo,
} from './react/scene-3d';

import RiplButton from './ripl-button.vue';
import RiplControlGroup from './ripl-control-group.vue';
import RiplSwitch from './ripl-switch.vue';

const mount = useTemplateRef<HTMLElement>('mount');
const spinning = ref(true);
const wireframe = ref(false);
const seed = ref(0);

function shuffle() {
    seed.value += 1;
}

useReactRoot(mount, Scene3DDemo, () => ({
    seed: seed.value,
    spinning: spinning.value,
    wireframe: wireframe.value,
}));
</script>
