/** A loosely-typed object with string, number, or symbol keys. */
export type AnyObject = { [key: PropertyKey]: unknown };

/** A loosely-typed function signature that accepts and returns anything. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFunction = (...args: any[]) => any;

/** A loosely-typed async function signature. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyAsyncFunction = (...args: any[]) => any;

/** Represents a single value or an array of values. */
export type OneOrMore<TValue> = TValue | TValue[];

/** A comparison function that tests whether two values match. */
export type Predicate<TLeft, TRight = TLeft> = (left: TLeft, right: TRight) => boolean;

/** Derives a grouping key from a value. */
export type Indexer<TValue> = (value: TValue) => PropertyKey;

/** Merges two types, with properties in `TB` overriding those in `TA`. */
export type Merge<TA, TB> = Omit<TA, keyof TB> & TB;

/** Converts a union type to an intersection type. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UnionToIntersection<U> = (U extends any ? (arg: U) => any : never) extends ((arg: infer I) => void) ? I : never;

/** Conditional type that resolves to `A` if `X` and `Y` are identical, otherwise `B`. */
export type IfEquals<X, Y, A = X, B = never> =
    (<TValue>() => TValue extends X ? 1 : 2) extends
    (<TValue>() => TValue extends Y ? 1 : 2) ? A : B;

/** Extracts the readonly property keys from an object type. */
export type GetReadonlyKeys<TValue extends object> = {
    [TKey in keyof TValue]-?: IfEquals<{ [Q in TKey]: TValue[TKey] }, { -readonly [Q in TKey]: TValue[TKey] }, never, TKey>
}[keyof TValue];

/** Extracts the mutable (non-readonly) property keys from an object type. */
export type GetMutableKeys<TValue extends object> = {
    [TKey in keyof TValue]-?: IfEquals<{ [Q in TKey]: TValue[TKey] }, { -readonly [Q in TKey]: TValue[TKey] }, TKey>;
}[keyof TValue];

/** A resource that can be disposed to release underlying subscriptions or handles. */
export interface Disposable {
    dispose: () => void;
}
