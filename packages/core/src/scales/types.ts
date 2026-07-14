/** A function that maps a value from one space to another. */
export type ScaleMethod<TInput = number, TOutput = number> = (value: TInput) => TOutput;

/** A callable scale with domain, range, inverse mapping, tick generation, and inclusion testing. */
export interface Scale<TDomain = number, TRange = number> {
    /** Maps a value from the input domain to the output range. */
    (value: TDomain): TRange;
    /** The input domain the scale maps from. */
    domain: TDomain[];
    /** The output range the scale maps to. */
    range: TRange[];
    /** Maps a value from the range back to its corresponding domain value. */
    inverse: ScaleMethod<TRange, TDomain>;
    /** Generates approximately `count` evenly spaced tick values across the domain. */
    ticks(count?: number): TDomain[];
    /** Tests whether a value falls within the scale's domain. */
    includes(value: TDomain): boolean;
}