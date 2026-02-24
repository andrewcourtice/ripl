<template>
    <div class="ripl-example">
        <div class="ripl-example__header">
            <div class="ripl-example__context-type-options" layout="row">
                <label class="ripl-example__context-type-option" style="pointer-events: none;">
                    Canvas 3D
                </label>
            </div>
            <slot name="header"></slot>
        </div>
        <div class="ripl-example__root" self="size-x1" ref="root"></div>
        <div class="ripl-example__footer" v-if="$slots.footer">
            <slot name="footer"></slot>
        </div>
    </div>
</template>

<script lang="ts" setup>
import {
    ref,
    watchEffect,
    onUnmounted,
} from 'vue';

import {
    Context3D,
} from '@ripl/3d';

const emit = defineEmits<{
    'context-changed': [context: Context3D]
}>();

const root = ref<HTMLElement>();
let context: Context3D | undefined;

watchEffect(() => {
    context?.destroy();

    if (root.value) {
        context = new Context3D(root.value, {
            buffer: false,
        });

        emit('context-changed', context);
    }
});

onUnmounted(() => {
    context?.destroy();
});
</script>
