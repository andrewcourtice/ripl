import type {
    Pattern,
} from './types';

/** Serializes a structured `Pattern` object back into its canonical `pattern(...)` paint string. */
export function serializePattern(pattern: Pattern): string {
    return `pattern(${pattern.type}, ${pattern.foreground}, ${pattern.background}, ${pattern.size})`;
}
