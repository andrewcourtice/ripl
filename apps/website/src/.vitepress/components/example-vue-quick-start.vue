<template>
    <div class="ripl-example">
        <div class="vue-quick-start__stage">
            <ClientOnly>
                <ripl-context style="width: 400px; height: 300px">
                    <ripl-scene>
                        <ripl-renderer>
                            <ripl-transition :update="{ duration: 400, ease: easeOutCubic }">
                                <ripl-circle
                                    :cx="200"
                                    :cy="150"
                                    :radius="grown ? 90 : 50"
                                    :fill="grown ? '#ff006e' : '#3a86ff'"
                                    @click="grown = !grown"
                                />
                            </ripl-transition>
                        </ripl-renderer>
                    </ripl-scene>
                </ripl-context>
            </ClientOnly>
        </div>
    </div>
</template>

<script lang="ts" setup>
import {
    ref,
} from 'vue';

import {
    easeOutCubic,
} from '@ripl/web';

const grown = ref(false);
</script>

<style scoped>
.vue-quick-start__stage {
    display: grid;
    place-items: center;
    padding: 1.5rem 1rem;
}
</style>
