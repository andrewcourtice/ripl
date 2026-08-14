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

const PROP_KEYS = [
    'far',
    'fov',
    'interactions',
    'near',
    'position',
    'projection',
    'target',
    'up',
];

/** `interactions` is read once, when the camera wires up its listeners, and has no setter. */
const SYNC_KEYS = PROP_KEYS.filter(key => key !== 'interactions');

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

        if (context?.value) {
            camera.value = markRaw(createCamera(context.value, readBoundProps(raw, PROP_KEYS) as CameraOptions));
        } else {
            console.warn('[@ripl/vue-3d] <ripl-camera> needs a <ripl-context-3d> ancestor.');
        }

        if (camera.value) {
            useExposedInstance(camera.value);
        }

        // The camera coalesces writes and flushes them on a microtask, so assigning the whole bound
        // set is no more work than assigning the one property that changed.
        watch(() => readBoundProps(raw, SYNC_KEYS), next => {
            const active = camera.value as unknown as RiplWritable | undefined;

            if (active) {
                Object.assign(active, next);
            }
        });

        onUnmounted(() => {
            camera.value?.dispose();
            camera.value = undefined;
        });

        return () => null;
    },
}) as unknown as RiplComponent<RiplCameraProps, Camera>;
