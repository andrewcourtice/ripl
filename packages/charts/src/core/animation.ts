/**
 * Shared animation vocabulary for charts.
 *
 * Centralises the durations, easing, stagger maths and exit behavior that were previously
 * hard-coded and inconsistent across charts (e.g. axis labels animating for a fixed 400ms while
 * series used 1000ms, and some charts destroying elements with no exit transition at all). All
 * timings derive from the chart's {@link ChartAnimationOptions} so `animation: false` reliably
 * renders instantly and a custom `duration`/`ease` is honored everywhere.
 */

import type {
    Ease,
    Element,
    ElementInterpolationState,
    Renderer,
} from '@ripl/core';

import type {
    ChartAnimationOptions,
} from './options';

import {
    resolveEase,
} from './options';

/** Reference durations (in ms, at the default animation speed) for each transition kind. */
export const ANIMATION_REFERENCE = {
    /** Reference duration, in milliseconds, for elements entering the chart. */
    enter: 1000,
    /** Reference duration, in milliseconds, for elements transitioning to new values. */
    update: 1000,
    /** Reference duration, in milliseconds, for elements leaving the chart. */
    exit: 450,
    /** Reference duration, in milliseconds, for hover feedback. */
    hover: 300,
    /** Reference duration, in milliseconds, for axis transitions. */
    axis: 500,
} as const;

/** A fully resolved animation ready to be applied to a transition. */
export interface ResolvedAnimation {
    /** Whether the transition animates (`false` snaps straight to the target state). */
    enabled: boolean;
    /** Transition duration in milliseconds (`0` when animation is disabled). */
    duration: number;
    /** The resolved easing function to apply. */
    ease: Ease;
}

/**
 * Resolves chart animation options for a given reference duration, scaling by the configured
 * speed and collapsing to `0`/disabled when animation is turned off.
 */
export function resolveAnimation(options: ChartAnimationOptions, reference: number = ANIMATION_REFERENCE.update): ResolvedAnimation {
    const enabled = options.enabled;
    const scale = options.duration / 1000;

    return {
        enabled,
        duration: enabled ? reference * scale : 0,
        ease: resolveEase(options.ease),
    };
}

/**
 * Computes a per-element stagger delay so that a collection of entering elements animate in
 * sequence rather than all at once. Returns `0` when there is nothing to stagger.
 */
export function stagger(index: number, length: number, totalDuration: number, fraction: number = 1): number {
    if (length <= 1 || totalDuration <= 0) {
        return 0;
    }

    return (index / length) * totalDuration * fraction;
}

/**
 * Transitions an element to a terminal state (defaulting to fully transparent) and then destroys
 * it, giving every chart a consistent exit animation. When animation is disabled the element is
 * destroyed immediately.
 */
export function exitElement<TElement extends Element>(
    renderer: Renderer,
    element: TElement,
    animation: ResolvedAnimation,
    state?: ElementInterpolationState<TElement extends Element<infer TState> ? TState : never>
): Promise<void> {
    if (!animation.enabled || animation.duration <= 0) {
        element.destroy();
        return Promise.resolve();
    }

    const terminalState = (state ?? { opacity: 0 }) as ElementInterpolationState<TElement extends Element<infer TState> ? TState : never>;

    return renderer.transition(element, {
        duration: animation.duration,
        ease: animation.ease,
        state: terminalState,
    }).then(() => {
        element.destroy();
    });
}
