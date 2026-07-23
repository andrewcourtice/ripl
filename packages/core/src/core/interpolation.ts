/**
 * Element interpolation engine: resolves per-property interpolators (including keyframe
 * schedules) for {@link Element.interpolate} transitions.
 */

import {
    TRANSFORM_INTERPOLATORS,
} from './constants';

import {
    scaleContinuous,
} from '../scales';

import {
    interpolateAny,
    interpolateBorderRadius,
    interpolateColor,
    interpolateDate,
    interpolateGradient,
    interpolateNumber,
    interpolatePoints,
} from '../interpolators';

import type {
    Interpolator,
    InterpolatorFactory,
} from '../interpolators';

import {
    typeIsArray,
    typeIsNil,
    typeIsObject,
} from '@ripl/utilities';

import type {
    ElementInterpolationKeyFrame,
} from './element';

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
    const interpolators = Array.from({ length: keyframes.length - 1 }, (_, index) => {
        const frameA = keyframes[index];
        const frameB = keyframes[index + 1];
        const scale = scaleContinuous([frameA.offset, frameB.offset], [0, 1]);
        const interpolate = interpolator(frameA.value, frameB.value);

        return (time: number) => interpolate(scale(time));
    });

    return time => interpolators[Math.min(Math.floor(frameScale(time)), interpolators.length - 1)](time);
}

export function getInterpolator<TValue>(value: TValue, key?: string) {
    if (key && TRANSFORM_INTERPOLATORS[key]) {
        return TRANSFORM_INTERPOLATORS[key] as InterpolatorFactory<TValue>;
    }

    const interpolator = [
        interpolateNumber,
        interpolateGradient,
        interpolateColor,
        interpolateDate,
        interpolatePoints,
        interpolateBorderRadius,
    ].find(({ test }) => !!test?.(value));

    return (interpolator ?? interpolateAny) as InterpolatorFactory<TValue>;
}
