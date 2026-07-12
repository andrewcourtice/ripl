import type {
    Context,
} from '../context';

import {
    interpolateRotation,
    interpolateTransformOrigin,
} from '../interpolators';

import type {
    InterpolatorFactory,
} from '../interpolators';

import type {
    BaseElementState,
    ElementEventMap,
} from './element';

import type {
    GetMutableKeys,
} from '@ripl/utilities';

import {
    noop,
} from '@ripl/utilities';

function basicContextSetter<TKey extends GetMutableKeys<Context>>(key: TKey) {
    return (context: Context, value: Context[TKey]) => {
        context[key] = value;
    };
}

/** Maps element state properties to their corresponding context setter functions. */
export const CONTEXT_OPERATIONS = {
    direction: basicContextSetter('direction'),
    fill: basicContextSetter('fill'),
    filter: basicContextSetter('filter'),
    font: basicContextSetter('font'),
    fontKerning: basicContextSetter('fontKerning'),
    opacity: basicContextSetter('opacity'),
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
    stroke: basicContextSetter('stroke'),
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

/**
 * The subset of {@link CONTEXT_OPERATIONS} that actually write to the context, precomputed as an
 * array. Transform properties map to `noop` (they are applied via `applyTransform`), so excluding
 * them lets element rendering skip reading those getters for every element on every frame.
 */
export const CONTEXT_OPERATION_ENTRIES = (Object.entries(CONTEXT_OPERATIONS) as [
    keyof BaseElementState,
    (context: Context, value: unknown) => void
][]).filter(([, operation]) => operation !== noop);

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
    'dragstart',
    'drag',
    'dragend',
] as (keyof ElementEventMap)[];