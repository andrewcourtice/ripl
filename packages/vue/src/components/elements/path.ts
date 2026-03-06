import {
    createPath,
} from '@ripl/core';

import {
    defineShapeComponent,
} from '../../utilities/define-shape-component';

import {
    BASE_ELEMENT_PROP_KEYS,
    BASE_ELEMENT_PROPS,
} from '../../utilities/prop-mapping';

const PATH_PROPS = {
    ...BASE_ELEMENT_PROPS,
    x: {
        type: Number,
        default: undefined,
    },
    y: {
        type: Number,
        default: undefined,
    },
    width: {
        type: Number,
        default: undefined,
    },
    height: {
        type: Number,
        default: undefined,
    },
};

const PATH_PROP_KEYS = [...BASE_ELEMENT_PROP_KEYS, 'x', 'y', 'width', 'height'];

export const RiplPath = defineShapeComponent(
    'RiplPath',
    options => createPath(options as unknown as Parameters<typeof createPath>[0]),
    PATH_PROPS,
    PATH_PROP_KEYS
);
