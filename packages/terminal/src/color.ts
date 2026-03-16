import {
    parseColor,
} from '@ripl/core';

/** ANSI SGR reset sequence. */
export const ANSI_RESET = '\x1b[0m';

/** Converts a CSS color string to an ANSI truecolor foreground escape sequence. Returns empty string for invalid/transparent colors. */
export function colorToAnsiFg(color: string): string {
    if (!color || color === 'none' || color === 'transparent') {
        return '';
    }

    const parsed = parseColor(color);

    if (!parsed) {
        return '';
    }

    const [r, g, b] = parsed;

    return `\x1b[38;2;${r};${g};${b}m`;
}

/** Converts a CSS color string to an ANSI truecolor background escape sequence. Returns empty string for invalid/transparent colors. */
export function colorToAnsiBg(color: string): string {
    if (!color || color === 'none' || color === 'transparent') {
        return '';
    }

    const parsed = parseColor(color);

    if (!parsed) {
        return '';
    }

    const [r, g, b] = parsed;

    return `\x1b[48;2;${r};${g};${b}m`;
}
