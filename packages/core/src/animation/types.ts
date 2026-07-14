/** An easing function that maps a linear progress value (0–1) to an eased output value. */
export type Ease = (time: number) => number;

/** Callback invoked on each animation frame with the current eased time value (0–1). */
export type TransitionCallback = (time: number) => void;

/** The playback direction of a transition. */
export type TransitionDirection = 'forward' | 'reverse';

/** Controls whether a transition loops: `true` restarts from the beginning, `'alternate'` ping-pongs direction each iteration. */
export type TransitionLoopMode = boolean | 'alternate';

/** Configuration for a transition animation. */
export interface TransitionOptions {
    /** The transition's duration in milliseconds. */
    duration: number;
    /** The easing function applied to the transition's progress. */
    ease: Ease;
    /** Whether and how the transition loops once complete. */
    loop: TransitionLoopMode;
    /** The delay before the transition starts, in milliseconds. */
    delay: number;
    /** The playback direction of the transition. */
    direction: TransitionDirection;
}