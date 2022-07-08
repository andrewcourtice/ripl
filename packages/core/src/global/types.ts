export type OneOrMore<TValue> = TValue | TValue[];

export interface Disposable {
    dispose: () => void;
}