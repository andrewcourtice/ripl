import type {
    Ease,
} from './types';

export const easeLinear: Ease = time => time;
export const easeInQuad: Ease = time => time * time;
export const easeOutQuad: Ease = time => time * (2 - time);
export const easeInOutQuad: Ease = time => time < 0.5 ? 2 * time * time : -1 + (4 - 2 * time) * time;
export const easeInCubic: Ease = time => time * time * time;
export const easeOutCubic: Ease = time => (--time) * time * time + 1;
export const easeInOutCubic: Ease = time => time < 0.5 ? 4 * time * time * time : (time - 1) * (2 * time - 2) * ( 2 * time - 2) + 1;
export const easeInQuart: Ease = time => time * time * time * time;
export const easeOutQuart: Ease = time => 1 - (--time) * time * time * time;
export const easeInOutQuart: Ease = time => time < 0.5 ? 8 * time * time * time * time : 1 - 8 * (--time) * time * time * time;
export const easeInQuint: Ease = time => time * time * time * time * time;
export const easeOutQuint: Ease = time => 1 + (--time) * time * time * time * time;
export const easeInOutQuint: Ease = time => time < 0.5 ? 16 * time * time * time * time * time : 1 + 16 * (--time) * time * time * time * time;