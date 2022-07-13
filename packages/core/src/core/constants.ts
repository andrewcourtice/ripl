import {
    blendHex,
} from '../math/colour';

import {
    interpolateNumber,
} from '../math/interpolate';

import {
    BaseElement,
    ElementInterpolator,
    ElementInterpolators,
} from './element';

type ElementColor = BaseElement['strokeStyle']
| BaseElement['fillStyle']
| BaseElement['shadowColor'];

export type ElementContextOps = {
    [P in keyof BaseElement]?: (context: CanvasRenderingContext2D, value?: BaseElement[P]) => void;
}

const colorInterpolator: ElementInterpolator<ElementColor> = (valueA, valueB) => time => {
    if (valueA && valueB) {
        return blendHex(valueA, valueB, time);
    }
};

const basicContextSetter = (key: keyof CanvasRenderingContext2D) => {
    return (context: CanvasRenderingContext2D, value?: CanvasRenderingContext2D[typeof key]) => {
        if (value) {
            context[key] = value;
        }
    };
};

export const EVENTS = {
    groupUpdated: 'group:updated',
} as const;

export const INTERPOLATORS: ElementInterpolators<BaseElement> = {
    strokeStyle: colorInterpolator,
    fillStyle: colorInterpolator,
    shadowColor: colorInterpolator,
    lineDash: (valueA, valueB) => {
        const interpolators = valueA?.map((segA, i) => interpolateNumber(segA, valueB[i]));
        return time => interpolators?.map(interpolate => interpolate(time));
    },
};

export const CONTEXT_OPERATIONS = {
    strokeStyle: basicContextSetter('strokeStyle'),
    fillStyle: basicContextSetter('fillStyle'),
    lineWidth: basicContextSetter('lineWidth'),
    lineCap: basicContextSetter('lineCap'),
    lineJoin: basicContextSetter('lineJoin'),
    lineDashOffset: basicContextSetter('lineDashOffset'),
    miterLimit: basicContextSetter('miterLimit'),

    font: basicContextSetter('font'),
    direction: basicContextSetter('direction'),
    textAlign: basicContextSetter('textAlign'),
    textBaseline: basicContextSetter('textBaseline'),

    filter: basicContextSetter('filter'),
    globalAlpha: basicContextSetter('globalAlpha'),
    globalCompositeOperation: basicContextSetter('globalCompositeOperation'),

    shadowBlur: basicContextSetter('shadowBlur'),
    shadowColor: basicContextSetter('shadowColor'),
    shadowOffsetX: basicContextSetter('shadowOffsetX'),
    shadowOffsetY: basicContextSetter('shadowOffsetY'),
    lineDash: (context, value) => {
        if (value) context.setLineDash(value);
    },
} as ElementContextOps;