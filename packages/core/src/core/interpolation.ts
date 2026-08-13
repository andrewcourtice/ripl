/**
 * Element interpolation engine: resolves per-property interpolators (including keyframe
 * schedules) for {@link Element.interpolate} transitions.
 */

import {
    scaleContinuous,
} from '../scales';

import {
    interpolateAny,
    interpolateColor,
    interpolateDate,
    interpolateGradient,
    interpolateNumber,
    interpolateNumbers,
    interpolatePattern,
    interpolatePoints,
} from '../interpolators';

import type {
    Interpolator,
    InterpolatorFactory,
    PredicatedFunction,
} from '../interpolators';

import {
    arrayMapRange,
    typeIsArray,
    typeIsNil,
    typeIsObject,
} from '@ripl/utilities';

import type {
    ElementInterpolationKeyFrame,
    ElementInterpolator,
} from './element';

import type {
    OneOrMore,
} from '@ripl/utilities';

const DEFAULT_INTERPOLATORS = [
    interpolateNumber,
    interpolateGradient,
    interpolatePattern,
    interpolateColor,
    interpolateDate,
    interpolatePoints,
    interpolateNumbers,
] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isElementValueKeyFrame(value: unknown): value is ElementInterpolationKeyFrame<any>[] {
    return typeIsArray(value) && value.every(keyframe => typeIsObject(keyframe) && 'value' in keyframe);
}

export function getKeyframeInterpolator<TValue>(currentValue: TValue, frames: ElementInterpolationKeyFrame<TValue>[], interpolator: InterpolatorFactory<TValue>): Interpolator<TValue | undefined> {
    let keyframes = ([{
        offset: 0,
        value: currentValue,
    }] as { offset: number;
        value: TValue; }[]).concat(
        frames.map(frame => ({
            offset: frame.offset ?? 0,
            value: frame.value,
        }))
    );

    keyframes = frames.map(({ offset, value }, index) => ({
        value,
        offset: typeIsNil(offset) ? index / (keyframes.length - 1) : offset,
    }));

    if (keyframes.at(-1)?.offset !== 1) {
        keyframes.push({
            offset: 1,
            value: keyframes.at(-1)?.value ?? currentValue,
        });
    }

    keyframes.sort(({ offset: oa }, { offset: ob }) => oa - ob);

    const frameScale = scaleContinuous([0, 1], [0, keyframes.length - 1], { clamp: true });
    const interpolators = arrayMapRange(keyframes.length - 1, index => {
        const frameA = keyframes[index];
        const frameB = keyframes[index + 1];
        const scale = scaleContinuous([frameA.offset, frameB.offset], [0, 1]);
        const interpolate = interpolator(frameA.value, frameB.value);

        return (time: number) => interpolate(scale(time));
    });

    return time => interpolators[Math.min(Math.floor(frameScale(time)), interpolators.length - 1)](time);
}

// A declared factory carrying no predicate is an explicit choice, so it claims the value outright.
function claims(interpolator: PredicatedFunction, value: unknown): boolean {
    return !interpolator.test || interpolator.test(value);
}

export function getInterpolator<TValue>(value: TValue, interpolators?: OneOrMore<ElementInterpolator<NonNullable<NoInfer<TValue>>>>) {
    if (typeIsNil(interpolators)) {
        return (DEFAULT_INTERPOLATORS.find(({ test }) => !!test?.(value)) ?? interpolateAny) as InterpolatorFactory<TValue>;
    }

    // Not normalised to an array first: one declared factory is the common case, on a per-frame path.
    if (!typeIsArray(interpolators)) {
        return (claims(interpolators, value) ? interpolators : interpolateAny) as InterpolatorFactory<TValue>;
    }

    return (interpolators.find(entry => claims(entry, value)) ?? interpolateAny) as InterpolatorFactory<TValue>;
}
