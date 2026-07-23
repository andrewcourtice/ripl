import type {
    Ease,
} from './types';

/** Linear easing: no acceleration or deceleration. */
export const easeLinear: Ease = time => time;

/** Quadratic ease-in: accelerates from zero velocity. */
export const easeInQuad: Ease = time => time * time;

/** Quadratic ease-out: decelerates to zero velocity. */
export const easeOutQuad: Ease = time => time * (2 - time);

/** Quadratic ease-in-out: accelerates then decelerates. */
export const easeInOutQuad: Ease = time => time < 0.5 ? 2 * time * time : -1 + (4 - 2 * time) * time;

/** Cubic ease-in: accelerates from zero velocity. */
export const easeInCubic: Ease = time => time * time * time;

/** Cubic ease-out: decelerates to zero velocity. */
export const easeOutCubic: Ease = time => (time - 1) * (time - 1) * (time - 1) + 1;

/** Cubic ease-in-out: accelerates then decelerates. */
export const easeInOutCubic: Ease = time => time < 0.5 ? 4 * time * time * time : (time - 1) * (2 * time - 2) * ( 2 * time - 2) + 1;

/** Quartic ease-in: accelerates from zero velocity. */
export const easeInQuart: Ease = time => time * time * time * time;

/** Quartic ease-out: decelerates to zero velocity. */
export const easeOutQuart: Ease = time => 1 - (time - 1) * (time - 1) * (time - 1) * (time - 1);

/** Quartic ease-in-out: accelerates then decelerates. */
export const easeInOutQuart: Ease = time => time < 0.5 ? 8 * time * time * time * time : 1 - 8 * (time - 1) * (time - 1) * (time - 1) * (time - 1);

/** Quintic ease-in: accelerates from zero velocity. */
export const easeInQuint: Ease = time => time * time * time * time * time;

/** Quintic ease-out: decelerates to zero velocity. */
export const easeOutQuint: Ease = time => 1 + (time - 1) * (time - 1) * (time - 1) * (time - 1) * (time - 1);

/** Quintic ease-in-out: accelerates then decelerates. */
export const easeInOutQuint: Ease = time => time < 0.5 ? 16 * time * time * time * time * time : 1 + 16 * (time - 1) * (time - 1) * (time - 1) * (time - 1) * (time - 1);

/** Sine ease-in: accelerates from zero velocity along a sine curve. */
export const easeInSine: Ease = time => 1 - Math.cos((time * Math.PI) / 2);

/** Sine ease-out: decelerates to zero velocity along a sine curve. */
export const easeOutSine: Ease = time => Math.sin((time * Math.PI) / 2);

/** Sine ease-in-out: accelerates then decelerates along a sine curve. */
export const easeInOutSine: Ease = time => -(Math.cos(Math.PI * time) - 1) / 2;

/** Exponential ease-in: accelerates from zero velocity with a sharp exponential curve. */
export const easeInExpo: Ease = time => time === 0 ? 0 : 2 ** (10 * time - 10);

/** Exponential ease-out: decelerates to zero velocity with a sharp exponential curve. */
export const easeOutExpo: Ease = time => time === 1 ? 1 : 1 - 2 ** (-10 * time);

/** Exponential ease-in-out: accelerates then decelerates with a sharp exponential curve. */
export const easeInOutExpo: Ease = time => {
    if (time === 0 || time === 1) {
        return time;
    }

    if (time < 0.5) {
        return 2 ** (20 * time - 10) / 2;
    }

    return (2 - 2 ** (-20 * time + 10)) / 2;
};

/** Circular ease-in: accelerates from zero velocity along a circular arc. */
export const easeInCirc: Ease = time => 1 - Math.sqrt(1 - time * time);

/** Circular ease-out: decelerates to zero velocity along a circular arc. */
export const easeOutCirc: Ease = time => Math.sqrt(1 - (time - 1) * (time - 1));

/** Circular ease-in-out: accelerates then decelerates along a circular arc. */
export const easeInOutCirc: Ease = time => {
    if (time < 0.5) {
        return (1 - Math.sqrt(1 - (2 * time) * (2 * time))) / 2;
    }

    return (Math.sqrt(1 - (-2 * time + 2) * (-2 * time + 2)) + 1) / 2;
};

/** Bounce ease-out: decelerates with a series of diminishing bounces before settling on the target. */
export const easeOutBounce: Ease = time => {
    const n1 = 7.5625;
    const d1 = 2.75;

    if (time < 1 / d1) {
        return n1 * time * time;
    }

    if (time < 2 / d1) {
        const t = time - 1.5 / d1;

        return n1 * t * t + 0.75;
    }

    if (time < 2.5 / d1) {
        const t = time - 2.25 / d1;

        return n1 * t * t + 0.9375;
    }

    const t = time - 2.625 / d1;

    return n1 * t * t + 0.984375;
};

/** Bounce ease-in: accelerates with a series of diminishing bounces away from the start. */
export const easeInBounce: Ease = time => 1 - easeOutBounce(1 - time);

/** Bounce ease-in-out: bounces away from the start then onto the target. */
export const easeInOutBounce: Ease = time => {
    if (time < 0.5) {
        return (1 - easeOutBounce(1 - 2 * time)) / 2;
    }

    return (1 + easeOutBounce(2 * time - 1)) / 2;
};

/** Back ease-in: retreats slightly before accelerating toward the target (a subtle anticipation). */
export const easeInBack: Ease = time => {
    const c1 = 1.70158;
    const c3 = c1 + 1;

    return c3 * time * time * time - c1 * time * time;
};

/** Back ease-out: overshoots slightly past the target and settles back (a subtle spring). */
export const easeOutBack: Ease = time => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    const t = time - 1;

    return 1 + c3 * t * t * t + c1 * t * t;
};

/** Back ease-in-out: retreats before accelerating, overshoots, then settles back. */
export const easeInOutBack: Ease = time => {
    const c1 = 1.70158;
    const c2 = c1 * 1.525;

    if (time < 0.5) {
        return ((2 * time) * (2 * time) * ((c2 + 1) * 2 * time - c2)) / 2;
    }

    return ((2 * time - 2) * (2 * time - 2) * ((c2 + 1) * (2 * time - 2) + c2) + 2) / 2;
};

/** Elastic ease-in: winds up with decaying oscillation before springing toward the target. */
export const easeInElastic: Ease = time => {
    if (time === 0 || time === 1) {
        return time;
    }

    const c4 = (2 * Math.PI) / 3;

    return -(2 ** (10 * time - 10)) * Math.sin((time * 10 - 10.75) * c4);
};

/** Elastic ease-out: springs past the target and oscillates with decaying amplitude before settling. */
export const easeOutElastic: Ease = time => {
    if (time === 0 || time === 1) {
        return time;
    }

    const c4 = (2 * Math.PI) / 3;

    return 2 ** (-10 * time) * Math.sin((time * 10 - 0.75) * c4) + 1;
};

/** Elastic ease-in-out: winds up, springs across, and oscillates with decaying amplitude before settling. */
export const easeInOutElastic: Ease = time => {
    if (time === 0 || time === 1) {
        return time;
    }

    const c5 = (2 * Math.PI) / 4.5;

    if (time < 0.5) {
        return -(2 ** (20 * time - 10) * Math.sin((20 * time - 11.125) * c5)) / 2;
    }

    return (2 ** (-20 * time + 10) * Math.sin((20 * time - 11.125) * c5)) / 2 + 1;
};