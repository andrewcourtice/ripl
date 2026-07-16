/** Generates a cryptographically random hexadecimal string of the specified length (default 8 characters / 32 bits). */
export function stringUniqueId(length: number = 8): string {
    const container = new Uint8Array(length / 2);
    globalThis.crypto.getRandomValues(container);

    return Array.from(container, value => value.toString(16).padStart(2, '0')).join('');
}

/** Case-insensitive string equality check. */
export function stringEquals(valueA: string, valueB: string) {
    return valueA.toLowerCase() === valueB.toLowerCase();
}