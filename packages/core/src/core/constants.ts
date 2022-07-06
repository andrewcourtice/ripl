import {
    blendHex,
} from '../math/colour';

import {
    continuous,
} from '../math/scale';

import {
    BaseElement,
    ElementCalculator,
    ElementCalculators,
} from './element';

export type ElementContextOps = {
    [P in keyof BaseElement]?: (context: CanvasRenderingContext2D, value?: BaseElement[P]) => void;
}

const colorCalculator: ElementCalculator<BaseElement['fillStyle']> = (valueA, valueB) => time => {
    if (valueA && valueB) {
        return blendHex(valueA, valueB, time);
    }
};

export const EVENTS = {
    groupUpdated: 'group:updated',
} as const;

export const CALCULATORS: ElementCalculators<BaseElement> = {
    strokeStyle: colorCalculator,
    fillStyle: colorCalculator,
    lineDash: (valueA, valueB) => {
        const scales = valueA?.map((segA, i) => continuous([0, 1], [segA, valueB[i]]));
        return time => scales?.map(scale => scale(time, true));
    },
};

export const CONTEXT_OPERATIONS = {
    strokeStyle: (context, value) => {
        if (value) context.strokeStyle = value;
    },
    fillStyle: (context, value) => {
        if (value) context.fillStyle = value;
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
} as ElementContextOps;