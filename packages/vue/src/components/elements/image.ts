import {
    createImage,
} from '@ripl/core';

import {
    defineShapeComponent,
} from '../../utilities/define-shape-component';

import {
    BASE_ELEMENT_PROP_KEYS,
    BASE_ELEMENT_PROPS,
} from '../../utilities/prop-mapping';

const IMAGE_PROPS = {
    ...BASE_ELEMENT_PROPS,
    image: {
        type: null,
        default: undefined,
    },
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

const IMAGE_PROP_KEYS = [...BASE_ELEMENT_PROP_KEYS, 'image', 'x', 'y', 'width', 'height'];

export const RiplImage = defineShapeComponent(
    'RiplImage',
    options => createImage(options as unknown as Parameters<typeof createImage>[0]),
    IMAGE_PROPS,
    IMAGE_PROP_KEYS
);
