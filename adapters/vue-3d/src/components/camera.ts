import {
    RIPL_CAMERA,
    RIPL_CONTEXT_3D,
} from '../core/injection';

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
    CAMERA_PROP_KEYS,
    CAMERA_SYNC_KEYS,
    collectChangedCameraProps,
} from '@ripl/adapters-3d';

import {
    ANY_PROP,
    NUMBER_PROP,
    readBoundProps,
    useExposedInstance,
} from '@ripl/vue';

import type {
    RiplComponent,
    RiplWritable,
} from '@ripl/vue';

import {
    defineComponent,
    inject,
    markRaw,
    onUnmounted,
    shallowRef,
    watch,
} from 'vue';

/**
 * Views the enclosing 3D context, optionally with pointer orbit, pan and zoom.
 *
 * A camera belongs to the context rather than the scene graph, so this component renders nothing and
 * can sit anywhere inside a `<ripl-context-3d>`. Its props are written straight through — a camera
 * is not an element, so it takes no part in `<ripl-transition>`.
 *
 * @example
 * <ripl-camera :position="[0, 2, 5]" :target="[0, 0, 0]" interactions/>
 */
export const RiplCamera = defineComponent({
    name: 'RiplCamera',
    props: {
        position: ANY_PROP,
        target: ANY_PROP,
        up: ANY_PROP,
        fov: NUMBER_PROP,
        near: NUMBER_PROP,
        far: NUMBER_PROP,
        projection: ANY_PROP,
        interactions: ANY_PROP,
    },
    setup(props) {
        const context = inject(RIPL_CONTEXT_3D, undefined);
        const camera = inject(RIPL_CAMERA, undefined) ?? shallowRef<Camera>();
        const raw = props as RiplWritable;
        const applied: RiplWritable = {};

        if (context?.value) {
            const options = readBoundProps(raw, CAMERA_PROP_KEYS);

            camera.value = markRaw(createCamera(context.value, options as CameraOptions));
            collectChangedCameraProps(options, applied);
        } else {
            console.warn('[@ripl/vue-3d] <ripl-camera> needs a <ripl-context-3d> ancestor.');
        }

        if (camera.value) {
            useExposedInstance(camera.value);
        }

        // Only what actually changed: pointer interactions move the camera, and rewriting a vector
        // rebuilt by a render would snap it back.
        watch(() => readBoundProps(raw, CAMERA_SYNC_KEYS), next => {
            const active = camera.value as unknown as RiplWritable | undefined;
            const changed = active && collectChangedCameraProps(next, applied);

            if (changed) {
                Object.assign(active, changed);
            }
        });

        onUnmounted(() => {
            camera.value?.dispose();
            camera.value = undefined;
        });

        return () => null;
    },
}) as unknown as RiplComponent<RiplCameraProps, Camera>;
