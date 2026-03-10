/** Creates a shallow frozen copy of the given object. */
export function objectFreeze<TValue extends object>(value: TValue) {
    return Object.freeze({ ...value });
}