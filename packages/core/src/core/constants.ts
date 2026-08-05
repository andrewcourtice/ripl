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
    functionNoop,
} from '@ripl/utilities';

function basicContextSetter<TKey extends GetMutableKeys<Context>>(key: TKey) {
    return (context: Context, value: Context[TKey]) => {
        context[key] = value;
    };
}

function multiplicativeOpacitySetter(context: Context, value: number) {
    context.opacity *= value;
}

/**
 * Maps element state properties to their corresponding context setter functions.
 *
 * Every property assigns except `opacity`, which composites **multiplicatively**: an element's
 * own alpha stacks under whatever its ancestor groups already accumulated rather than replacing
 * it, matching how the DOM composites nested `opacity`. Note this is the *operation*'s contract,
 * not {@link Context.opacity}'s — assigning that property still replaces.
 */
export const CONTEXT_OPERATIONS = {
    direction: basicContextSetter('direction'),
    fill: basicContextSetter('fill'),
    filter: basicContextSetter('filter'),
    font: basicContextSetter('font'),
    fontKerning: basicContextSetter('fontKerning'),
    opacity: multiplicativeOpacitySetter,
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
    translateX: functionNoop,
    translateY: functionNoop,
    transformScaleX: functionNoop,
    transformScaleY: functionNoop,
    rotation: functionNoop,
    transformOriginX: functionNoop,
    transformOriginY: functionNoop,
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

/**
 * State properties that change how an element is painted or placed, but not the geometry it traces.
 *
 * A path is authored in the element's own local space and the transform is applied to the context,
 * not to the path, so neither paint nor transform changes can invalidate it. Anything absent from
 * this set — every element-specific property, plus the text and stroke-width properties that move
 * glyphs or insets — is treated as geometry and re-traces the path.
 */
export const NON_GEOMETRY_STATE_KEYS = new Set<PropertyKey>([
    'fill',
    'filter',
    'globalCompositeOperation',
    'lineCap',
    'lineDash',
    'lineDashOffset',
    'lineJoin',
    'miterLimit',
    'opacity',
    'rotation',
    'shadowBlur',
    'shadowColor',
    'shadowOffsetX',
    'shadowOffsetY',
    'stroke',
    'transformOriginX',
    'transformOriginY',
    'transformScaleX',
    'transformScaleY',
    'translateX',
    'translateY',
    'zIndex',
]);

/** DOM event types that are tracked and forwarded to elements for hit testing and interaction. */
export const TRACKED_EVENTS = [
    'click',
    'mousedown',
    'mouseup',
    'mousemove',
    'mouseenter',
    'mouseleave',
    'dragstart',
    'drag',
    'dragend',
] as (keyof ElementEventMap)[];