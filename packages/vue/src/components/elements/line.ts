import {
    createLine,
} from '@ripl/core';

import {
    defineShapeComponent,
} from '../../utilities/define-shape-component';

import {
    BASE_ELEMENT_PROP_KEYS,
    BASE_ELEMENT_PROPS,
} from '../../utilities/prop-mapping';

const LINE_PROPS = {
    ...BASE_ELEMENT_PROPS,
    x1: {
        type: Number,
        default: undefined,
    },
    y1: {
        type: Number,
        default: undefined,
    },
    x2: {
        type: Number,
        default: undefined,
    },
    y2: {
        type: Number,
        default: undefined,
    },
};

const LINE_PROP_KEYS = [...BASE_ELEMENT_PROP_KEYS, 'x1', 'y1', 'x2', 'y2'];

export const RiplLine = defineShapeComponent(
    'RiplLine',
    options => createLine(options as unknown as Parameters<typeof createLine>[0]),
    LINE_PROPS,
    LINE_PROP_KEYS
);
