export type Interpolator<TValue = number> = (position: number) => TValue;

export type PredicatedFunction = {
    test?(value: unknown): boolean;
}

export type InterpolatorFactory<TOut = number, TIn = TOut> = {
    (valueA: TIn, valueB: TIn): Interpolator<TOut>;
} & PredicatedFunction;