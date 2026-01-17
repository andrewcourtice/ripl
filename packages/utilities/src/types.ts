export type AnyObject = { [key: PropertyKey]: unknown };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFunction = (...args: any[]) => any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyAsyncFunction = (...args: any[]) => any;
export type OneOrMore<TValue> = TValue | TValue[];
export type Predicate<TLeft, TRight = TLeft> = (left: TLeft, right: TRight) => boolean;
export type Indexer<TValue> = (value: TValue) => PropertyKey;

export type Merge<TA, TB> = Omit<TA, keyof TB> & TB;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UnionToIntersection<U> = (U extends any ? (arg: U) => any : never) extends ((arg: infer I) => void) ? I : never;

export type IfEquals<X, Y, A = X, B = never> =
    (<TValue>() => TValue extends X ? 1 : 2) extends
    (<TValue>() => TValue extends Y ? 1 : 2) ? A : B;

export type GetReadonlyKeys<TValue extends object> = {
    [TKey in keyof TValue]-?: IfEquals<{ [Q in TKey]: TValue[TKey] }, { -readonly [Q in TKey]: TValue[TKey] }, never, TKey>
}[keyof TValue];

export type GetMutableKeys<TValue extends object> = {
    [TKey in keyof TValue]-?: IfEquals<{ [Q in TKey]: TValue[TKey] }, { -readonly [Q in TKey]: TValue[TKey] }, TKey>;
}[keyof TValue];

export interface Disposable {
    dispose: () => void;
}
