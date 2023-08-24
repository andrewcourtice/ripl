export function comparitorNumeric(valueA: number, valueB: number): number {
    return +valueA - +valueB;
}

export function comparitorDate(valueA: Date, valueB: Date): number {
    return comparitorNumeric(valueA.getTime(), valueB.getTime());
}

export function comparitorString(valueA: string, valueB: string): number {
    return valueA.localeCompare(valueB);
}