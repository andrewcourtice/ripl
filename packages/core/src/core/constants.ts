import {
    Context,
} from '../context';

import {
    BaseElementState,
    ElementEventMap,
} from './element';

import {
    GetMutableKeys,
} from '@ripl/utilities';

function basicContextSetter<TKey extends GetMutableKeys<Context>>(key: TKey) {
    return (context: Context, value: Context[TKey]) => {
        context[key] = value;
    };
}

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
    lineDash: basicContextSetter('lineDash'),
} as {
    [P in keyof BaseElementState]-?: (context: Context, value: NonNullable<BaseElementState[P]>) => void;
};

export const TRACKED_EVENTS = [
    'element:click',
    'element:mousemove',
    'element:mouseenter',
    'element:mouseleave',
] as (keyof ElementEventMap)[];