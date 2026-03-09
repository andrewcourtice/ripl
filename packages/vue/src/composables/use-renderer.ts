import {
    inject,
    provide,
    shallowRef,
} from 'vue';

import {
    RENDERER_KEY,
} from '../constants';

import type {
    Ref,
} from 'vue';

import type {
    Renderer,
} from '@ripl/core';

export function provideRenderer(renderer: Ref<Renderer | undefined>) {
    provide(RENDERER_KEY, renderer);
}

export function useRenderer(): Ref<Renderer | undefined> {
    return inject(RENDERER_KEY, shallowRef(undefined));
}
