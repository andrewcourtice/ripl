<template>
    <div class="ripl-example">
        <div class="react-quick-start__stage">
            <div ref="mount"></div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import {
    useTemplateRef,
} from 'vue';

import {
    useReactRoot,
} from '../compositions/react-root';

import {
    QuickStart,
} from './react/quick-start';

const mount = useTemplateRef<HTMLElement>('mount');

useReactRoot(mount, QuickStart, () => ({}));
</script>

<style scoped>
.react-quick-start__stage {
    display: grid;
    place-items: center;
    padding: 1.5rem 1rem;
}
</style>
