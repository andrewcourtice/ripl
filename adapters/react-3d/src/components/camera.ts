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
    collectChangedCameraProps,
} from '@ripl/adapters-3d';

import {
    useRiplResource,
} from '@ripl/react';

import {
    forwardRef,
    useContext,
    useImperativeHandle,
    useLayoutEffect,
    useRef,
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

    const applied = useRef<RiplWritable>({});

    const camera = useRiplResource<Camera>(() => {
        if (!context) {
            console.warn('[@ripl/react-3d] <RiplCamera> needs a <RiplContext3D> ancestor.');
            return undefined;
        }

        const options = readBoundProps(raw, CAMERA_PROP_KEYS);
        const created = createCamera(context, options as CameraOptions);

        applied.current = {};
        collectChangedCameraProps(options, applied.current);

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

    // Only what actually changed: pointer interactions move the camera, and rewriting a vector
    // rebuilt by a render would snap it back.
    useLayoutEffect(() => {
        const changed = camera && collectChangedCameraProps(raw, applied.current);

        if (changed) {
            Object.assign(camera as unknown as RiplWritable, changed);
        }
    });

    return null;
});

RiplCamera.displayName = 'RiplCamera';
