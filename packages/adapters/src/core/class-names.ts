import {
    typeIsArray,
    typeIsObject,
    typeIsString,
} from '@ripl/utilities';

/**
 * Flattens any of the class binding forms a UI framework accepts — a string, a nested array, or an
 * object whose truthy keys are the active names — into one space-separated string.
 *
 * Idempotent, so a value that has already been normalised still compares equal to itself. That is
 * what lets a `class` binding be diffed by identity alongside every other prop.
 *
 * @param value - The class binding to normalise.
 * @returns The class names as a space-separated string, empty when there are none.
 */
export function normalizeClass(value: unknown): string {
    if (typeIsString(value)) {
        return value.trim();
    }

    if (typeIsArray(value)) {
        return value.map(normalizeClass).filter(Boolean).join(' ');
    }

    if (typeIsObject(value)) {
        const names = value as Record<string, unknown>;

        return Object.keys(names).filter(name => names[name]).join(' ');
    }

    return '';
}

/**
 * Splits any of the class binding forms into individual class names.
 *
 * @param value - The class binding to split.
 * @returns The individual class names.
 */
export function resolveClassNames(value: unknown): string[] {
    return normalizeClass(value).split(/\s+/).filter(Boolean);
}
