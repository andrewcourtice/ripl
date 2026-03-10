/** Generates a cryptographically random hexadecimal string of the specified length. */
export function stringUniqueId(length: number = 6): string {
    const container = new Uint8Array(length / 2);
    globalThis.crypto.getRandomValues(container);

    return container.reduce((output, value) => {
        return output + value.toString(16).padStart(2, '0');
    }, '');
}

/** Case-insensitive string equality check. */
export function stringEquals(valueA: string, valueB: string) {
    return valueA.toLowerCase() === valueB.toLowerCase();
}