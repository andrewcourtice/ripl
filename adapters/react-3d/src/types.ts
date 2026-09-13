import type {
    Ripl3DBaseState,
    Ripl3DElementOptions,
    RiplGroup3DTransformProps,
} from '@ripl/adapters-3d';

import type {
    RiplElementListeners,
    RiplElementOptionProps,
    RiplShapeProps,
} from '@ripl/react';

export type {
    Ripl3DBaseState,
    RiplCameraProps,
    RiplContext3DProps,
    RiplDirectionalLightProps,
    RiplHemisphereLightProps,
    RiplLightProps,
    RiplPointLightProps,
    RiplSpotLightProps,
} from '@ripl/adapters-3d';

/**
 * The full prop surface of a 3D shape component: the shape's own state, the shared construction
 * options and paint flags, and its event listeners.
 *
 * @typeParam TState - The shape's state interface, e.g. `CubeState`.
 */
export type Ripl3DElementProps<TState extends Ripl3DBaseState> = Partial<TState>
& RiplElementOptionProps
& RiplShapeProps
& RiplElementListeners
& Ripl3DElementOptions;

/** Props accepted by {@link RiplGroup3D}. */
export interface RiplGroup3DProps extends RiplElementOptionProps, RiplElementListeners, RiplGroup3DTransformProps {}
