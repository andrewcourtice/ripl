import {
    AnyFunction,
} from './types';

export function typeIsArray(value: unknown): value is unknown[] {
    return Array.isArray(value);
}

export function typeIsDate(value: unknown): value is Date {
    return value instanceof Date;
}

export function typeIsObject(value: unknown): value is object {
    return value !== null && typeof value === 'object';
}

export function typeIsFunction(value: unknown): value is AnyFunction {
    return typeof value === 'function';
}

export function typeIsNumber(value: unknown): value is number {
    return typeof value === 'number';
}

export function typeIsString(value: unknown): value is string {
    return typeof value === 'string';
}

export function typeIsNil(value: unknown): value is null | undefined {
    // eslint-disable-next-line eqeqeq
    return value == null;
}
