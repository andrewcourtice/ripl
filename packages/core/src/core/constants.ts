import {
    Context,
    resolveRotation,
    resolveTransformOrigin,
} from '../context';

import {
    BaseElementState,
    Element,
    ElementEventMap,
} from './element';

import {
    GetMutableKeys,
    typeIsString,
} from '@ripl/utilities';

function basicContextSetter<TKey extends GetMutableKeys<Context>>(key: TKey) {
    return (context: Context, value: Context[TKey]) => {
        context[key] = value;
    };
}

export function applyTransform(context: Context, _value: unknown, element: Element) {
    const translateX = element.translateX ?? 0;
    const translateY = element.translateY ?? 0;
    const scaleX = element.transformScaleX ?? 1;
    const scaleY = element.transformScaleY ?? 1;
    const rawRotation = element.rotation ?? 0;
    const rawOriginX = element.transformOriginX ?? 0;
    const rawOriginY = element.transformOriginY ?? 0;

    const rotation = resolveRotation(rawRotation);

    const hasTranslate = translateX !== 0 || translateY !== 0;
    const hasScale = scaleX !== 1 || scaleY !== 1;
    const hasRotation = rotation !== 0;
    const hasOrigin = rawOriginX !== 0 || rawOriginY !== 0;

    if (!hasTranslate && !hasScale && !hasRotation) {
        return;
    }

    let originX = 0;
    let originY = 0;

    if (hasOrigin) {
        const needsBBox = typeIsString(rawOriginX) || typeIsString(rawOriginY);
        const box = needsBBox ? element.getBoundingBox() : null;

        originX = resolveTransformOrigin(rawOriginX, box?.width ?? 0);
        originY = resolveTransformOrigin(rawOriginY, box?.height ?? 0);

        if (needsBBox && box) {
            originX += box.left;
            originY += box.top;
        }
    }

    context.translate(originX + translateX, originY + translateY);

    if (hasRotation) {
        context.rotate(rotation);
    }

    if (hasScale) {
        context.scale(scaleX, scaleY);
    }

    if (hasOrigin) {
        context.translate(-originX, -originY);
    }
}

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

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

export const TRACKED_EVENTS = [
    'click',
    'mousemove',
    'mouseenter',
    'mouseleave',
] as (keyof ElementEventMap)[];