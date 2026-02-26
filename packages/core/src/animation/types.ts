export type Ease = (time: number) => number;
export type TransitionCallback = (time: number) => void;
export type TransitionDirection = 'forward' | 'reverse';

export interface TransitionOptions {
    duration: number;
    ease: Ease;
    loop: boolean;
    delay: number;
    direction: TransitionDirection;
}