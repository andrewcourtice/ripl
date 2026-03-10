/** A function that maps a value from one space to another. */
export type ScaleMethod<TInput = number, TOutput = number> = (value: TInput) => TOutput;

/** A callable scale with domain, range, inverse mapping, tick generation, and inclusion testing. */
export interface Scale<TDomain = number, TRange = number> {
    (value: TDomain): TRange;
    domain: TDomain[];
    range: TRange[];
    inverse: ScaleMethod<TRange, TDomain>;
    ticks(count?: number): TDomain[];
    includes(value: TDomain): boolean;
}