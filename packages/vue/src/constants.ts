import type {
    InjectionKey,
    Ref,
} from 'vue';

import type {
    Context,
    Renderer,
    Scene,
} from '@ripl/core';

import type {
    Group,
} from '@ripl/core';

export const CONTEXT_KEY: InjectionKey<Ref<Context | undefined>> = Symbol('ripl-context');
export const SCENE_KEY: InjectionKey<Ref<Scene | undefined>> = Symbol('ripl-scene');
export const RENDERER_KEY: InjectionKey<Ref<Renderer | undefined>> = Symbol('ripl-renderer');
export const PARENT_KEY: InjectionKey<Ref<Group | Scene | undefined>> = Symbol('ripl-parent');

export interface TransitionContext {
    duration: number;
    ease: string;
    delay: number;
    loop: boolean;
    direction: 'forward' | 'reverse';
}

export const TRANSITION_KEY: InjectionKey<Ref<TransitionContext | undefined>> = Symbol('ripl-transition');
