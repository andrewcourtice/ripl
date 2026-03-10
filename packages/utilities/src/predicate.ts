/** Tests strict reference equality between two values. */
export function predicateIdentity(valueA: unknown, valueB: unknown): boolean {
    return valueA === valueB;
}

/** Tests whether two objects share the same value at a given key. */
export function predicateKey<TValue extends Record<PropertyKey, unknown>>(valueA: TValue, valueB: TValue, key: PropertyKey): boolean {
    return valueA[key] === valueB[key];
}