import type {
    Camera,
    Context3D,
} from '@ripl/3d';

import type {
    InjectionKey,
    ShallowRef,
} from 'vue';

// Registry symbols for the same reason `@ripl/vue` uses them: the standalone IIFE builds inline
// their workspace dependencies, so a page loading two adapters holds two sets of unequal keys.

/** Injection key for the 3D rendering context the subtree draws to. */
export const RIPL_CONTEXT_3D: InjectionKey<ShallowRef<Context3D | undefined>> = Symbol.for('ripl.vue3d.context');

/** Injection key for the camera viewing the enclosing 3D context. */
export const RIPL_CAMERA: InjectionKey<ShallowRef<Camera | undefined>> = Symbol.for('ripl.vue3d.camera');
