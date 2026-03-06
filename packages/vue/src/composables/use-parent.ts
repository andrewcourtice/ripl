import {
    inject,
    provide,
    ref,
} from 'vue';

import {
    PARENT_KEY,
} from '../constants';

import type {
    Ref,
} from 'vue';

import type {
    Group,
    Scene,
} from '@ripl/core';

export function provideParent(parent: Ref<Group | Scene | undefined>) {
    provide(PARENT_KEY, parent);
}

export function useParent(): Ref<Group | Scene | undefined> {
    return inject(PARENT_KEY, ref(undefined));
}
