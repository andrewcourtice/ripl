import {
    RIPL_CAMERA,
    RIPL_CONTEXT_3D,
} from '../core/contexts';

import type {
    Camera,
    Context3D,
} from '@ripl/3d';

import {
    useContext,
} from 'react';

/**
 * Returns the 3D rendering context provided by the nearest `<RiplContext3D>`.
 *
 * This is `useRiplContext()` narrowed to `Context3D`, so the 3D surface — `raycast`, `lights`,
 * `setCamera`, `fog` — is reachable without a cast.
 *
 * @returns The 3D context, or `undefined` when there is none.
 * @example
 * const context = useRiplContext3D();
 *
 * const pick = (x: number, y: number) => context?.raycast(x, y);
 */
export function useRiplContext3D(): Context3D | undefined {
    return useContext(RIPL_CONTEXT_3D);
}

/**
 * Returns the camera provided by the nearest `<RiplCamera>`.
 *
 * @returns The camera, or `undefined` when no camera component encloses the caller.
 * @example
 * const camera = useRiplCamera();
 *
 * const spin = (delta: number) => camera?.orbit(delta, 0);
 */
export function useRiplCamera(): Camera | undefined {
    return useContext(RIPL_CAMERA);
}
