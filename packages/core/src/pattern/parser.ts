import {
    DEFAULT_PATTERN_BACKGROUND,
    DEFAULT_PATTERN_FOREGROUND,
    DEFAULT_PATTERN_SIZE,
    PATTERN_TYPES,
} from './constants';

import type {
    Pattern,
    PatternType,
} from './types';


const PATTERN_REGEX = /^pattern\((.+)\)$/is;
const SIZE_REGEX = /^(\d*\.?\d+)(px)?$/i;
const MAX_PATTERN_ARGS = 4;

function splitPatternArgs(input: string): string[] {
    const args: string[] = [];
    let depth = 0;
    let current = '';

    for (let i = 0; i < input.length; i++) {
        const char = input[i];

        if (char === '(') {
            depth++;
            current += char;
        } else if (char === ')') {
            depth--;
            current += char;
        } else if (char === ',' && depth === 0) {
            args.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    if (current.trim()) {
        args.push(current.trim());
    }

    return args;
}

function parsePatternType(value: string): PatternType | undefined {
    const type = value.toLowerCase() as PatternType;

    return PATTERN_TYPES.includes(type)
        ? type
        : undefined;
}

function parsePatternSize(value: string): number | undefined {
    const match = SIZE_REGEX.exec(value);

    if (!match) {
        return undefined;
    }

    const size = parseFloat(match[1]);

    return size > 0
        ? size
        : undefined;
}

/**
 * Parses a `pattern(...)` paint string into a structured {@link Pattern} object.
 *
 * The grammar is `pattern(<type>[, <foreground>[, <background>[, <size>]]])` where `<type>` is one
 * of the built-in {@link PATTERN_TYPES}, `<foreground>`/`<background>` are CSS colors, and `<size>`
 * is the square tile size in user-space pixels (an optional `px` suffix is accepted).
 *
 * @param value - The paint string to parse, e.g. `pattern(diagonal, #1a6, #fff0, 8)`.
 * @returns The parsed pattern, or `null` when the string is not a valid pattern.
 */
export function parsePattern(value: string): Pattern | null {
    const match = PATTERN_REGEX.exec(value.trim());

    if (!match) {
        return null;
    }

    const args = splitPatternArgs(match[1]);

    if (args.length === 0 || args.length > MAX_PATTERN_ARGS || args.some(arg => !arg)) {
        return null;
    }

    const type = parsePatternType(args[0]);

    if (!type) {
        return null;
    }

    const size = args[3] === undefined
        ? DEFAULT_PATTERN_SIZE
        : parsePatternSize(args[3]);

    if (size === undefined) {
        return null;
    }

    return {
        type,
        foreground: args[1] ?? DEFAULT_PATTERN_FOREGROUND,
        background: args[2] ?? DEFAULT_PATTERN_BACKGROUND,
        size,
    };
}

/** Tests whether a string looks like a `pattern(...)` paint value (cheap shape check; use {@link parsePattern} to validate fully). */
export function isPatternString(value: string): boolean {
    return PATTERN_REGEX.test(value.trim());
}
