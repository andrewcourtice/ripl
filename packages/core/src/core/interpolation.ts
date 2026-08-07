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
    interpolatePattern,
    interpolatePoints,
} from '../interpolators';

import type {
    Interpolator,
    InterpolatorFactory,
} from '../interpolators';

import {
    arrayMapRange,
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
    const interpolators = arrayMapRange(keyframes.length - 1, index => {
        const frameA = keyframes[index];
        const frameB = keyframes[index + 1];
        const scale = scaleContinuous([frameA.offset, frameB.offset], [0, 1]);
        const interpolate = interpolator(frameA.value, frameB.value);

        return (time: number) => interpolate(scale(time));
    });

    return time => interpolators[Math.min(Math.floor(frameScale(time)), interpolators.length - 1)](time);
}

// Registered factories are consulted before the built-ins, because a built-in predicate can be
// broader than a package's own: interpolateBorderRadius matches any array of up to four numbers,
// which would claim a 3D vector before @ripl/3d's own interpolator ever saw it.
const registeredInterpolators: InterpolatorFactory<never>[] = [];

/**
 * Registers an interpolator factory for {@link getInterpolator} to consider.
 *
 * A package that adds a value type — a 3D vector, a quaternion — registers its interpolator here so
 * a transition on that type animates rather than snapping. Registered factories are tried before
 * the built-ins and in registration order, and each must carry a `test` predicate. Registering the
 * same factory twice is a no-op.
 *
 * @param interpolator - The factory to register. Ignored when it has no `test` predicate.
 * @typeParam TValue - The value type the factory interpolates.
 */
export function registerInterpolator<TValue>(interpolator: InterpolatorFactory<TValue>): void {
    const entry = interpolator as unknown as InterpolatorFactory<never>;

    if (!interpolator.test || registeredInterpolators.includes(entry)) {
        return;
    }

    registeredInterpolators.push(entry);
}

export function getInterpolator<TValue>(value: TValue, key?: string) {
    if (key && TRANSFORM_INTERPOLATORS[key]) {
        return TRANSFORM_INTERPOLATORS[key] as InterpolatorFactory<TValue>;
    }

    const interpolator = [
        ...registeredInterpolators,
        interpolateNumber,
        interpolateGradient,
        interpolatePattern,
        interpolateColor,
        interpolateDate,
        interpolatePoints,
        interpolateBorderRadius,
    ].find(({ test }) => !!test?.(value));

    return (interpolator ?? interpolateAny) as InterpolatorFactory<TValue>;
}
