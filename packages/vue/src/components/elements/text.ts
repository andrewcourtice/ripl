import {
    createText,
} from '@ripl/core';

import {
    defineShapeComponent,
} from '../../utilities/define-shape-component';

import {
    BASE_ELEMENT_PROP_KEYS,
    BASE_ELEMENT_PROPS,
} from '../../utilities/prop-mapping';

const TEXT_PROPS = {
    ...BASE_ELEMENT_PROPS,
    x: {
        type: Number,
        default: undefined,
    },
    y: {
        type: Number,
        default: undefined,
    },
    content: {
        type: [String, Number],
        default: undefined,
    },
    pathData: {
        type: String,
        default: undefined,
    },
    startOffset: {
        type: Number,
        default: undefined,
    },
};

const TEXT_PROP_KEYS = [...BASE_ELEMENT_PROP_KEYS, 'x', 'y', 'content', 'pathData', 'startOffset'];

export const RiplText = defineShapeComponent(
    'RiplText',
    options => createText(options as unknown as Parameters<typeof createText>[0]),
    TEXT_PROPS,
    TEXT_PROP_KEYS
);
