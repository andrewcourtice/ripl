/** An easing function that maps a linear progress value (0–1) to an eased output value. */
export type Ease = (time: number) => number;

/** Callback invoked on each animation frame with the current eased time value (0–1). */
export type TransitionCallback = (time: number) => void;

/** The playback direction of a transition. */
export type TransitionDirection = 'forward' | 'reverse';

/** Configuration for a transition animation. */
export interface TransitionOptions {
    duration: number;
    ease: Ease;
    loop: boolean;
    delay: number;
    direction: TransitionDirection;
}