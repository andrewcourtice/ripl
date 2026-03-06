import {
    inject,
    provide,
    ref,
} from 'vue';

import {
    SCENE_KEY,
} from '../constants';

import type {
    Ref,
} from 'vue';

import type {
    Scene,
} from '@ripl/core';

export function provideScene(scene: Ref<Scene | undefined>) {
    provide(SCENE_KEY, scene);
}

export function useScene(): Ref<Scene | undefined> {
    return inject(SCENE_KEY, ref(undefined));
}
