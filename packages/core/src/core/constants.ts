import {
    Context,
} from '../context';

import {
    interpolateRotation,
    interpolateTransformOrigin,
    InterpolatorFactory,
} from '../interpolators';

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

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

/** Maps element state properties to their corresponding context setter functions. */
export const CONTEXT_OPERATIONS = {
    direction: basicContextSetter('direction'),
    fillStyle: basicContextSetter('fillStyle'),
    filter: basicContextSetter('filter'),
    font: basicContextSetter('font'),
    fontKerning: basicContextSetter('fontKerning'),
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
    translateX: noop,
    translateY: noop,
    transformScaleX: noop,
    transformScaleY: noop,
    rotation: noop,
    transformOriginX: noop,
    transformOriginY: noop,
} as {
    [P in keyof BaseElementState]-?: (context: Context, value: NonNullable<BaseElementState[P]>) => void;
};

/** Interpolator factories for transform-related properties that require special interpolation (rotation, transform-origin). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const TRANSFORM_INTERPOLATORS: Record<string, InterpolatorFactory<any>> = {
    rotation: interpolateRotation,
    transformOriginX: interpolateTransformOrigin,
    transformOriginY: interpolateTransformOrigin,
};

/** Default numeric values for transform properties (translate, scale, rotation, transform-origin). */
export const TRANSFORM_DEFAULTS: Record<string, number> = {
    translateX: 0,
    translateY: 0,
    transformScaleX: 1,
    transformScaleY: 1,
    rotation: 0,
    transformOriginX: 0,
    transformOriginY: 0,
};

/** DOM event types that are tracked and forwarded to elements for hit testing and interaction. */
export const TRACKED_EVENTS = [
    'click',
    'mousemove',
    'mouseenter',
    'mouseleave',
] as (keyof ElementEventMap)[];