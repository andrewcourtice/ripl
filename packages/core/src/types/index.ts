export type TransitionFunction<TValue = number> = (time: number) => TValue;
export type TransitionBound<TValue = number> = [start: TValue, end: TValue]
export type Transitionable<TValue = number> = TValue | TransitionBound<TValue> | TransitionFunction<TValue>;