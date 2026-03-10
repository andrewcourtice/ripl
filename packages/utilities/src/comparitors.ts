/** Numeric comparator suitable for sorting numbers in ascending order. */
export function comparitorNumeric(valueA: number, valueB: number): number {
    return +valueA - +valueB;
}

/** Date comparator suitable for sorting dates in ascending chronological order. */
export function comparitorDate(valueA: Date, valueB: Date): number {
    return comparitorNumeric(valueA.getTime(), valueB.getTime());
}

/** Locale-aware string comparator suitable for alphabetical sorting. */
export function comparitorString(valueA: string, valueB: string): number {
    return valueA.localeCompare(valueB);
}