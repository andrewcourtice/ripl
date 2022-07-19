export type OneOrMore<TValue> = TValue | TValue[];
export type Predicate<TValue> = (left: TValue, right: TValue) => boolean;
export type Indexer<TValue> = (value: TValue) => PropertyKey;

export interface Disposable {
    dispose: () => void;
}