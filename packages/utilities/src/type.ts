import {
    AnyFunction,
} from './types';

/** Checks whether a value is an array. */
export function typeIsArray(value: unknown): value is unknown[] {
    return Array.isArray(value);
}

/** Checks whether a value is a `Date` instance. */
export function typeIsDate(value: unknown): value is Date {
    return value instanceof Date;
}

/** Checks whether a value is a non-null object. */
export function typeIsObject(value: unknown): value is object {
    return value !== null && typeof value === 'object';
}

/** Checks whether a value is a boolean. */
export function typeIsBoolean(value: unknown): value is boolean {
    return typeof value === 'boolean';
}

/** Checks whether a value is a function. */
export function typeIsFunction(value: unknown): value is AnyFunction {
    return typeof value === 'function';
}

/** Checks whether a value is a number. */
export function typeIsNumber(value: unknown): value is number {
    return typeof value === 'number';
}

/** Checks whether a value is a string. */
export function typeIsString(value: unknown): value is string {
    return typeof value === 'string';
}

/** Checks whether a value is `null` or `undefined`. */
export function typeIsNil(value: unknown): value is null | undefined {
    // eslint-disable-next-line eqeqeq
    return value == null;
}
