import {
    blendHex,
} from '../../math/colour';

import {
    continuous,
} from '../../math/scale';

import {
    BaseCalculators,
    BaseElement,
    ElementCalculator,
    ElementCalculators,
} from './types';

const colorCalculator: ElementCalculator<BaseElement['fillStyle']> = (valueA, valueB) => time => {
    if (valueA && valueB) {
        return blendHex(valueA, valueB, time);
    }
};

export const CALCULATORS: ElementCalculators<BaseElement> = {
    strokeStyle: colorCalculator,
    fillStyle: colorCalculator,
    lineDash: (valueA, valueB) => {
        const scales = valueA?.map((segA, i) => continuous([0, 1], [segA, valueB[i]]));
        return time => scales?.map(scale => scale(time, true));
    },
};

const CONTEXT_DEFAULTS = {
    strokeStyle: 'rgba(0, 0, 0, 0)',
    fillStyle: 'rgba(0, 0, 0, 0)',
} as {
    [P in keyof BaseElement]-?: BaseElement[P];
};

export const CONTEXT_OPERATIONS = {
    strokeStyle: (context, value) => {
        context.strokeStyle = value || CONTEXT_DEFAULTS.strokeStyle;
    },
    fillStyle: (context, value) => {
        context.fillStyle = value || CONTEXT_DEFAULTS.fillStyle;
    },
    lineWidth: (context, value) => {
        if (value) context.lineWidth = value;
    },
    lineCap: (context, value) => {
        if (value) context.lineCap = value;
    },
    lineJoin: (context, value) => {
        if (value) context.lineJoin = value;
    },
    lineDash: (context, value) => {
        if (value) context.setLineDash(value);
    },
    lineDashOffset: (context, value) => {
        if (value) context.lineDashOffset = value;
    },
    font: (context, value) => {
        if (value) context.font = value;
    },
    filter: (context, value) => {
        if (value) context.filter = value;
    },
} as BaseCalculators;