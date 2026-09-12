import {
    RIPL_CONTEXT_3D,
} from '../core/contexts';

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
    readBoundProps,
} from '@ripl/adapters';

import type {
    RiplWritable,
} from '@ripl/adapters';

import {
    LIGHT_KEYS,
    LIGHT_OPTION_KEYS,
} from '@ripl/adapters-3d';

import {
    useRiplResource,
} from '@ripl/react';

import type {
    RiplComponent,
} from '@ripl/react';

import {
    forwardRef,
    useContext,
    useImperativeHandle,
    useLayoutEffect,
} from 'react';

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
 * sit anywhere inside a `<RiplContext3D>`.
 */
function defineRiplLight(definition: RiplLightDefinition) {
    const propKeys = [
        ...LIGHT_KEYS,
        ...definition.optionKeys,
    ];

    const component = forwardRef<Light, RiplLightProps>((props, ref) => {
        const context = useContext(RIPL_CONTEXT_3D);
        const raw = props as RiplWritable;

        const light = useRiplResource<Light>(() => {
            if (!context) {
                console.warn(`[@ripl/react-3d] <${definition.name}> needs a <RiplContext3D> ancestor.`);
                return undefined;
            }

            const created = definition.create(readBoundProps(raw, propKeys));

            context.lights.add(created);

            return {
                value: created,
                destroy: () => context.lights.remove(created),
            };
        }, [context]);

        useImperativeHandle(ref, () => light as Light, [light]);

        useLayoutEffect(() => {
            if (light) {
                Object.assign(light as unknown as RiplWritable, readBoundProps(raw, propKeys));
            }
        });

        return null;
    });

    component.displayName = definition.name;

    return component;
}

/**
 * Lights every surface equally, regardless of orientation.
 *
 * @example
 * <RiplAmbientLight color="#8899bb" intensity={0.25}/>
 */
export const RiplAmbientLight = defineRiplLight({
    name: 'RiplAmbientLight',
    optionKeys: LIGHT_OPTION_KEYS.ambient,
    create: options => createAmbientLight(options),
}) as unknown as RiplComponent<RiplLightProps, AmbientLight>;

/** Lights surfaces from above with one colour and from below with another. */
export const RiplHemisphereLight = defineRiplLight({
    name: 'RiplHemisphereLight',
    optionKeys: LIGHT_OPTION_KEYS.hemisphere,
    create: options => createHemisphereLight(options),
}) as unknown as RiplComponent<RiplHemisphereLightProps, HemisphereLight>;

/** Lights every surface from one direction, as a distant source does. */
export const RiplDirectionalLight = defineRiplLight({
    name: 'RiplDirectionalLight',
    optionKeys: LIGHT_OPTION_KEYS.directional,
    create: options => createDirectionalLight(options),
}) as unknown as RiplComponent<RiplDirectionalLightProps, DirectionalLight>;

/** Lights outwards from a point in space, falling off with distance. */
export const RiplPointLight = defineRiplLight({
    name: 'RiplPointLight',
    optionKeys: LIGHT_OPTION_KEYS.point,
    create: options => createPointLight(options),
}) as unknown as RiplComponent<RiplPointLightProps, PointLight>;

/** Lights a cone from a point in space, with a soft or hard edge. */
export const RiplSpotLight = defineRiplLight({
    name: 'RiplSpotLight',
    optionKeys: LIGHT_OPTION_KEYS.spot,
    create: options => createSpotLight(options),
}) as unknown as RiplComponent<RiplSpotLightProps, SpotLight>;
