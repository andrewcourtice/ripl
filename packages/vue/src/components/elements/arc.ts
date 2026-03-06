import {
    createArc,
} from '@ripl/core';

import {
    defineShapeComponent,
} from '../../utilities/define-shape-component';

import {
    BASE_ELEMENT_PROP_KEYS,
    BASE_ELEMENT_PROPS,
} from '../../utilities/prop-mapping';

const ARC_PROPS = {
    ...BASE_ELEMENT_PROPS,
    cx: {
        type: Number,
        default: undefined,
    },
    cy: {
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
    radius: {
        type: Number,
        default: undefined,
    },
    innerRadius: {
        type: Number,
        default: undefined,
    },
    padAngle: {
        type: Number,
        default: undefined,
    },
    borderRadius: {
        type: Number,
        default: undefined,
    },
};

const ARC_PROP_KEYS = [...BASE_ELEMENT_PROP_KEYS, 'cx', 'cy', 'startAngle', 'endAngle', 'radius', 'innerRadius', 'padAngle', 'borderRadius'];

export const RiplArc = defineShapeComponent(
    'RiplArc',
    options => createArc(options as unknown as Parameters<typeof createArc>[0]),
    ARC_PROPS,
    ARC_PROP_KEYS
);
