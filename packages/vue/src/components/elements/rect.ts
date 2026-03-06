import {
    createRect,
} from '@ripl/core';

import {
    defineShapeComponent,
} from '../../utilities/define-shape-component';

import {
    BASE_ELEMENT_PROP_KEYS,
    BASE_ELEMENT_PROPS,
} from '../../utilities/prop-mapping';

const RECT_PROPS = {
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
    borderRadius: {
        type: [Number, Array],
        default: undefined,
    },
};

const RECT_PROP_KEYS = [...BASE_ELEMENT_PROP_KEYS, 'x', 'y', 'width', 'height', 'borderRadius'];

export const RiplRect = defineShapeComponent(
    'RiplRect',
    options => createRect(options as unknown as Parameters<typeof createRect>[0]),
    RECT_PROPS,
    RECT_PROP_KEYS
);
