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
    direction: basicContextSetter('direction'),
    fillStyle: basicContextSetter('fillStyle'),
    filter: basicContextSetter('filter'),
    font: basicContextSetter('font'),
    globalAlpha: basicContextSetter('globalAlpha'),
    globalCompositeOperation: basicContextSetter('globalCompositeOperation'),
    lineCap: basicContextSetter('lineCap'),
    lineDash: basicContextSetter('lineDash'),
    lineDashOffset: basicContextSetter('lineDashOffset'),
    lineJoin: basicContextSetter('lineJoin'),
    lineWidth: basicContextSetter('lineWidth'),
    miterLimit: basicContextSetter('miterLimit'),
    shadowBlur: basicContextSetter('shadowBlur'),
    shadowColor: basicContextSetter('shadowColor'),
    shadowOffsetX: basicContextSetter('shadowOffsetX'),
    shadowOffsetY: basicContextSetter('shadowOffsetY'),
    strokeStyle: basicContextSetter('strokeStyle'),
    textAlign: basicContextSetter('textAlign'),
    textBaseline: basicContextSetter('textBaseline'),
    zIndex: basicContextSetter('zIndex'),
} as {
    [P in keyof BaseElementState]-?: (context: Context, value: NonNullable<BaseElementState[P]>) => void;
};

export const TRACKED_EVENTS = [
    'element:click',
    'element:mousemove',
    'element:mouseenter',
    'element:mouseleave',
] as (keyof ElementEventMap)[];