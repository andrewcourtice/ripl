export type OneOrMore<TValue> = TValue | TValue[];
export type Predicate<TLeft, TRight = TLeft> = (left: TLeft, right: TRight) => boolean;
export type Indexer<TValue> = (value: TValue) => PropertyKey;

export interface Disposable {
    dispose: () => void;
}