import type {
    Pattern,
} from './types';

/** Serialises a structured `Pattern` object back into its canonical `pattern(...)` paint string. */
export function serialisePattern(pattern: Pattern): string {
    return `pattern(${pattern.type}, ${pattern.foreground}, ${pattern.background}, ${pattern.size})`;
}
