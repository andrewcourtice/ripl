export function isArray(value: unknown): value is any[] {
    return Array.isArray(value);
}

export function isObject(value: unknown): value is object {
    return typeof value === 'object';
}

export function isFunction(value: unknown): value is Function {
    return typeof value === 'function';
}

export function isNumber(value: unknown): value is number {
    return typeof value === 'number';
}

export function isString(value: unknown): value is string {
    return typeof value === 'string';
}

export function isNil(value: unknown): value is null | undefined {
    return value == null;
}