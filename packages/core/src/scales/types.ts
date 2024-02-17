export type ScaleMethod<TInput = number, TOutput = number> = (value: TInput) => TOutput;

export interface Scale<TDomain = number, TRange = number> {
    (value: TDomain): TRange;
    domain: TDomain[];
    range: TRange[];
    inverse: ScaleMethod<TRange, TDomain>;
    ticks(count?: number): TDomain[];
    includes(value: TDomain): boolean;
}