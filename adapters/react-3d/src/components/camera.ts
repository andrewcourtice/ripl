import {
    RIPL_CAMERA_SLOT,
    RIPL_CONTEXT_3D,
} from '../core/contexts';

import type {
    RiplCameraProps,
} from '../types';

import {
    createCamera,
} from '@ripl/3d';

import type {
    Camera,
    CameraOptions,
} from '@ripl/3d';

import {
    readBoundProps,
} from '@ripl/adapters';

import type {
    RiplWritable,
} from '@ripl/adapters';

import {
    CAMERA_PROP_KEYS,
    CAMERA_SYNC_KEYS,
} from '@ripl/adapters-3d';

import {
    useRiplResource,
} from '@ripl/react';

import {
    forwardRef,
    useContext,
    useImperativeHandle,
    useLayoutEffect,
} from 'react';

/**
 * Views the enclosing 3D context, optionally with pointer orbit, pan and zoom.
 *
 * A camera belongs to the context rather than the scene graph, so this component renders nothing and
 * can sit anywhere inside a `<RiplContext3D>`. Its props are written straight through — a camera is
 * not an element, so it takes no part in `<RiplTransition>`.
 *
 * @example
 * <RiplCamera position={[0, 2, 5]} target={[0, 0, 0]} interactions/>
 */
export const RiplCamera = forwardRef<Camera, RiplCameraProps>((props, ref) => {
    const context = useContext(RIPL_CONTEXT_3D);
    const slot = useContext(RIPL_CAMERA_SLOT);
    const raw = props as RiplWritable;

    const camera = useRiplResource<Camera>(() => {
        if (!context) {
            console.warn('[@ripl/react-3d] <RiplCamera> needs a <RiplContext3D> ancestor.');
            return undefined;
        }

        const created = createCamera(context, readBoundProps(raw, CAMERA_PROP_KEYS) as CameraOptions);

        slot?.(created);

        return {
            value: created,
            destroy: () => {
                slot?.(undefined);
                created.dispose();
            },
        };
    }, [context, slot]);

    useImperativeHandle(ref, () => camera as Camera, [camera]);

    // The camera coalesces writes and flushes them on a microtask, so assigning the whole bound set
    // is no more work than assigning the one property that changed.
    useLayoutEffect(() => {
        if (camera) {
            Object.assign(camera as unknown as RiplWritable, readBoundProps(raw, CAMERA_SYNC_KEYS));
        }
    });

    return null;
});

RiplCamera.displayName = 'RiplCamera';
