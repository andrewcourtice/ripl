export function objectFreeze<TValue extends object>(value: TValue) {
    return Object.freeze({ ...value });
}