/** A function that interpolates between two values based on a normalised position (0–1). */
export type Interpolator<TValue = number> = (position: number) => TValue;

/** A callable with a `test` method used to determine whether the factory can handle a given value. */
export type PredicatedFunction = {
    /** Tests whether this factory can interpolate the given value. */
    test?(value: unknown): boolean;
};

/** A factory that creates an interpolator between two values of the same type, with a `test` predicate for type matching. */
export type InterpolatorFactory<TOut = number, TIn = TOut> = {
    /** Creates an interpolator that transitions from `valueA` to `valueB`. */
    (valueA: TIn, valueB: TIn): Interpolator<TOut>;
} & PredicatedFunction;