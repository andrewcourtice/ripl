export function comparitorNumeric(valueA: number, valueB: number): number {
    return +valueA - +valueB;
}

export function comparitorDate(valueA: Date, valueB: Date): number {
    return comparitorNumeric(valueA.getTime(), valueB.getTime());
}