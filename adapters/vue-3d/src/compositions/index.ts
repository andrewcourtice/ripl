import {
    RIPL_CAMERA,
    RIPL_CONTEXT_3D,
} from '../core/injection';

import type {
    Camera,
    Context3D,
} from '@ripl/3d';

import {
    inject,
    shallowRef,
} from 'vue';

import type {
    ShallowRef,
} from 'vue';

/** Shared empty ref, returned when a composition is used outside its provider. */
const EMPTY: ShallowRef<undefined> = shallowRef();

/**
 * Returns the 3D rendering context provided by the nearest `<ripl-context-3d>`.
 *
 * This is `useRiplContext()` narrowed to `Context3D`, so the 3D surface — `raycast`, `lights`,
 * `setCamera`, `fog` — is reachable without a cast.
 *
 * @returns The 3D context, or `undefined` when there is none.
 * @example
 * const context = useRiplContext3D();
 *
 * const pick = (x: number, y: number) => context.value?.raycast(x, y);
 */
export function useRiplContext3D(): ShallowRef<Context3D | undefined> {
    return inject(RIPL_CONTEXT_3D, EMPTY);
}

/**
 * Returns the camera provided by the nearest `<ripl-camera>`.
 *
 * @returns The camera, or `undefined` when no camera component encloses the caller.
 * @example
 * const camera = useRiplCamera();
 *
 * const spin = (delta: number) => camera.value?.orbit(delta, 0);
 */
export function useRiplCamera(): ShallowRef<Camera | undefined> {
    return inject(RIPL_CAMERA, EMPTY);
}
