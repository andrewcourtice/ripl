export function predicateIdentity(valueA: unknown, valueB: unknown): boolean {
    return valueA === valueB;
}

export function predicateKey<TValue extends Record<PropertyKey, unknown>>(valueA: TValue, valueB: TValue, key: PropertyKey): boolean {
    return valueA[key] === valueB[key];
}