import {
    createCircle,
} from '@ripl/core';

import {
    defineShapeComponent,
} from '../../utilities/define-shape-component';

import {
    BASE_ELEMENT_PROP_KEYS,
    BASE_ELEMENT_PROPS,
} from '../../utilities/prop-mapping';

const CIRCLE_PROPS = {
    ...BASE_ELEMENT_PROPS,
    cx: {
        type: Number,
        default: undefined,
    },
    cy: {
        type: Number,
        default: undefined,
    },
    radius: {
        type: Number,
        default: undefined,
    },
};

const CIRCLE_PROP_KEYS = [...BASE_ELEMENT_PROP_KEYS, 'cx', 'cy', 'radius'];

export const RiplCircle = defineShapeComponent(
    'RiplCircle',
    options => createCircle(options as unknown as Parameters<typeof createCircle>[0]),
    CIRCLE_PROPS,
    CIRCLE_PROP_KEYS
);
