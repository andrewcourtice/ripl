import {
    createEllipse,
} from '@ripl/core';

import {
    defineShapeComponent,
} from '../../utilities/define-shape-component';

import {
    BASE_ELEMENT_PROP_KEYS,
    BASE_ELEMENT_PROPS,
} from '../../utilities/prop-mapping';

const ELLIPSE_PROPS = {
    ...BASE_ELEMENT_PROPS,
    cx: {
        type: Number,
        default: undefined,
    },
    cy: {
        type: Number,
        default: undefined,
    },
    radiusX: {
        type: Number,
        default: undefined,
    },
    radiusY: {
        type: Number,
        default: undefined,
    },
    startAngle: {
        type: Number,
        default: undefined,
    },
    endAngle: {
        type: Number,
        default: undefined,
    },
};

const ELLIPSE_PROP_KEYS = [...BASE_ELEMENT_PROP_KEYS, 'cx', 'cy', 'radiusX', 'radiusY', 'startAngle', 'endAngle'];

export const RiplEllipse = defineShapeComponent(
    'RiplEllipse',
    options => createEllipse(options as unknown as Parameters<typeof createEllipse>[0]),
    ELLIPSE_PROPS,
    ELLIPSE_PROP_KEYS
);
