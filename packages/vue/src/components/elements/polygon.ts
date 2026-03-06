import {
    createPolygon,
} from '@ripl/core';

import {
    defineShapeComponent,
} from '../../utilities/define-shape-component';

import {
    BASE_ELEMENT_PROP_KEYS,
    BASE_ELEMENT_PROPS,
} from '../../utilities/prop-mapping';

const POLYGON_PROPS = {
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
    sides: {
        type: Number,
        default: undefined,
    },
};

const POLYGON_PROP_KEYS = [...BASE_ELEMENT_PROP_KEYS, 'cx', 'cy', 'radius', 'sides'];

export const RiplPolygon = defineShapeComponent(
    'RiplPolygon',
    options => createPolygon(options as unknown as Parameters<typeof createPolygon>[0]),
    POLYGON_PROPS,
    POLYGON_PROP_KEYS
);
