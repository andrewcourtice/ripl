export function interpolateNumber(valueA: number, valueB: number, position: number): number {
    return valueA + (valueB - valueA) * position;
}