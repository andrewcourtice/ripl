import type {
    Ease,
} from './types';

/** Linear easing — no acceleration or deceleration. */
export const easeLinear: Ease = time => time;

/** Quadratic ease-in — accelerates from zero velocity. */
export const easeInQuad: Ease = time => time * time;

/** Quadratic ease-out — decelerates to zero velocity. */
export const easeOutQuad: Ease = time => time * (2 - time);

/** Quadratic ease-in-out — accelerates then decelerates. */
export const easeInOutQuad: Ease = time => time < 0.5 ? 2 * time * time : -1 + (4 - 2 * time) * time;

/** Cubic ease-in — accelerates from zero velocity. */
export const easeInCubic: Ease = time => time * time * time;

/** Cubic ease-out — decelerates to zero velocity. */
export const easeOutCubic: Ease = time => (time - 1) * (time - 1) * (time - 1) + 1;

/** Cubic ease-in-out — accelerates then decelerates. */
export const easeInOutCubic: Ease = time => time < 0.5 ? 4 * time * time * time : (time - 1) * (2 * time - 2) * ( 2 * time - 2) + 1;

/** Quartic ease-in — accelerates from zero velocity. */
export const easeInQuart: Ease = time => time * time * time * time;

/** Quartic ease-out — decelerates to zero velocity. */
export const easeOutQuart: Ease = time => 1 - (time - 1) * (time - 1) * (time - 1) * (time - 1);

/** Quartic ease-in-out — accelerates then decelerates. */
export const easeInOutQuart: Ease = time => time < 0.5 ? 8 * time * time * time * time : 1 - 8 * (time - 1) * (time - 1) * (time - 1) * (time - 1);

/** Quintic ease-in — accelerates from zero velocity. */
export const easeInQuint: Ease = time => time * time * time * time * time;

/** Quintic ease-out — decelerates to zero velocity. */
export const easeOutQuint: Ease = time => 1 + (time - 1) * (time - 1) * (time - 1) * (time - 1) * (time - 1);

/** Quintic ease-in-out — accelerates then decelerates. */
export const easeInOutQuint: Ease = time => time < 0.5 ? 16 * time * time * time * time * time : 1 + 16 * (time - 1) * (time - 1) * (time - 1) * (time - 1) * (time - 1);