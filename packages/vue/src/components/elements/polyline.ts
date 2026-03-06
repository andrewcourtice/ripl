import {
    createPolyline,
} from '@ripl/core';

import {
    defineShapeComponent,
} from '../../utilities/define-shape-component';

import {
    BASE_ELEMENT_PROP_KEYS,
    BASE_ELEMENT_PROPS,
} from '../../utilities/prop-mapping';

const POLYLINE_PROPS = {
    ...BASE_ELEMENT_PROPS,
    points: {
        type: Array,
        default: undefined,
    },
    renderer: {
        type: [String, Function],
        default: undefined,
    },
};

const POLYLINE_PROP_KEYS = [...BASE_ELEMENT_PROP_KEYS, 'points', 'renderer'];

export const RiplPolyline = defineShapeComponent(
    'RiplPolyline',
    options => createPolyline(options as unknown as Parameters<typeof createPolyline>[0]),
    POLYLINE_PROPS,
    POLYLINE_PROP_KEYS
);
