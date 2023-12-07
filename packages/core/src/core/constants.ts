import {
    interpolateColor,
    interpolateNumber,
} from '../interpolators';

import {
    BaseElementState,
    ElementEventMap,
    ElementInterpolator,
    ElementInterpolators,
} from './types';

import {
    GetMutableKeys,
    typeIsNil,
} from '@ripl/utilities';

export type ElementContextOps = {
    [P in keyof BaseElementState]?: (context: CanvasRenderingContext2D, value?: BaseElementState[P]) => void;
}

function basicContextSetter<TKey extends GetMutableKeys<CanvasRenderingContext2D>>(key: TKey) {
    return (context: CanvasRenderingContext2D, value?: CanvasRenderingContext2D[TKey]) => {
        if (!typeIsNil(value)) {
            context[key] = value;
        }
    };
}

export const INTERPOLATORS: ElementInterpolators<BaseElementState> = {
    strokeStyle: interpolateColor as ElementInterpolator<BaseElementState['strokeStyle']>,
    fillStyle: interpolateColor as ElementInterpolator<BaseElementState['fillStyle']>,
    shadowColor: interpolateColor as ElementInterpolator<BaseElementState['shadowColor']>,
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

export const TRACKED_EVENTS = [
    'element:click',
    'element:mousemove',
    'element:mouseenter',
    'element:mouseleave',
] as (keyof ElementEventMap)[];