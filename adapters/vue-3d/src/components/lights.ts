import {
    RIPL_CONTEXT_3D,
} from '../core/injection';

import type {
    RiplDirectionalLightProps,
    RiplHemisphereLightProps,
    RiplLightProps,
    RiplPointLightProps,
    RiplSpotLightProps,
} from '../types';

import {
    createAmbientLight,
    createDirectionalLight,
    createHemisphereLight,
    createPointLight,
    createSpotLight,
} from '@ripl/3d';

import type {
    AmbientLight,
    DirectionalLight,
    HemisphereLight,
    Light,
    PointLight,
    SpotLight,
} from '@ripl/3d';

import {
    ANY_PROP,
    BOOLEAN_PROP,
    createProps,
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
    watch,
} from 'vue';

/** Props every light accepts. */
const LIGHT_KEYS = [
    'color',
    'enabled',
    'intensity',
];

/** Describes one light type to wrap as a component. */
interface RiplLightDefinition {
    /** The component's name, e.g. `RiplPointLight`. */
    name: string;
    /** The light's own option names, on top of the shared ones. */
    optionKeys: readonly string[];
    /** Constructs the light from the props bound on the component. */
    create(options: RiplWritable): Light;
}

/**
 * Builds a declarative component for a light.
 *
 * A light is not an element: it lives in the context's light list rather than the scene graph, emits
 * nothing, and every property is written straight through. The component renders nothing, so it can
 * sit anywhere inside a `<ripl-context-3d>`.
 */
function defineRiplLight(definition: RiplLightDefinition) {
    const propKeys = [
        ...LIGHT_KEYS,
        ...definition.optionKeys,
    ];

    return defineComponent({
        name: definition.name,
        props: {
            ...createProps(propKeys),
            enabled: BOOLEAN_PROP,
            intensity: NUMBER_PROP,
            color: ANY_PROP,
        },
        setup(props) {
            const context = inject(RIPL_CONTEXT_3D, undefined);
            const raw = props as RiplWritable;
            const light = markRaw(definition.create(readBoundProps(raw, propKeys)));

            if (context?.value) {
                context.value.lights.add(light);
            } else {
                console.warn(`[@ripl/vue-3d] <${definition.name}> needs a <ripl-context-3d> ancestor.`);
            }

            useExposedInstance(light);

            watch(() => readBoundProps(raw, propKeys), next => {
                Object.assign(light as unknown as RiplWritable, next);
            });

            onUnmounted(() => context?.value?.lights.remove(light));

            return () => null;
        },
    });
}

/**
 * Lights every surface equally, regardless of orientation.
 *
 * @example
 * <ripl-ambient-light color="#8899bb" :intensity="0.25"/>
 */
export const RiplAmbientLight = defineRiplLight({
    name: 'RiplAmbientLight',
    optionKeys: [],
    create: options => createAmbientLight(options),
}) as unknown as RiplComponent<RiplLightProps, AmbientLight>;

/** Lights surfaces from above with one colour and from below with another. */
export const RiplHemisphereLight = defineRiplLight({
    name: 'RiplHemisphereLight',
    optionKeys: ['groundColor'],
    create: options => createHemisphereLight(options),
}) as unknown as RiplComponent<RiplHemisphereLightProps, HemisphereLight>;

/** Lights every surface from one direction, as a distant source does. */
export const RiplDirectionalLight = defineRiplLight({
    name: 'RiplDirectionalLight',
    optionKeys: [
        'direction',
        'space',
    ],
    create: options => createDirectionalLight(options),
}) as unknown as RiplComponent<RiplDirectionalLightProps, DirectionalLight>;

/** Lights outwards from a point in space, falling off with distance. */
export const RiplPointLight = defineRiplLight({
    name: 'RiplPointLight',
    optionKeys: [
        'decay',
        'distance',
        'position',
    ],
    create: options => createPointLight(options),
}) as unknown as RiplComponent<RiplPointLightProps, PointLight>;

/** Lights a cone from a point in space, with a soft or hard edge. */
export const RiplSpotLight = defineRiplLight({
    name: 'RiplSpotLight',
    optionKeys: [
        'angle',
        'decay',
        'direction',
        'distance',
        'penumbra',
        'position',
        'space',
    ],
    create: options => createSpotLight(options),
}) as unknown as RiplComponent<RiplSpotLightProps, SpotLight>;
