export type Ease = (time: number) => number;
export type TransitionCallback = (time: number) => void;

export interface TransitionOptions {
    duration: number;
    ease: Ease;
    loop: boolean;
    //delay: number | ((index: number) => number);
}